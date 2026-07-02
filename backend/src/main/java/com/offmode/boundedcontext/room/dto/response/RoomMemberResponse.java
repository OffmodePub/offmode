package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.types.MemberTodayStatus;
import com.offmode.boundedcontext.room.types.RoomRole;

public record RoomMemberResponse(
    Long memberId,
    Long userId,
    String nickname,
    String avatarId,
    RoomRole role,
    MemberTodayStatus todayStatus,
    boolean isMe,
    boolean nudgedByMe) {}
