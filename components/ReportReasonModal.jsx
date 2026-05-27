import React, { useMemo, useState } from 'react';
import {
  Modal, View, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useColors } from '../utils/useColors';
import T from '../components/ThemedText';
import * as H from '../utils/haptics';
import { REPORT_REASONS } from '../utils/reportMail';

export default function ReportReasonModal({ visible, targetUser, onClose, onSubmit }) {
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState('');

  const handleClose = () => {
    setSelected(null);
    setDetail('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selected) return;
    H.success();
    onSubmit({ reasonKey: selected, detail });
    setSelected(null);
    setDetail('');
  };

  const isOther = selected === 'OTHER';

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.kvWrap}
        pointerEvents="box-none"
      >
        <View style={s.sheet}>
          <View style={s.header}>
            <T v="section" size={19}>콘텐츠 신고</T>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <T v="sub" size={15} style={{ opacity: 0.6 }}>닫기</T>
            </TouchableOpacity>
          </View>
          {targetUser ? (
            <T v="sub" size={15} style={{ marginBottom: 14 }}>
              <T v="sub" size={15} color={C.text}>{targetUser}</T>님의 인증을 신고합니다.
            </T>
          ) : null}
          <T v="label" size={14} style={{ marginBottom: 10 }}>신고 사유를 선택해 주세요</T>
          <View style={s.reasonList}>
            {REPORT_REASONS.map(r => {
              const active = selected === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[s.reasonRow, active && s.reasonRowActive]}
                  onPress={() => { H.tap(); setSelected(r.key); }}
                  activeOpacity={0.7}
                >
                  <T v="body" size={16} style={active ? { color: C.green } : undefined}>{r.label}</T>
                  {active ? <T v="body" size={16} color={C.green}>✓</T> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          {isOther ? (
            <TextInput
              style={s.detailInput}
              value={detail}
              onChangeText={setDetail}
              placeholder="신고 사유를 자유롭게 적어주세요"
              placeholderTextColor={C.textSub}
              multiline
              maxLength={500}
            />
          ) : null}
          <TouchableOpacity
            style={[s.submitBtn, !selected && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!selected}
            activeOpacity={0.8}
          >
            <T v="btn" size={17} style={{ color: selected ? '#000' : C.textSub }}>메일 앱으로 신고하기</T>
          </TouchableOpacity>
          <T v="caption" size={13} style={{ textAlign: 'center', marginTop: 10 }}>
            신고 내용이 메일 앱에 자동으로 작성됩니다.
          </T>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    kvWrap:   { flex: 1, justifyContent: 'flex-end' },
    sheet:    {
      backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      borderTopWidth: 1, borderTopColor: C.border,
      paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28,
    },
    header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    reasonList: { gap: 8, marginBottom: 12 },
    reasonRow:  {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 14,
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2,
    },
    reasonRowActive: { borderColor: C.greenBorder, backgroundColor: C.greenFaint },
    detailInput: {
      marginTop: 4, marginBottom: 12,
      minHeight: 90, padding: 12,
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2,
      color: C.text, fontFamily: 'Kkukkukk', fontSize: 16,
      textAlignVertical: 'top',
    },
    submitBtn: {
      marginTop: 6, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
      backgroundColor: '#22c97a',
    },
    submitBtnDisabled: { backgroundColor: C.surface2 },
  });
}
