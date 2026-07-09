package com.offmode.boundedcontext.room.service;

import com.offmode.boundedcontext.room.dto.request.CreateRoomRequest;
import com.offmode.boundedcontext.room.dto.request.JoinRoomRequest;
import com.offmode.boundedcontext.room.dto.response.GroupRoomSummaryResponse;
import com.offmode.boundedcontext.room.dto.response.MiniMissionResponse;
import com.offmode.boundedcontext.room.dto.response.NudgeResponse;
import com.offmode.boundedcontext.room.dto.response.ProgressResponse;
import com.offmode.boundedcontext.room.dto.response.RoomDetailResponse;
import com.offmode.boundedcontext.room.dto.response.RoomListResponse;
import com.offmode.boundedcontext.room.dto.response.RoomMemberResponse;
import com.offmode.boundedcontext.room.dto.response.RoomMissionResponse;
import com.offmode.boundedcontext.room.dto.response.RoomProofResponse;
import com.offmode.boundedcontext.room.dto.response.SoloRoomSummaryResponse;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMember;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.entity.RoomNudge;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.repository.RoomMemberRepository;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomNudgeRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomRepository;
import com.offmode.boundedcontext.room.types.MemberTodayStatus;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomRole;
import com.offmode.boundedcontext.room.types.RoomType;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.BlockService;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

  private static final int INVITE_CODE_MAX_ATTEMPTS = 20;

  private final RoomRepository roomRepository;
  private final RoomMemberRepository memberRepository;
  private final RoomMissionRepository missionRepository;
  private final RoomProofRepository proofRepository;
  private final RoomNudgeRepository nudgeRepository;
  private final UserService userService;
  private final RoomProofAssembler proofAssembler;
  private final BlockService blockService;

  // ===== 방 생성/참여/목록 =====

  @Transactional
  public RoomDetailResponse createRoom(Long userId, CreateRoomRequest request) {
    User user = userService.getById(userId);
    String inviteCode = request.getType() == RoomType.GROUP ? generateUniqueInviteCode() : null;

    Room room =
        roomRepository.save(
            Room.builder()
                .name(request.getName())
                .iconKey(request.getIconKey())
                .type(request.getType())
                .inviteCode(inviteCode)
                .build());

    memberRepository.save(RoomMember.builder().room(room).user(user).role(RoomRole.OWNER).build());

    return getDetail(userId, room.getId());
  }

  @Transactional
  public RoomDetailResponse join(Long userId, JoinRoomRequest request) {
    Room room =
        roomRepository
            .findByInviteCode(request.getInviteCode())
            .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_INVITE_CODE_NOT_FOUND));

    if (memberRepository.existsByRoomIdAndUserId(room.getId(), userId)) {
      throw new BusinessException(ErrorStatus.ROOM_ALREADY_JOINED);
    }

    User user = userService.getById(userId);
    memberRepository.save(RoomMember.builder().room(room).user(user).role(RoomRole.MEMBER).build());

    return getDetail(userId, room.getId());
  }

  @Transactional(readOnly = true)
  public RoomListResponse getMyRooms(Long userId) {
    List<RoomMember> memberships = memberRepository.findWithRoomByUserId(userId);
    memberships.sort(Comparator.comparing(RoomMember::getJoinedAt));

    SoloRoomSummaryResponse soloRoom = null;
    List<GroupRoomSummaryResponse> groupRooms = new ArrayList<>();
    LocalDate today = LocalDate.now();

    // 오늘 미션·멤버 수·달성 수를 방 개수와 무관하게 상수 쿼리로 배치 조회한다.
    List<Long> roomIds = memberships.stream().map(m -> m.getRoom().getId()).toList();
    Map<Long, RoomMission> todayMissions =
        roomIds.isEmpty()
            ? Map.of()
            : missionRepository.findByRoomIdInAndDate(roomIds, today).stream()
                .collect(
                    Collectors.toMap(mission -> mission.getRoom().getId(), mission -> mission));
    Map<Long, Long> memberCounts =
        roomIds.isEmpty() ? Map.of() : toCountMap(memberRepository.countRowsByRoomIdIn(roomIds));
    List<Long> missionIds = todayMissions.values().stream().map(RoomMission::getId).toList();
    Map<Long, Long> verifiedCounts =
        missionIds.isEmpty()
            ? Map.of()
            : toCountMap(
                proofRepository.countRowsByRoomMissionIdInAndStatus(
                    missionIds, ProofStatus.VERIFIED));

    for (RoomMember membership : memberships) {
      Room room = membership.getRoom();
      RoomMission todayMission = todayMissions.get(room.getId());
      MiniMissionResponse mini =
          todayMission == null
              ? null
              : new MiniMissionResponse(todayMission.getIcon(), todayMission.getTitle());

      if (room.getType() == RoomType.SOLO) {
        if (soloRoom != null) continue; // 첫 SOLO 방만 노출
        boolean done =
            todayMission != null
                && computeTodayStatus(todayMission.getId(), userId) == MemberTodayStatus.DONE;
        soloRoom =
            new SoloRoomSummaryResponse(
                room.getId(),
                room.getName(),
                room.getIconKey(),
                room.getType(),
                memberCounts.getOrDefault(room.getId(), 0L).intValue(),
                mini,
                done);
      } else {
        int memberCount = memberCounts.getOrDefault(room.getId(), 0L).intValue();
        int verifiedCount =
            todayMission == null
                ? 0
                : verifiedCounts.getOrDefault(todayMission.getId(), 0L).intValue();
        groupRooms.add(
            new GroupRoomSummaryResponse(
                room.getId(),
                room.getName(),
                room.getIconKey(),
                room.getType(),
                memberCount,
                mini,
                verifiedCount,
                memberCount));
      }
    }

    return new RoomListResponse(soloRoom, groupRooms);
  }

  // ===== 방 상세 =====

  @Transactional(readOnly = true)
  public RoomDetailResponse getDetail(Long userId, Long roomId) {
    Room room = getRoomOrThrow(roomId);
    RoomMember myMembership = getMembershipOrThrow(roomId, userId);

    List<RoomMember> memberEntities =
        memberRepository.findWithUserByRoomIdOrderByJoinedAtAsc(roomId);
    int memberCount = memberEntities.size();
    int requiredConfirm = requiredConfirm(room.getType(), memberCount);
    LocalDate today = LocalDate.now();

    RoomMission todayMission = missionRepository.findByRoomIdAndDate(roomId, today).orElse(null);
    RoomMissionResponse missionResponse =
        todayMission == null ? null : RoomMissionResponse.from(todayMission);

    Long missionId = todayMission == null ? null : todayMission.getId();
    Set<Long> nudgedTargetIds =
        missionId == null
            ? Set.of()
            : new HashSet<>(nudgeRepository.findToUserIdsByMissionAndFromUser(missionId, userId));

    // 오늘 인증을 한 번에 로드해 멤버별 상태·달성 수를 애플리케이션에서 집계한다
    // (멤버/인증 수와 무관하게 상수 쿼리).
    List<RoomProof> todayProofs =
        missionId == null ? List.of() : proofRepository.findWithUserByRoomMissionId(missionId);
    Map<Long, ProofStatus> statusByUserId =
        todayProofs.stream()
            .collect(
                Collectors.toMap(
                    proof -> proof.getUser().getId(), RoomProof::getStatus, (first, dup) -> first));

    List<RoomMemberResponse> members =
        memberEntities.stream()
            .map(
                member -> {
                  Long memberUserId = member.getUser().getId();
                  return new RoomMemberResponse(
                      member.getId(),
                      memberUserId,
                      member.getUser().getName(),
                      member.getUser().getAvatar(),
                      member.getRole(),
                      missionId == null
                          ? MemberTodayStatus.NONE
                          : toTodayStatus(statusByUserId.get(memberUserId)),
                      memberUserId.equals(userId),
                      nudgedTargetIds.contains(memberUserId));
                })
            .toList();

    int verifiedCount =
        (int) todayProofs.stream().filter(p -> p.getStatus() == ProofStatus.VERIFIED).count();

    // 표시되는 인증 목록에서만 차단한 유저의 인증을 숨긴다 (멤버 목록·달성 카운트 집계는 그대로).
    Set<Long> blockedIds = blockService.blockedUserIds(userId);
    List<RoomProof> visibleProofs =
        todayProofs.stream().filter(p -> !blockedIds.contains(p.getUser().getId())).toList();

    List<RoomProofResponse> proofs =
        todayMission == null
            ? List.of()
            : proofAssembler.buildAll(visibleProofs, requiredConfirm, userId);

    MemberTodayStatus myTodayStatus =
        missionId == null ? MemberTodayStatus.NONE : toTodayStatus(statusByUserId.get(userId));

    return new RoomDetailResponse(
        room.getId(),
        room.getName(),
        room.getIconKey(),
        room.getType(),
        room.getInviteCode(),
        memberCount,
        computeStreak(roomId),
        myMembership.getRole() == RoomRole.OWNER,
        missionResponse,
        myTodayStatus,
        new ProgressResponse(verifiedCount, memberCount),
        members,
        proofs);
  }

  // ===== 방 설정 =====

  @Transactional
  public RoomDetailResponse rename(Long userId, Long roomId, String name) {
    Room room = getRoomOrThrow(roomId);
    requireOwner(roomId, userId);
    room.setName(name);
    roomRepository.save(room);
    return getDetail(userId, roomId);
  }

  @Transactional
  public void leave(Long userId, Long roomId) {
    getRoomOrThrow(roomId);
    RoomMember membership = getMembershipOrThrow(roomId, userId);
    memberRepository.delete(membership);

    // 방장이 나가면 가장 먼저 들어온 남은 멤버에게 방장 위임
    if (membership.getRole() == RoomRole.OWNER) {
      memberRepository.findByRoomIdOrderByJoinedAtAsc(roomId).stream()
          .findFirst()
          .ifPresent(
              next -> {
                next.setRole(RoomRole.OWNER);
                memberRepository.save(next);
              });
    }
  }

  @Transactional
  public void kickMember(Long userId, Long roomId, Long memberId) {
    getRoomOrThrow(roomId);
    requireOwner(roomId, userId);

    RoomMember target =
        memberRepository
            .findByIdAndRoomId(memberId, roomId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_FORBIDDEN));

    // 본인(방장) 은 내보내기 대상이 아니다 (나가기로 처리)
    if (target.getUser().getId().equals(userId)) {
      throw new BusinessException(ErrorStatus.ROOM_FORBIDDEN);
    }
    memberRepository.delete(target);
  }

  // ===== 콕 찌르기 =====

  // 오늘 미션을 아직 인증하지 않은 멤버를 콕 찔러 재촉한다 (오늘 미션 기준 멱등)
  @Transactional
  public NudgeResponse nudge(Long userId, Long roomId, Long memberId) {
    getRoomOrThrow(roomId);
    RoomMember myMembership = getMembershipOrThrow(roomId, userId);

    RoomMember target =
        memberRepository
            .findByIdAndRoomId(memberId, roomId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_FORBIDDEN));

    Long targetUserId = target.getUser().getId();
    if (targetUserId.equals(userId)) {
      throw new BusinessException(ErrorStatus.ROOM_SELF_NUDGE_NOT_ALLOWED);
    }

    RoomMission todayMission =
        missionRepository
            .findByRoomIdAndDate(roomId, LocalDate.now())
            .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_MISSION_NOT_SET));

    if (computeTodayStatus(todayMission.getId(), targetUserId) == MemberTodayStatus.DONE) {
      throw new BusinessException(ErrorStatus.ROOM_NUDGE_TARGET_DONE);
    }

    boolean already =
        nudgeRepository.existsByRoomMissionIdAndFromUserIdAndToUserId(
            todayMission.getId(), userId, targetUserId);
    if (!already) {
      nudgeRepository.save(
          RoomNudge.builder()
              .roomMission(todayMission)
              .fromUser(myMembership.getUser())
              .toUser(target.getUser())
              .build());
    }

    return new NudgeResponse(memberId, true);
  }

  // ===== 공용 헬퍼 (다른 서비스에서도 사용) =====

  public Room getRoomOrThrow(Long roomId) {
    return roomRepository
        .findById(roomId)
        .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_NOT_FOUND));
  }

  public RoomMember getMembershipOrThrow(Long roomId, Long userId) {
    return memberRepository
        .findByRoomIdAndUserId(roomId, userId)
        .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_FORBIDDEN));
  }

  public void requireOwner(Long roomId, Long userId) {
    RoomMember membership = getMembershipOrThrow(roomId, userId);
    if (membership.getRole() != RoomRole.OWNER) {
      throw new BusinessException(ErrorStatus.ROOM_FORBIDDEN);
    }
  }

  public long getMemberCount(Long roomId) {
    return memberRepository.countByRoomId(roomId);
  }

  public int requiredConfirm(RoomType type, int memberCount) {
    if (type == RoomType.SOLO) return 0;
    return Math.max(0, memberCount - 1);
  }

  private MemberTodayStatus computeTodayStatus(Long roomMissionId, Long userId) {
    return proofRepository
        .findByRoomMissionIdAndUserId(roomMissionId, userId)
        .map(proof -> toTodayStatus(proof.getStatus()))
        .orElse(MemberTodayStatus.NONE);
  }

  private static MemberTodayStatus toTodayStatus(ProofStatus status) {
    if (status == null) return MemberTodayStatus.NONE;
    return status == ProofStatus.VERIFIED ? MemberTodayStatus.DONE : MemberTodayStatus.PENDING;
  }

  private static Map<Long, Long> toCountMap(List<Object[]> rows) {
    Map<Long, Long> result = new HashMap<>();
    for (Object[] row : rows) {
      result.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
    }
    return result;
  }

  // 오늘(완료 시) 또는 어제부터 거꾸로 이어진 VERIFIED 달성 일수
  private int computeStreak(Long roomId) {
    Set<LocalDate> verifiedDates =
        new HashSet<>(proofRepository.findVerifiedDates(roomId, ProofStatus.VERIFIED));
    if (verifiedDates.isEmpty()) return 0;

    LocalDate today = LocalDate.now();
    LocalDate cursor = verifiedDates.contains(today) ? today : today.minusDays(1);
    int streak = 0;
    while (verifiedDates.contains(cursor)) {
      streak++;
      cursor = cursor.minusDays(1);
    }
    return streak;
  }

  private String generateUniqueInviteCode() {
    for (int attempt = 0; attempt < INVITE_CODE_MAX_ATTEMPTS; attempt++) {
      String code = "OFF" + String.format("%03d", ThreadLocalRandom.current().nextInt(0, 1000));
      if (!roomRepository.existsByInviteCode(code)) {
        return code;
      }
    }
    throw new BusinessException(ErrorStatus.INTERNAL_SERVER_ERROR);
  }
}
