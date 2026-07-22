package com.offmode.boundedcontext.room.dto.response;

/** 오늘 나를 콕 찌른 사람 (방 상세에서 배너로 노출) */
public record NudgeSenderResponse(Long userId, String nickname, String avatarId) {}
