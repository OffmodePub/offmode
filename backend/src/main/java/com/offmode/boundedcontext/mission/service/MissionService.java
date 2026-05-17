package com.offmode.boundedcontext.mission.service;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.mission.dto.response.MissionWeightDto;
import com.offmode.boundedcontext.mission.dto.response.UserMissionDto;
import com.offmode.boundedcontext.mission.entity.Mission;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.repository.MissionRepository;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MissionService {

  private final MissionRepository missionRepository;
  private final UserMissionRepository userMissionRepository;
  private final UserRepository userRepository;
  private final BadgeService badgeService;

  // 오늘의 미션 조회 (있으면 반환, 없으면 null)
  public UserMission getTodayMission(Long userId) {
    LocalDate today = LocalDate.now();
    LocalDateTime start = today.atStartOfDay();
    LocalDateTime end = today.plusDays(1).atStartOfDay();

    return userMissionRepository
        .findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(userId, start, end)
        .orElse(null);
  }

  // 오늘의 미션 조회 + 인증 사진/캡션 포함 (여러 개면 가장 최근 것)
  public UserMissionDto getTodayMissionDto(Long userId) {
    LocalDate today = LocalDate.now();
    LocalDateTime start = today.atStartOfDay();
    LocalDateTime end = today.plusDays(1).atStartOfDay();
    UserMissionDto dto =
        userMissionRepository.findTodayWithPhoto(userId, start, end).stream()
            .findFirst()
            .orElse(null);
    log.info(
        "[TODAY-MISSION] userId={} range=[{} ~ {}] result={}",
        userId,
        start,
        end,
        dto == null ? "없음" : dto.missionText());
    return dto;
  }

  // 룰렛에서 선택한 미션을 오늘 미션으로 저장
  // 이미 오늘 미션이 있으면 새로 선택한 미션으로 덮어씀 (단, 이미 verified면 유지)
  @Transactional
  public UserMission setTodayMission(Long userId, String icon, String text, String category) {
    LocalDate today = LocalDate.now();
    LocalDateTime start = today.atStartOfDay();
    LocalDateTime end = today.plusDays(1).atStartOfDay();

    log.info(
        "[SET-MISSION] userId={} 요청: icon={} text={} category={}", userId, icon, text, category);

    UserMission result =
        userMissionRepository
            .findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(userId, start, end)
            .map(
                existing -> {
                  log.info(
                      "[SET-MISSION] 기존 미션 발견: id={} text={} status={}",
                      existing.getId(),
                      existing.getMissionText(),
                      existing.getStatus());
                  if ("verified".equals(existing.getStatus())) {
                    // 이미 완료된 미션은 수정하지 않고 새 미션을 추가 생성
                    log.info("[SET-MISSION] 기존 미션이 verified → 새 미션 신규 생성");
                    User user = userRepository.getReferenceById(userId);
                    UserMission newMission =
                        userMissionRepository.save(
                            UserMission.builder()
                                .user(user)
                                .missionIcon(icon)
                                .missionText(text)
                                .missionCategory(category)
                                .build());
                    log.info(
                        "[SET-MISSION] 새 미션 저장 완료: id={} text={}",
                        newMission.getId(),
                        newMission.getMissionText());
                    return newMission;
                  }
                  existing.setMissionIcon(icon);
                  existing.setMissionText(text);
                  existing.setMissionCategory(category);
                  existing.setStatus("pending");
                  existing.setVerifiedAt(null);
                  UserMission saved = userMissionRepository.save(existing);
                  log.info(
                      "[SET-MISSION] 기존 미션 업데이트 완료: id={} text={}",
                      saved.getId(),
                      saved.getMissionText());
                  return saved;
                })
            .orElseGet(
                () -> {
                  log.info("[SET-MISSION] 오늘 미션 없음 → 신규 생성");
                  User user = userRepository.getReferenceById(userId);
                  UserMission saved =
                      userMissionRepository.save(
                          UserMission.builder()
                              .user(user)
                              .missionIcon(icon)
                              .missionText(text)
                              .missionCategory(category)
                              .build());
                  log.info(
                      "[SET-MISSION] 신규 저장 완료: id={} text={}",
                      saved.getId(),
                      saved.getMissionText());
                  return saved;
                });

    // offmode 입성 배지 체크 (첫 미션 수락)
    badgeService.checkAndAward(userId);
    return result;
  }

  // 내 미션 기록 (최근 30개, 인증 사진 포함)
  public List<UserMissionDto> getHistory(Long userId) {
    return userMissionRepository.findHistoryWithPhoto(userId).stream().limit(30).toList();
  }

  // 미션 풀 전체 조회
  public List<Mission> getPool() {
    return missionRepository.findAll();
  }

  // 가중치 포함 미션 풀 조회
  // - 최근 7일 이내 수행: weight 0.1
  // - 7~14일: weight 0.3
  // - 14~30일: weight 0.5
  // - 30일 초과 or 미수행: weight 1.0
  public List<MissionWeightDto> getWeightedPool(Long userId) {
    List<Mission> allMissions = missionRepository.findAll();

    Map<String, LocalDateTime> latestMap =
        userMissionRepository.findLatestAssignedAtPerMissionText(userId).stream()
            .collect(Collectors.toMap(row -> (String) row[0], row -> (LocalDateTime) row[1]));

    LocalDateTime now = LocalDateTime.now();

    return allMissions.stream()
        .map(
            m -> {
              double weight = 1.0;
              LocalDateTime latest = latestMap.get(m.getText());
              if (latest != null) {
                long daysSince = ChronoUnit.DAYS.between(latest, now);
                if (daysSince < 7) weight = 0.1;
                else if (daysSince < 14) weight = 0.3;
                else if (daysSince < 30) weight = 0.5;
              }
              return new MissionWeightDto(
                  m.getId(), m.getIcon(), m.getText(), m.getCategory(), weight);
            })
        .toList();
  }
}
