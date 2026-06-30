package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.types.MemberTodayStatus;
import com.offmode.boundedcontext.room.types.RoomIconKey;
import com.offmode.boundedcontext.room.types.RoomType;
import java.util.List;

public record RoomDetailResponse(
    Long id,
    String name,
    RoomIconKey iconKey,
    RoomType type,
    String inviteCode,
    int memberCount,
    int streak,
    boolean isOwner,
    RoomMissionResponse todayMission,
    MemberTodayStatus myTodayStatus,
    ProgressResponse progress,
    List<RoomMemberResponse> members,
    List<RoomProofResponse> proofs) {}
