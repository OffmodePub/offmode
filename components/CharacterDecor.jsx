import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { W } from '../constants/warm';
import { CHARACTER_BASE } from '../constants/parts';
import WarmText from './WarmText';

/**
 * 캐릭터 꾸미기 섹션 (웜 크림 리디자인, Figma node 442:329).
 * 정적/프레젠테이셔널 컴포넌트 — 해금/장착 상태는 props로 받는다.
 *
 * @param {Array}  parts        buildPartsState() 결과 (key·name·order·image·unlocked·equipped)
 * @param {object} [characterSource]  캐릭터 베이스 이미지 (기본: CHARACTER_BASE)
 * @param {function} [onPressPart] 파츠 탭 핸들러 (#107). 없으면 비활성(정적).
 */
export default function CharacterDecor({ parts, characterSource = CHARACTER_BASE, onPressPart }) {
  return (
    <View style={s.wrap}>
      {/* 캐릭터 카드 */}
      <View style={s.card}>
        <Image source={characterSource} style={s.character} resizeMode="contain" />
      </View>

      {/* 안내 문구 */}
      <View style={s.guide}>
        <WarmText v="sub" style={s.guideLine}>
          캐릭터를 자유롭게 꾸며 보세요
        </WarmText>
        <WarmText v="sub" style={s.guideLine}>
          꾸준히 미션을 성공하면 새로운 파츠가 열려요
        </WarmText>
      </View>

      {/* 파츠 그리드 (4열) */}
      <View style={s.grid}>
        {parts.map((part) => {
          const cellStyle = [
            s.pill,
            part.equipped ? s.pillEquipped : s.pillDefault,
            !part.unlocked && s.pillLocked,
          ];
          const content = (
            <View style={cellStyle}>
              <Image source={part.image} style={s.partImg} resizeMode="contain" />
            </View>
          );
          return (
            <View key={part.key} style={s.cellWrap}>
              {onPressPart ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => onPressPart(part)}>
                  {content}
                </TouchableOpacity>
              ) : (
                content
              )}
            </View>
          );
        })}
      </View>

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
    backgroundColor: 'rgba(168,149,138,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  character: { width: 250, height: 250 },
  guide: { alignItems: 'center', marginTop: 2 },
  guideLine: { textAlign: 'center', lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'stretch', rowGap: 10, marginTop: 4 },
  cellWrap: { width: '25%', alignItems: 'center' },
  pill: {
    width: 80,
    height: 44,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillDefault: { backgroundColor: W.surface, borderColor: W.borderStrong },
  pillEquipped: { backgroundColor: 'rgba(168,149,138,0.3)', borderColor: W.brown },
  pillLocked: { opacity: 0.3 },
  partImg: { width: 48, height: 48 },
  footer: { textAlign: 'center', marginTop: 6 },
});
