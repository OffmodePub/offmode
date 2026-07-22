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
    List<RoomProofResponse> proofs,
    List<NudgeSenderResponse> receivedNudges,
    // 인증이 하나라도 올라오면 false — 미션 이름 수정 잠금 여부를 서버가 판단해 내려준다
    boolean missionEditable) {}
