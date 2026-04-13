package com.offmode.feed;

import com.offmode.badge.BadgeService;
import com.offmode.mission.UserMission;
import com.offmode.mission.UserMissionRepository;
import com.offmode.user.User;
import com.offmode.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final VerificationRepository        verificationRepository;
    private final VerificationConfirmRepository confirmRepository;
    private final ReactionRepository            reactionRepository;
    private final UserMissionRepository         userMissionRepository;
    private final UserService                   userService;
    private final BadgeService                  badgeService;

    private static final int VERIFY_THRESHOLD = 1; // 이 수 이상 피어 인증 → 미션 완료

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Transactional
    public Verification verify(Long userId, Long userMissionId, MultipartFile photo, String caption) throws IOException {
        UserMission mission = userMissionRepository.findById(userMissionId)
                .orElseThrow(() -> new RuntimeException("미션 없음"));

        if (!mission.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한 없음");
        }

        if ("verified".equals(mission.getStatus())) {
            throw new RuntimeException("이미 인증한 미션입니다");
        }

        // 사진 저장
        String photoUrl = null;
        if (photo != null && !photo.isEmpty()) {
            String ext      = getExtension(photo.getOriginalFilename());
            String filename = UUID.randomUUID() + ext;
            Path   dir      = Paths.get(uploadDir).toAbsolutePath();
            Files.createDirectories(dir);
            photo.transferTo(dir.resolve(filename));
            photoUrl = "/uploads/" + filename;
        }

        // 인증 저장 (상태는 "pending" 유지 — 피어 인증 후 완료 처리)
        User user = userService.getById(userId);
        return verificationRepository.save(Verification.builder()
                .userMission(mission)
                .user(user)
                .photoUrl(photoUrl)
                .caption(caption)
                .build());
    }

    @Transactional
    public void confirm(Long userId, Long verificationId) {
        Verification v = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("인증 없음"));

        // 본인 인증은 불가
        if (v.getUser().getId().equals(userId)) {
            throw new RuntimeException("자신의 인증은 확인할 수 없습니다");
        }

        // 이미 인증해줬는지 확인
        if (confirmRepository.existsByVerificationIdAndUserId(verificationId, userId)) {
            throw new RuntimeException("이미 인증해준 게시물입니다");
        }

        User confirmer = userService.getById(userId);
        confirmRepository.save(VerificationConfirm.builder()
                .verification(v)
                .user(confirmer)
                .build());

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
        Verification v = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("인증 없음"));

        reactionRepository.findByVerificationIdAndUserIdAndEmoji(verificationId, userId, emoji)
                .ifPresentOrElse(
                        reactionRepository::delete,   // 이미 있으면 취소(토글)
                        () -> {                       // 없으면 추가
                            User user = userService.getById(userId);
                            reactionRepository.save(Reaction.builder()
                                    .verification(v)
                                    .user(user)
                                    .emoji(emoji)
                                    .build());
                        }
                );
    }

    public List<FeedItemDto> getFeed(Long userId, int page, int size) {
        List<FeedItemDto> items = verificationRepository.findFeedItems(PageRequest.of(page, size), userId);
        if (items.isEmpty()) return items;

        // 한 번의 쿼리로 전체 리액션 요약 조회
        List<Long> ids = items.stream().map(FeedItemDto::getId).toList();
        List<Object[]> rows = reactionRepository.findSummaries(ids, userId);

        // verificationId → List<ReactionSummaryDto> 맵 구성
        Map<Long, List<ReactionSummaryDto>> reactionMap = new java.util.HashMap<>();
        for (Object[] row : rows) {
            Long   vId     = (Long)   row[0];
            String emoji   = (String) row[1];
            long   count   = ((Number) row[2]).longValue();
            boolean myReact = ((Number) row[3]).longValue() > 0;
            reactionMap.computeIfAbsent(vId, k -> new java.util.ArrayList<>())
                       .add(new ReactionSummaryDto(emoji, count, myReact));
        }

        items.forEach(item -> item.setReactions(
                reactionMap.getOrDefault(item.getId(), java.util.List.of())));
        return items;
    }

    public FeedStatsDto getStats(Long userId) {
        // 오늘 자정부터 현재까지 미션을 수락한 유저 수
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        long activeToday = userMissionRepository.countDistinctUsersSince(todayStart);

        // 전체 인증 완료율
        long total    = userMissionRepository.count();
        long verified = userMissionRepository.countByStatus("verified");
        int  verificationRate = total == 0 ? 0 : (int)(verified * 100 / total);

        // 현재 유저 연속 달성 일수 (UserService의 getStats 재활용)
        com.offmode.user.UserStatsDto userStats = userService.getStats(userId);
        int streakDays = userStats.getStreak();

        return new FeedStatsDto(activeToday, verificationRate, streakDays);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
