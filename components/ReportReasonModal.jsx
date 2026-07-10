import React, { useMemo, useState } from 'react';
import {
  Modal, View, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { W } from '../constants/warm';
import WarmText from './WarmText';
import * as H from '../utils/haptics';
import { GreenButton } from './RoomBits';
import { REPORT_REASONS } from '../utils/reportMail';

/**
 * 콘텐츠 신고 바텀시트 (Figma: Mission · Report 345:240).
 * 방 인증(RoomProof) 신고용 — 사유 5종 선택 + 기타 자유입력.
 * 제출은 부모가 백엔드 API로 처리(onSubmit). 웜 크림 톤.
 */
export default function ReportReasonModal({ visible, targetUser, submitting = false, onClose, onSubmit }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState('');

  const handleClose = () => {
    setSelected(null);
    setDetail('');
    onClose?.();
  };

  const handleSubmit = () => {
    if (!selected || submitting) return;
    H.success();
    onSubmit?.({ reasonKey: selected, detail });
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
          <View style={s.handle} />
          <View style={s.header}>
            <WarmText v="section" size={18}>콘텐츠 신고</WarmText>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <WarmText v="sub" size={14} color={C.textSub}>닫기</WarmText>
            </TouchableOpacity>
          </View>

          {targetUser ? (
            <WarmText v="sub" size={14} color={C.textSub} style={{ marginBottom: 14 }}>
              <WarmText v="sub" size={14} color={C.text}>{targetUser}</WarmText>님의 인증을 신고해요.
            </WarmText>
          ) : null}

          <WarmText v="label" size={12} color={C.textSub} style={{ marginBottom: 10 }}>신고 사유를 선택해주세요</WarmText>
          <View style={s.reasonList}>
            {REPORT_REASONS.map(r => {
              const active = selected === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[s.reasonRow, active && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
                  onPress={() => { H.tap(); setSelected(r.key); }}
                  activeOpacity={0.7}
                >
                  <WarmText v="body" size={15} color={active ? C.green : C.text}>{r.label}</WarmText>
                  {active ? <WarmText v="body" size={15} color={C.green}>✓</WarmText> : null}
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

          <GreenButton
            label={submitting ? '접수 중…' : '신고하기'}
            disabled={!selected || submitting}
            onPress={handleSubmit}
            style={{ marginTop: 6 }}
          />
          <WarmText v="caption" size={12} color={C.textSub} style={{ textAlign: 'center', marginTop: 10 }}>
            신고가 접수되면 운영자가 확인해요.
          </WarmText>
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
    reasonList: { gap: 8, marginBottom: 12 },
    reasonRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 14,
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2,
    },
    detailInput: {
      marginTop: 4, marginBottom: 12, minHeight: 90, padding: 12,
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2,
      color: C.text, fontFamily: 'GmarketSansLight', fontSize: 15,
      textAlignVertical: 'top',
    },
  });
}
