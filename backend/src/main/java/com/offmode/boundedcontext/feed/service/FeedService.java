package com.offmode.boundedcontext.feed.service;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.feed.dto.response.FeedItemDto;
import com.offmode.boundedcontext.feed.dto.response.FeedStatsDto;
import com.offmode.boundedcontext.feed.dto.response.ReactionSummaryDto;
import com.offmode.boundedcontext.feed.entity.Reaction;
import com.offmode.boundedcontext.feed.entity.Verification;
import com.offmode.boundedcontext.feed.entity.VerificationConfirm;
import com.offmode.boundedcontext.feed.repository.ReactionRepository;
import com.offmode.boundedcontext.feed.repository.VerificationConfirmRepository;
import com.offmode.boundedcontext.feed.repository.VerificationRepository;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.user.dto.response.UserStatsDto;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedService {

  private final VerificationRepository verificationRepository;
  private final VerificationConfirmRepository confirmRepository;
  private final ReactionRepository reactionRepository;
  private final UserMissionRepository userMissionRepository;
  private final UserService userService;
  private final BadgeService badgeService;
  private final Optional<S3Client> s3Client;

  private static final int VERIFY_THRESHOLD = 1;

  @Value("${file.upload-dir:./uploads}")
  private String uploadDir;

  @Value("${r2.bucket:}")
  private String r2Bucket;

  @Value("${r2.public-url:}")
  private String r2PublicUrl;

  @Transactional
  public Verification verify(Long userId, Long userMissionId, MultipartFile photo, String caption)
      throws IOException {
    UserMission mission =
        userMissionRepository
            .findById(userMissionId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.MISSION_NOT_FOUND));

    if (!mission.getUser().getId().equals(userId)) {
      throw new BusinessException(ErrorStatus.AUTH_ACCESS_DENIED);
    }

    if (verificationRepository.existsByUserMissionId(userMissionId)) {
      throw new BusinessException(ErrorStatus.VERIFICATION_ALREADY_SUBMITTED);
    }

    // 사진 저장 (R2 우선, 없으면 로컬)
    String photoUrl = null;
    if (photo != null && !photo.isEmpty()) {
      String ext = getExtension(photo.getOriginalFilename());
      String filename = "verifications/" + UUID.randomUUID() + ext;
      if (s3Client.isPresent() && !r2Bucket.isBlank()) {
        s3Client
            .get()
            .putObject(
                PutObjectRequest.builder()
                    .bucket(r2Bucket)
                    .key(filename)
                    .contentType(photo.getContentType())
                    .build(),
                RequestBody.fromInputStream(photo.getInputStream(), photo.getSize()));
        photoUrl = r2PublicUrl + "/" + filename;
      } else {
        String localName = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(dir);
        photo.transferTo(dir.resolve(localName));
        photoUrl = "/uploads/" + localName;
      }
    }

    // 인증 저장 (상태는 "pending" 유지 — 피어 인증 후 완료 처리)
    User user = userService.getById(userId);
    return verificationRepository.save(
        Verification.builder()
            .userMission(mission)
            .user(user)
            .photoUrl(photoUrl)
            .caption(caption)
            .build());
  }

  @Transactional
  public void confirm(Long userId, Long verificationId) {
    Verification v =
        verificationRepository
            .findById(verificationId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.VERIFICATION_NOT_FOUND));

    // 본인 인증은 불가
    if (v.getUser().getId().equals(userId)) {
      throw new BusinessException(ErrorStatus.VERIFICATION_SELF_CONFIRM_NOT_ALLOWED);
    }

    // 이미 인증해줬는지 확인
    if (confirmRepository.existsByVerificationIdAndUserId(verificationId, userId)) {
      throw new BusinessException(ErrorStatus.VERIFICATION_ALREADY_CONFIRMED);
    }

    User confirmer = userService.getById(userId);
    confirmRepository.save(VerificationConfirm.builder().verification(v).user(confirmer).build());

    // 피어 인증 수가 threshold 이상이면 미션 완료 처리
    long count = confirmRepository.countByVerificationId(verificationId);
    if (count >= VERIFY_THRESHOLD) {
      UserMission mission = v.getUserMission();
      if (!"verified".equals(mission.getStatus())) {
        mission.setStatus("verified");
        mission.setVerifiedAt(LocalDateTime.now());
        userMissionRepository.save(mission);

        // 레벨업 + 배지 체크 (미션 주인에게)
        Long ownerId = mission.getUser().getId();
        long verifiedCount = userMissionRepository.countByUserIdAndStatus(ownerId, "verified");
        userService.levelUp(ownerId, (int) verifiedCount);
        badgeService.checkAndAward(ownerId);
      }
    }
  }

  @Transactional
  public void react(Long userId, Long verificationId, String emoji) {
    Verification v =
        verificationRepository
            .findById(verificationId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.VERIFICATION_NOT_FOUND));

    reactionRepository
        .findByVerificationIdAndUserIdAndEmoji(verificationId, userId, emoji)
        .ifPresentOrElse(
            reactionRepository::delete, // 이미 있으면 취소(토글)
            () -> { // 없으면 추가
              User user = userService.getById(userId);
              reactionRepository.save(
                  Reaction.builder().verification(v).user(user).emoji(emoji).build());
            });
  }

  public List<FeedItemDto> getFeed(Long userId, int page, int size) {
    // 오늘 내 미션 텍스트 조회 — 없으면 빈 피드 반환
    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
    LocalDateTime todayEnd = LocalDate.now().plusDays(1).atStartOfDay();
    UserMission todayMission =
        userMissionRepository
            .findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
                userId, todayStart, todayEnd)
            .orElse(null);
    log.info(
        "[GET-FEED] userId={} 오늘 미션={}",
        userId,
        todayMission == null
            ? "없음"
            : todayMission.getMissionText() + " (id=" + todayMission.getId() + ")");
    if (todayMission == null) return List.of();

    String missionText = todayMission.getMissionText();
    List<FeedItemDto> items =
        verificationRepository.findFeedItems(PageRequest.of(page, size), userId, missionText);
    log.info("[GET-FEED] 필터 missionText='{}' → 조회된 피드 {}건", missionText, items.size());
    if (items.isEmpty()) return items;

    // 한 번의 쿼리로 전체 리액션 요약 조회
    List<Long> ids = items.stream().map(FeedItemDto::getId).toList();
    List<Object[]> rows = reactionRepository.findSummaries(ids, userId);

    // verificationId → List<ReactionSummaryDto> 맵 구성
    Map<Long, List<ReactionSummaryDto>> reactionMap = new java.util.HashMap<>();
    for (Object[] row : rows) {
      Long vId = (Long) row[0];
      String emoji = (String) row[1];
      long count = ((Number) row[2]).longValue();
      boolean myReact = ((Number) row[3]).longValue() > 0;
      reactionMap
          .computeIfAbsent(vId, k -> new java.util.ArrayList<>())
          .add(new ReactionSummaryDto(emoji, count, myReact));
    }

    items.forEach(
        item -> item.setReactions(reactionMap.getOrDefault(item.getId(), java.util.List.of())));
    return items;
  }

  public FeedStatsDto getStats(Long userId) {
    // 오늘 자정부터 현재까지 미션을 수락한 유저 수
    LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
    long activeToday = userMissionRepository.countDistinctUsersSince(todayStart);

    // 전체 인증 완료율
    long total = userMissionRepository.count();
    long verified = userMissionRepository.countByStatus("verified");
    int verificationRate = total == 0 ? 0 : (int) (verified * 100 / total);

    // 현재 유저 연속 달성 일수 (UserService의 getStats 재활용)
    UserStatsDto userStats = userService.getStats(userId);
    int streakDays = userStats.getStreak();

    return new FeedStatsDto(activeToday, verificationRate, streakDays);
  }

  private String getExtension(String filename) {
    if (filename == null || !filename.contains(".")) return ".jpg";
    return filename.substring(filename.lastIndexOf('.'));
  }
}
