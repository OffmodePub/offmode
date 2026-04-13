package com.offmode.user;

import com.offmode.mission.UserMissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository        userRepository;
    private final UserMissionRepository userMissionRepository;

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저 없음"));
    }

    @Transactional
    public User updateProfile(Long userId, String name, String avatar,
                              Integer missionHour, Integer missionMinute, Boolean autoRoulette) {
        User user = getById(userId);
        if (name          != null && !name.isBlank())   user.setName(name);
        if (avatar        != null && !avatar.isBlank()) user.setAvatar(avatar);
        if (missionHour   != null) user.setMissionHour(missionHour);
        if (missionMinute != null) user.setMissionMinute(missionMinute);
        if (autoRoulette  != null) user.setAutoRoulette(autoRoulette);
        return userRepository.save(user);
    }

    @Transactional
    public void levelUp(Long userId, int verifiedCount) {
        User user = getById(userId);
        int newLevel = verifiedCount / 10 + 1;
        if (newLevel > user.getLevel()) {
            user.setLevel(newLevel);
            userRepository.save(user);
        }
    }

    public UserStatsDto getStats(Long userId) {
        long totalMissions = userMissionRepository.findByUserIdOrderByAssignedAtDesc(userId).size();
        long totalVerified = userMissionRepository.countByUserIdAndStatus(userId, "verified");

        long energy    = userMissionRepository.countByUserIdAndStatusAndMissionCategory(userId, "verified", "Energy");
        long intellect = userMissionRepository.countByUserIdAndStatusAndMissionCategory(userId, "verified", "Intellect");
        long vitality  = userMissionRepository.countByUserIdAndStatusAndMissionCategory(userId, "verified", "Vitality");

        List<LocalDateTime> verifiedTimes = userMissionRepository.findVerifiedDateTimes(userId);
        int streak = calcStreak(verifiedTimes);

        return new UserStatsDto(
                totalMissions,
                totalVerified,
                streak,
                fill(energy),  level(energy),
                fill(intellect), level(intellect),
                fill(vitality),  level(vitality)
        );
    }

    // 연속 달성 일수 계산 (오늘부터 역순으로 확인)
    private int calcStreak(List<LocalDateTime> times) {
        if (times.isEmpty()) return 0;
        Set<LocalDate> dates = times.stream()
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toSet());

        LocalDate check = LocalDate.now();
        int streak = 0;
        while (dates.contains(check)) {
            streak++;
            check = check.minusDays(1);
        }
        return streak;
    }

    // 카테고리별 레벨당 10개 미션, fill은 현재 레벨 내 진행도
    private static int fill(long count)  { return (int)((count % 10) * 10); }
    private static int level(long count) { return (int)(count / 10) + 1; }
}
