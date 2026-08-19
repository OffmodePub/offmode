import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { W } from '../constants/warm';
import { CHARACTER_BASE, PART_BY_KEY } from '../constants/parts';
import * as H from '../utils/haptics';
import WarmText from './WarmText';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

const PART_SIZE = 72;   // 배치 파츠 기본 렌더 크기(px, scale=1 기준)
const MIN_SCALE = 0.4;
const MAX_SCALE = 3;

/** 값을 [min, max] 범위로 제한 */
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/** 서버 placement → 편집 상태(누락 필드 기본값 보정) */
function normPlacement(pl) {
  return {
    x: pl?.x ?? 0.5,
    y: pl?.y ?? 0.5,
    scale: pl?.scale ?? 1,
    rotation: pl?.rotation ?? 0,
    z: pl?.z ?? 0,
  };
}

/* ── 배치된 파츠 1개 (드래그·핀치·회전 제스처) ───────────────── */
function PlacedPart({ item, cardW, cardH, image, selected, onSelect, onChange }) {
  // 중심 좌표(px)와 변형값을 shared value로 관리
  const posX = useSharedValue(item.x * cardW);
  const posY = useSharedValue(item.y * cardH);
  const scale = useSharedValue(item.scale);
  const rot = useSharedValue(item.rotation);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRot = useSharedValue(0);

  // 카드 크기 확정/외부 변경 시 shared value 동기화
  useEffect(() => {
    posX.value = item.x * cardW;
    posY.value = item.y * cardH;
    scale.value = item.scale;
    rot.value = item.rotation;
  }, [cardW, cardH, item.x, item.y, item.scale, item.rotation, posX, posY, scale, rot]);

  const commit = useCallback(() => {
    // 카드 밖으로 드래그해도 서버 검증(0~1)과 어긋나지 않도록 clamp 후 저장
    onChange({
      x: clamp(cardW ? posX.value / cardW : item.x, 0, 1),
      y: clamp(cardH ? posY.value / cardH : item.y, 0, 1),
      scale: scale.value,
      rotation: rot.value,
    });
  }, [onChange, cardW, cardH, item.x, item.y, posX, posY, scale, rot]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = posX.value;
      startY.value = posY.value;
      runOnJS(onSelect)();
    })
    .onUpdate((e) => {
      posX.value = startX.value + e.translationX;
      posY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
      runOnJS(onSelect)();
    })
    .onUpdate((e) => {
      const next = startScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const rotation = Gesture.Rotation()
    .onStart(() => {
      startRot.value = rot.value;
      runOnJS(onSelect)();
    })
    .onUpdate((e) => {
      rot.value = startRot.value + (e.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const composed = Gesture.Simultaneous(pan, pinch, rotation);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value - PART_SIZE / 2 },
      { translateY: posY.value - PART_SIZE / 2 },
      { scale: scale.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[s.placed, aStyle]}>
        {selected && <View style={s.selRing} pointerEvents="none" />}
        <Image source={image} style={s.placedImg} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * 캐릭터 스티커 꾸미기 편집기 (#107).
 * 해금된 파츠를 캐릭터 카드 위에 자유 배치 → 제스처로 위치·크기·각도 조정 → 저장.
 *
 * @param {Array}    parts            병합된 파츠 배열 (key·name·image·unlockThreshold·unlocked·placement)
 * @param {object}   [characterSource] 캐릭터 베이스 이미지
 * @param {function} onSaveLayout     placements 배열을 서버에 저장하는 콜백
 */
export default function CharacterDecor({ parts, characterSource = CHARACTER_BASE, onSaveLayout }) {
  const [placed, setPlaced] = useState([]);       // [{ key, x, y, scale, rotation, z }]
  const [selectedKey, setSelectedKey] = useState(null);
  const [card, setCard] = useState({ w: 0, h: 0 });
  const cardShotRef = useRef(null);
  const [saving, setSaving] = useState(false);  // 추가

  // 서버 placement → 편집 상태 초기화(로드/새로고침/저장 후)
  useEffect(() => {
    const init = parts
      .filter((p) => p.placement)
      .map((p) => ({ key: p.key, ...normPlacement(p.placement) }));
    setPlaced(init);
    setSelectedKey(null);
  }, [parts]);

  const onCardLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setCard({ w: width, h: height });
  }, []);

  const updatePlacement = useCallback((key, patch) => {
    setPlaced((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }, []);

  const topZ = () => placed.reduce((m, p) => Math.max(m, p.z ?? 0), 0);

  // 그리드 파츠 탭 → 추가 / 이미 배치됐으면 제거(토글) / 잠김이면 안내
  const handlePressPart = (part) => {
    if (!part.unlocked) {
      H.tap();
      Alert.alert(
        '아직 잠긴 파츠예요',
        part.unlockThreshold != null
          ? `인증을 ${part.unlockThreshold}번 모으면 열려요`
          : '준비 중이에요',
      );
      return;
    }
    H.tap();
    const already = placed.some((p) => p.key === part.key);
    if (already) {
      setPlaced((prev) => prev.filter((p) => p.key !== part.key));
      if (selectedKey === part.key) setSelectedKey(null);
      return;
    }
    setPlaced((prev) => [
      ...prev,
      { key: part.key, x: 0.5, y: 0.5, scale: 1, rotation: 0, z: topZ() + 1 },
    ]);
    setSelectedKey(part.key);
  };

  const deleteSelected = () => {
    if (!selectedKey) return;
    H.tap();
    setPlaced((prev) => prev.filter((p) => p.key !== selectedKey));
    setSelectedKey(null);
  };

  const bringSelectedToFront = () => {
    if (!selectedKey) return;
    H.tap();
    const nextZ = topZ() + 1;
    setPlaced((prev) => prev.map((p) => (p.key === selectedKey ? { ...p, z: nextZ } : p)));
  };

  const handleSave = () => {
    const placements = placed.map((p) => ({
      key: p.key, x: p.x, y: p.y, scale: p.scale, rotation: p.rotation, z: p.z,
    }));
    onSaveLayout?.(placements);
  };

  const selectedPart = selectedKey ? PART_BY_KEY[selectedKey] : null;
  const sortedPlaced = [...placed].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

      const handleSaveImage = async () => {
        if (saving) return;               // 중복 클릭 방지
        if (!cardShotRef.current) return; // 마운트 전 가드
        setSaving(true);
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync(true); // writeOnly
          if (status !== 'granted') {
            Alert.alert('권한 필요', '갤러리 접근 권한을 허용해주세요!');
            return;
          }
        setSelectedKey(null); // 캡처 전 선택 해제 (테두리 안 찍히게)
        requestAnimationFrame(async () => {
          try {
            if (!cardShotRef.current) return;
            const uri = await cardShotRef.current.capture();
            await MediaLibrary.saveToLibraryAsync(uri);
            H.success();
            Alert.alert('저장 완료', '캐릭터 이미지가 갤러리에 저장됐어요!');
          } catch (e) {
            if (__DEV__) console.warn('[CharacterDecor] 이미지 저장 실패', e);
            Alert.alert('저장 실패', '이미지를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
          } finally {
            setSaving(false);
          }
        });
                } catch (e) {
          if (__DEV__) console.warn('[CharacterDecor] 이미지 저장 실패', e);
          Alert.alert('저장 실패', '이미지를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
          setSaving(false);
        }
      };

  return (
    <View style={s.wrap}>
      {/* 캐릭터 카드 (편집 캔버스) */}
      <ViewShot ref={cardShotRef} style={s.shot} options={{ format: 'png', quality: 1 }}>
        <View style={s.card} onLayout={onCardLayout}>
          <Image source={characterSource} style={s.character} resizeMode="contain" />

          {/* 빈 곳 탭 → 선택 해제 */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedKey(null)}
          />

          {/* 배치된 파츠 */}
          {card.w > 0 && sortedPlaced.map((item) => {
            const meta = PART_BY_KEY[item.key];
            if (!meta) return null;
            return (
              <PlacedPart
                key={item.key}
                item={item}
                cardW={card.w}
                cardH={card.h}
                image={meta.image}
                selected={selectedKey === item.key}
                onSelect={() => setSelectedKey(item.key)}
                onChange={(patch) => updatePlacement(item.key, patch)}
              />
            );
          })}
        </View>
      </ViewShot>

      {/* 선택된 파츠 툴바 */}
      {selectedPart ? (
        <View style={s.toolbar}>
          <WarmText size={13} color={W.text} style={s.toolbarName}>{selectedPart.name}</WarmText>
          <TouchableOpacity style={s.toolBtn} onPress={bringSelectedToFront} activeOpacity={0.7}>
            <WarmText size={12} color={W.text}>맨 앞으로</WarmText>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toolBtn, s.toolBtnDanger]} onPress={deleteSelected} activeOpacity={0.7}>
            <WarmText size={12} color={W.coral}>삭제</WarmText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.guide}>
          <WarmText v="sub" style={s.guideLine}>
            아래 파츠를 눌러 캐릭터 위에 올려보세요
          </WarmText>
          <WarmText v="sub" style={s.guideLine}>
            드래그로 이동 · 두 손가락으로 크기·회전
          </WarmText>
        </View>
      )}

      {/* 파츠 그리드 (4열) */}
      <View style={s.grid}>
        {parts.map((part) => {
          const isPlaced = placed.some((p) => p.key === part.key);
          const cellStyle = [
            s.pill,
            isPlaced ? s.pillEquipped : s.pillDefault,
            !part.unlocked && s.pillLocked,
          ];
          return (
            <View key={part.key} style={s.cellWrap}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handlePressPart(part)}>
                <View style={cellStyle}>
                  <Image source={part.image} style={s.partImg} resizeMode="contain" />
                  {isPlaced && (
                    <View style={s.placedBadge}>
                      <WarmText size={9} color={W.white}>배치됨</WarmText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* 저장 버튼 (웜 톤) */}
      <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <WarmText v="btn" size={15} color={W.white}>꾸미기 저장</WarmText>
      </TouchableOpacity>

      {/* 이미지로 저장 (갤러리) */}
      <TouchableOpacity
        style={[s.imageSaveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSaveImage}
        activeOpacity={0.85}
        disabled={saving}
      >
        <WarmText v="btn" size={15} color={W.brown}>
          {saving ? '저장 중...' : '이미지로 저장'}
        </WarmText>
      </TouchableOpacity>

      {/* 푸터 */}
      <WarmText v="caption" size={10} color={W.text} style={s.footer}>
        To Be Continued. . .
      </WarmText>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 30, alignItems: 'center', gap: 10 },
  card: {
    alignSelf: 'stretch',
    height: 270,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: W.borderStrong,
    backgroundColor: W.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  character: { width: 250, height: 250 },

  /* 배치 파츠 */
  placed: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: PART_SIZE,
    height: PART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placedImg: { width: PART_SIZE, height: PART_SIZE },
  selRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: W.brown,
    borderStyle: 'dashed',
  },

  /* 툴바 / 안내 */
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
    backgroundColor: W.neutralFaint,
    borderWidth: 1,
    borderColor: W.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  toolbarName: { flex: 1 },
  toolBtn: {
    backgroundColor: W.surface,
    borderWidth: 1,
    borderColor: W.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toolBtnDanger: { borderColor: W.coralBorder, backgroundColor: W.coralFaint },
  guide: { alignItems: 'center', marginTop: 2 },
  guideLine: { textAlign: 'center', lineHeight: 18 },

  /* 그리드 */
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'stretch', rowGap: 10, marginTop: 4 },
  cellWrap: { width: '25%', alignItems: 'center' },
  pill: {
    width: 80,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillDefault: { backgroundColor: W.surface, borderColor: W.borderStrong },
  pillEquipped: { backgroundColor: 'rgba(168,149,138,0.3)', borderColor: W.brown }, // Figma 장착 상태 30% 틴트
  pillLocked: { opacity: 0.3 },
  partImg: { width: 48, height: 48 },
  placedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: W.brown,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },

  /* 저장 버튼 */
  saveBtn: {
    alignSelf: 'stretch',
    backgroundColor: W.green,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  footer: { textAlign: 'center', marginTop: 6 },
  imageSaveBtn: {
    alignSelf: 'stretch',
    backgroundColor: W.surface,
    borderWidth: 1,
    borderColor: W.borderStrong,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
});
