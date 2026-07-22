import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal, View, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { W } from '../constants/warm';
import WarmText from './WarmText';
import * as H from '../utils/haptics';
import { GreenButton } from './RoomBits';

/**
 * 오늘 미션 이름 수정 바텀시트.
 * 저장은 부모가 백엔드 API로 처리(onSubmit) — 방 멤버라면 누구나 수정할 수 있다.
 */
export default function EditMissionTitleModal({
  visible, icon, initialTitle = '', submitting = false, error = '', onClose, onSubmit,
}) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const [title, setTitle] = useState(initialTitle);

  // 열릴 때마다 현재 미션 제목으로 되돌린다 (이전 입력이 남지 않도록)
  useEffect(() => { if (visible) setTitle(initialTitle); }, [visible, initialTitle]);

  const trimmed = title.trim();
  const canSave = trimmed.length > 0 && trimmed !== initialTitle && !submitting;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.kvWrap}
        pointerEvents="box-none"
      >
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <WarmText v="section" size={18}>미션 이름 수정</WarmText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <WarmText v="sub" size={14} color={C.textSub}>닫기</WarmText>
            </TouchableOpacity>
          </View>

          <View style={s.inputRow}>
            {icon ? <WarmText size={22}>{icon}</WarmText> : null}
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="오늘의 미션을 적어주세요"
              placeholderTextColor={C.textSub}
              maxLength={100}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => { if (canSave) onSubmit?.(trimmed); }}
            />
          </View>

          <GreenButton
            label={submitting ? '저장 중…' : '저장하기'}
            disabled={!canSave}
            onPress={() => { H.success(); onSubmit?.(trimmed); }}
            style={{ marginTop: 14 }}
          />

          {error ? (
            <WarmText v="sub" size={13} color={C.coral} style={{ textAlign: 'center', marginTop: 10 }}>{error}</WarmText>
          ) : (
            <WarmText v="caption" size={12} color={C.textSub} style={{ textAlign: 'center', marginTop: 10 }}>
              방 멤버 모두에게 바뀐 이름이 보여요.
            </WarmText>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    kvWrap:   { flex: 1, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderTopWidth: 1, borderColor: C.greenBorder,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 14 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    input: {
      flex: 1, color: C.text, fontFamily: 'GmarketSansLight', fontSize: 15, padding: 0,
    },
  });
}
