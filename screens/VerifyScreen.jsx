import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, TextInput, ScrollView, Image,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { api } from '../utils/api';
import T from '../components/ThemedText';

const F = 'Kkukkukk';

const PHOTO_GRADS = [
  ['#87ceeb', '#2a7ab8'], ['#acd8a7', '#2e7d4f'], ['#c3aef0', '#5a2da0'],
  ['#ffd180', '#e65100'], ['#90caf9', '#1a3a6a'],
];

function pad(n) { return String(n).padStart(2, '0'); }
function nowLabel() {
  const d = new Date();
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function VerifiedCard({ mission, caption, photoUri, grad, timestamp, onDone }) {
  const C = useColors();
  const card = useMemo(() => makeCardStyles(C), [C]);
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={card.screen}>
      <Animated.View style={[card.wrap, { opacity, transform: [{ scale }] }]}>
        <View style={card.card}>
          {photoUri ? (
            <View style={card.photoWrap}>
              <Image source={{ uri: photoUri }} style={card.photo} resizeMode="cover" />
              <View style={card.hipBadge}><T v="caption" color="#000">HIP</T></View>
              <View style={card.tsBar}>
                <T v="green">{timestamp.split('  ')[1]}</T>
                <T v="sub" color="#fff"> 미션 완료</T>
              </View>
            </View>
          ) : (
            <LinearGradient colors={grad} style={card.photo}>
              <View style={card.photoCenter}>
                <Text style={card.missionIcon}>{mission?.icon ?? '📸'}</Text>
              </View>
              <View style={card.hipBadge}><T v="caption" color="#000">HIP</T></View>
              <View style={card.tsBar}>
                <T v="green">{timestamp.split('  ')[1]}</T>
                <T v="sub" color="#fff"> 미션 완료</T>
              </View>
            </LinearGradient>
          )}
          <View style={card.footer}>
            <T v="caption">{timestamp}</T>
            {caption ? <T v="sub" color={C.text}>{caption}</T> : null}
            <T v="label" style={{ opacity: 0.7 }}>{mission?.text ?? '미션 완료'}</T>
          </View>
        </View>
        <T v="title">인증이 완료됐어요! 🎉</T>
        <T v="sub" style={{ marginTop: -8 }}>다른 사람들의 리액션을 기다려봐요</T>
        <TouchableOpacity onPress={onDone} activeOpacity={0.85} style={{ width: '100%' }}>
          <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={card.doneBtn}>
            <Text style={card.doneBtnText}>확인</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function makeCardStyles(C) {
  return StyleSheet.create({
    screen:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 10 },
    wrap:        { width: '100%', alignItems: 'center', gap: 16 },
    card:        { width: '100%', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.greenBorder, backgroundColor: C.surface },
    photoWrap:   { height: 200, position: 'relative' },
    photo:       { height: 200, justifyContent: 'flex-end', width: '100%' },
    photoCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    missionIcon: { fontSize: 56 },
    hipBadge:    { position: 'absolute', top: 12, right: 12, backgroundColor: C.green, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    tsBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', position: 'absolute', bottom: 10, left: 10, right: 10, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    footer:      { padding: 14, gap: 4 },
    doneBtn:     { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    doneBtnText: { fontFamily: F, fontSize: 16, color: '#000' },
  });
}

function PermissionScreen({ onRequest }) {
  const C = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <Text style={{ fontSize: 60, marginBottom: 8 }}>📷</Text>
      <T v="title" style={{ textAlign: 'center' }}>카메라 권한이 필요해요</T>
      <T v="body" color={C.textSub} style={{ textAlign: 'center', lineHeight: 22 }}>
        미션 인증 사진을 찍으려면{'\n'}카메라 접근을 허용해주세요
      </T>
      <TouchableOpacity onPress={onRequest} activeOpacity={0.85}>
        <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center' }}>
          <T v="btn">카메라 허용하기</T>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

export default function VerifyScreen({ mission, userMissionId, onBack, onVerified }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri,  setPhotoUri]  = useState(null);
  const [facing,    setFacing]    = useState('back');
  const [caption,   setCaption]   = useState('');
  const [timestamp, setTimestamp] = useState(nowLabel);
  const [done,      setDone]      = useState(false);
  const [gradIdx]   = useState(() => Math.floor(Math.random() * PHOTO_GRADS.length));

  const cameraRef    = useRef(null);
  const scrollRef    = useRef(null);
  const shutterScale = useRef(new Animated.Value(1)).current;

  const handleShutter = async () => {
    if (!cameraRef.current) return;
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80,  useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
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
    Keyboard.dismiss();
    if (userMissionId) {
      try {
        const formData = new FormData();
        formData.append('userMissionId', String(userMissionId));
        if (photoUri) {
          formData.append('photo', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' });
        }
        if (caption) formData.append('caption', caption);
        await api.upload('/api/feed/verify', formData);
      } catch (e) {
        console.warn('인증 업로드 실패:', e);
      }
    }
    setDone(true);
  };
  const handleDone   = () => { onVerified?.(photoUri); onBack?.(); };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <T v="section" size={17}>미션 인증</T>
        {permission?.granted && !photoUri ? (
          <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} activeOpacity={0.7}>
            <Text style={styles.flipIcon}>🔄</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {!permission?.granted ? (
        <PermissionScreen onRequest={requestPermission} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.missionInfo}>
              <Text style={styles.missionInfoIcon}>{mission?.icon ?? '📋'}</Text>
              <View style={{ flex: 1 }}>
                <T v="caption" color={C.green} style={{ opacity: 0.8, marginBottom: 2 }}>오늘의 미션</T>
                <T v="body">{mission?.text ?? '미션 완료하기'}</T>
              </View>
            </View>

            {!photoUri ? (
              <View style={styles.cameraWrap}>
                <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
                  <View style={[styles.corner, { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 }]} />
                  <View style={[styles.corner, { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 }]} />
                  <View style={[styles.corner, { bottom: 72, left: 12, borderRightWidth: 0, borderTopWidth: 0 }]} />
                  <View style={[styles.corner, { bottom: 72, right: 12, borderLeftWidth: 0, borderTopWidth: 0 }]} />
                  <View style={styles.shutterRow}>
                    <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
                      <TouchableOpacity style={styles.shutter} onPress={handleShutter} activeOpacity={0.8}>
                        <View style={styles.shutterInner} />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </CameraView>
              </View>
            ) : (
              <View style={styles.takenPhotoWrap}>
                <Image source={{ uri: photoUri }} style={styles.takenPhoto} resizeMode="cover" />
                <View style={styles.takenPhotoTs}><T v="caption" color={C.green}>{timestamp}</T></View>
                <View style={styles.takenHipBadge}><T v="caption" color="#000">HIP</T></View>
                <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhotoUri(null)} activeOpacity={0.7}>
                  <T v="sub">다시 찍기</T>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.tsRow}>
              <Text style={styles.tsIcon}>🕐</Text>
              <T v="sub">{timestamp}</T>
            </View>

            <View style={styles.captionWrap}>
              <T v="label">한마디 남기기 (선택)</T>
              <TextInput
                style={styles.captionInput}
                placeholder="오늘 미션 어떠셨나요?"
                placeholderTextColor={C.textSub}
                value={caption}
                onChangeText={setCaption}
                maxLength={50}
                onFocus={() => { setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 100); }}
              />
              <T v="caption" style={{ opacity: 0.5, textAlign: 'right' }}>{caption.length}/50</T>
            </View>

            <TouchableOpacity onPress={handleSubmit} activeOpacity={photoUri ? 0.85 : 0.4} disabled={!photoUri}>
              <LinearGradient
                colors={photoUri ? ['#26d67a', '#1ab065'] : [C.surface2, C.surface]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <T v="btn" style={!photoUri ? { color: C.textSub } : undefined}>
                  {photoUri ? '인증 완료하기' : '사진을 먼저 찍어주세요'}
                </T>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {done && (
        <VerifiedCard
          mission={mission} caption={caption} photoUri={photoUri}
          grad={PHOTO_GRADS[gradIdx]} timestamp={timestamp} onDone={handleDone}
        />
      )}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    backIcon:    { fontSize: 20, color: C.text },
    flipBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    flipIcon:    { fontSize: 18 },
    content:     { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    missionInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.greenBorder, paddingHorizontal: 14, paddingVertical: 12 },
    missionInfoIcon:  { fontSize: 28 },
    cameraWrap:  { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, height: 320 },
    camera:      { flex: 1 },
    corner:      { position: 'absolute', width: 22, height: 22, borderColor: C.green, borderWidth: 2.5 },
    shutterRow:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 14, alignItems: 'center' },
    shutter:     { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },
    takenPhotoWrap:   { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.greenBorder },
    takenPhoto:       { width: '100%', height: 280 },
    takenPhotoTs:     { position: 'absolute', bottom: 44, left: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    takenHipBadge:    { position: 'absolute', top: 12, right: 12, backgroundColor: C.green, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    retakeBtn:        { backgroundColor: C.surface2, paddingVertical: 11, alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border },
    tsRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10 },
    tsIcon:      { fontSize: 15 },
    captionWrap: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 6 },
    captionInput: { fontFamily: F, fontSize: 14, color: C.text, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 6 },
    submitBtn:    { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  });
}
