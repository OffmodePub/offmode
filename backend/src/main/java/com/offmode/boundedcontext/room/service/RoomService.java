package com.offmode.boundedcontext.room.service;

import com.offmode.boundedcontext.room.dto.request.CreateRoomRequest;
import com.offmode.boundedcontext.room.dto.request.JoinRoomRequest;
import com.offmode.boundedcontext.room.dto.response.GroupRoomSummaryResponse;
import com.offmode.boundedcontext.room.dto.response.MiniMissionResponse;
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
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.repository.RoomMemberRepository;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomRepository;
import com.offmode.boundedcontext.room.types.MemberTodayStatus;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomRole;
import com.offmode.boundedcontext.room.types.RoomType;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
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
  private final UserService userService;
  private final RoomProofAssembler proofAssembler;

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

    for (RoomMember membership : memberships) {
      Room room = membership.getRoom();
      RoomMission todayMission =
          missionRepository.findByRoomIdAndDate(room.getId(), today).orElse(null);
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
                (int) memberRepository.countByRoomId(room.getId()),
                mini,
                done);
      } else {
        int memberCount = (int) memberRepository.countByRoomId(room.getId());
        int verifiedCount =
            todayMission == null
                ? 0
                : (int)
                    proofRepository.countByRoomMissionIdAndStatus(
                        todayMission.getId(), ProofStatus.VERIFIED);
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

    int memberCount = (int) memberRepository.countByRoomId(roomId);
    int requiredConfirm = requiredConfirm(room.getType(), memberCount);
    LocalDate today = LocalDate.now();

    RoomMission todayMission = missionRepository.findByRoomIdAndDate(roomId, today).orElse(null);
    RoomMissionResponse missionResponse =
        todayMission == null ? null : RoomMissionResponse.from(todayMission);

    List<RoomMemberResponse> members =
        memberRepository.findByRoomIdOrderByJoinedAtAsc(roomId).stream()
            .map(
                member ->
                    new RoomMemberResponse(
                        member.getId(),
                        member.getUser().getId(),
                        member.getUser().getName(),
                        member.getUser().getAvatar(),
                        member.getRole(),
                        todayMission == null
                            ? MemberTodayStatus.NONE
                            : computeTodayStatus(todayMission.getId(), member.getUser().getId())))
            .toList();

    int verifiedCount =
        todayMission == null
            ? 0
            : (int)
                proofRepository.countByRoomMissionIdAndStatus(
                    todayMission.getId(), ProofStatus.VERIFIED);

    List<RoomProofResponse> proofs =
        todayMission == null
            ? List.of()
            : proofAssembler.buildAll(
                proofRepository.findByRoomMissionIdOrderByCreatedAtDesc(todayMission.getId()),
                requiredConfirm,
                userId);

    MemberTodayStatus myTodayStatus =
        todayMission == null
            ? MemberTodayStatus.NONE
            : computeTodayStatus(todayMission.getId(), userId);

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
    Optional<RoomProof> proof = proofRepository.findByRoomMissionIdAndUserId(roomMissionId, userId);
    if (proof.isEmpty()) return MemberTodayStatus.NONE;
    return proof.get().getStatus() == ProofStatus.VERIFIED
        ? MemberTodayStatus.DONE
        : MemberTodayStatus.PENDING;
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
