package com.offmode.mission;

import com.offmode.badge.BadgeService;
import com.offmode.user.User;
import com.offmode.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MissionService {

    private final MissionRepository     missionRepository;
    private final UserMissionRepository userMissionRepository;
    private final UserRepository        userRepository;
    private final BadgeService          badgeService;

    // 오늘의 미션 조회 (있으면 반환, 없으면 null)
    public UserMission getTodayMission(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end   = today.plusDays(1).atStartOfDay();

        return userMissionRepository
                .findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(userId, start, end)
                .orElse(null);
    }

    // 오늘의 미션 조회 + 인증 사진/캡션 포함
    public UserMissionDto getTodayMissionDto(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end   = today.plusDays(1).atStartOfDay();
        return userMissionRepository.findTodayWithPhoto(userId, start, end).orElse(null);
    }

    // 룰렛에서 선택한 미션을 오늘 미션으로 저장 (이미 있으면 기존 반환)
    @Transactional
    public UserMission setTodayMission(Long userId, String icon, String text, String category) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end   = today.plusDays(1).atStartOfDay();

        UserMission result = userMissionRepository
                .findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(userId, start, end)
                .orElseGet(() -> {
                    User user = userRepository.getReferenceById(userId);
                    return userMissionRepository.save(UserMission.builder()
                            .user(user)
                            .missionIcon(icon)
                            .missionText(text)
                            .missionCategory(category)
                            .build());
                });

        // offmode 입성 배지 체크 (첫 미션 수락)
        badgeService.checkAndAward(userId);
        return result;
    }

    // 내 미션 기록 (최근 30개, 인증 사진 포함)
    public List<UserMissionDto> getHistory(Long userId) {
        return userMissionRepository.findHistoryWithPhoto(userId)
                .stream().limit(30).toList();
    }

    // 미션 풀 전체 조회
    public List<Mission> getPool() {
        return missionRepository.findAll();
    }
}
