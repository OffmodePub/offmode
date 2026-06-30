import React, { useMemo, useState, useRef } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, Image,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomTopBar, GreenButton } from '../components/RoomBits';
import { roomIconEmoji } from '../constants/rooms';

const F = 'GmarketSansLight';

function pad(n) { return String(n).padStart(2, '0'); }
function nowLabel() {
  const d = new Date();
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PermissionScreen({ onRequest }) {
  const C = W;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <WarmText size={60} style={{ marginBottom: 8 }}>📷</WarmText>
      <WarmText v="title" style={{ textAlign: 'center' }}>카메라 권한이 필요해요</WarmText>
      <WarmText v="body" color={C.textSub} style={{ textAlign: 'center', lineHeight: 22 }}>
        미션 인증 사진을 찍으려면{'\n'}카메라 접근을 허용해주세요
      </WarmText>
      <GreenButton label="카메라 허용하기" onPress={onRequest} style={{ marginTop: 8, paddingHorizontal: 8 }} />
    </View>
  );
}

export default function RoomVerifyScreen({ room, onBack, onVerified }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [facing, setFacing] = useState('back');
  const [caption, setCaption] = useState('');
  const [timestamp, setTimestamp] = useState(nowLabel);
  const [submitting, setSubmitting] = useState(false);

  const cameraRef = useRef(null);
  const scrollRef = useRef(null);
  const shutterScale = useRef(new Animated.Value(1)).current;

  const mission = room?.todayMission;

  const handleShutter = async () => {
    if (!cameraRef.current) return;
    H.tap();
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      setPhotoUri(photo.uri);
      setTimestamp(nowLabel());
    } catch (e) {
      console.warn('사진 촬영 오류:', e);
    }
  };

  const handleSubmit = async () => {
    if (!photoUri || submitting) return;
    Keyboard.dismiss();
    H.success();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' });
      if (caption) formData.append('caption', caption);
      await api.upload(`/api/v1/rooms/${room.id}/proofs`, formData);
      onVerified?.();
    } catch (e) {
      console.warn('인증 업로드 실패:', e);
      setSubmitting(false);
    }
  };

  return (
    <View style={s.screen}>
      <RoomTopBar title="미션 인증" onBack={onBack} />

      {!permission?.granted ? (
        <PermissionScreen onRequest={requestPermission} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView ref={scrollRef} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.roomBadge}>
              <WarmText v="caption" color={C.green}>{roomIconEmoji(room?.iconKey)} {room?.name} · 오늘의 미션 인증</WarmText>
            </View>

            <View style={s.missionInfo}>
              <WarmText size={26}>{mission?.icon ?? '📋'}</WarmText>
              <View style={{ flex: 1 }}>
                <WarmText v="caption" color={C.green} style={{ marginBottom: 2 }}>오늘의 미션</WarmText>
                <WarmText v="body">{mission?.title ?? '미션 완료하기'}</WarmText>
              </View>
            </View>

            {!photoUri ? (
              <View style={s.cameraWrap}>
                <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                  <View style={s.tsTop}><WarmText v="sub" color="#fff">🕐 {timestamp}</WarmText></View>
                  <TouchableOpacity style={s.flipBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} activeOpacity={0.7}>
                    <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  <View style={s.shutterRow}>
                    <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
                      <TouchableOpacity style={s.shutter} onPress={handleShutter} activeOpacity={0.8}>
                        <View style={s.shutterInner} />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.takenWrap}>
                <Image source={{ uri: photoUri }} style={s.takenPhoto} resizeMode="cover" />
                <View style={s.takenTs}><WarmText v="caption" color="#fff">{timestamp}</WarmText></View>
                <TouchableOpacity style={s.retakeBtn} onPress={() => setPhotoUri(null)} activeOpacity={0.7}>
                  <WarmText v="sub">다시 찍기</WarmText>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.captionWrap}>
              <WarmText v="label">한마디 남기기 (선택)</WarmText>
              <TextInput
                style={s.captionInput}
                placeholder="오늘 미션 어떠셨나요?"
                placeholderTextColor={C.textSub}
                value={caption}
                onChangeText={setCaption}
                maxLength={80}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
              />
              <WarmText v="caption" style={{ opacity: 0.5, textAlign: 'right' }}>{caption.length}/80</WarmText>
            </View>

            <GreenButton
              label={submitting ? '업로드 중…' : (photoUri ? '인증 완료하기' : '사진을 먼저 찍어주세요')}
              disabled={!photoUri || submitting}
              onPress={handleSubmit}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    roomBadge: { alignSelf: 'flex-start', backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
    missionInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12 },
    cameraWrap: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, height: 360 },
    tsTop: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
    flipBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
    shutterRow: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 16, alignItems: 'center' },
    shutter: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },
    takenWrap: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.greenBorder },
    takenPhoto: { width: '100%', height: 320 },
    takenTs: { position: 'absolute', bottom: 44, left: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    retakeBtn: { backgroundColor: C.surface2, paddingVertical: 11, alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border },
    captionWrap: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 6 },
    captionInput: { fontFamily: F, fontSize: 14, color: C.text, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 6 },
  });
}
