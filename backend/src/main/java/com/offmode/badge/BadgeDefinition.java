package com.offmode.badge;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BadgeDefinition {

    // ── 1. 기본 성취 ──────────────────────────────────────────
    EXPLORER_LV01(
            "explorer_lv01", "오프라인 탐험가", "현실 세계 입문자",
            "미션 1회 완료", "badge_explore_lv01_initiate.png", "basic"),
    COLLECTOR_LV02(
            "explorer_lv02", "갓생 컬렉터", "루틴 관리인",
            "미션 10회 완료", "badge_explore_lv02_explorer.png", "basic"),
    REAL_WORLD_RULER(
            "real_world_ruler", "현실 세계의 지배자", "진정한 갓생러",
            "미션 100회 완료", "badge_real_world_ruler.png", "basic"),

    // ── 2. 미션 유형별 전문성 ─────────────────────────────────
    WALKER(
            "activity_walker", "산책의 달인", "거리의 발견자",
            "활동형 미션 10회 완료", "badge_activity_walker_walker.png", "type"),
    BEAUTY_CURATOR(
            "activity_beauty", "이너 뷰티 큐레이터", "자기관리의 아이콘",
            "자기관리형 미션 10회 완료", "badge_activity_beauty_curator.png", "type"),
    LOCAL_HIPSTER(
            "activity_local", "로컬 힙스터", "편의점 정복자",
            "소비형 미션 10회 완료", "badge_activity_local_hipster.png", "type"),

    // ── 3. 시간대별 ───────────────────────────────────────────
    DAWN_MASTER(
            "time_dawn", "새벽의 지배자", "새벽 감성 마스터",
            "새벽(00-06시) 미션 5회 완료", "badge_time_dawn_dawnmaster.png", "time"),
    AFTERNOON_FREE(
            "time_afternoon", "오후의 활력소", "오후의 자유인",
            "점심(12-18시) 미션 5회 완료", "badge_time_afternoon_freeman.png", "time"),
    EVENING_WARDEN(
            "time_evening", "나만의 시간 지킴이", "저녁의 안식처",
            "저녁(18-22시) 미션 5회 완료", "badge_time_evening_timewarden.png", "time"),

    // ── 4. 소셜 ───────────────────────────────────────────────
    EMOJI_ARTIST(
            "social_emoji", "이모지 아티스트", "공감 능력자",
            "다른 유저 피드에 이모지 리액션 50회", null, "social"),
    REACTION_MASTER(
            "social_reaction", "리액션 장인", "피드의 인기인",
            "내 피드에 리액션 100회 달성", null, "social"),

    // ── 5. 유니크 ─────────────────────────────────────────────
    OFFMODE_ENTRY(
            "unique_entry", "offmode 입성", "로그인 마스터",
            "첫 미션 수락", null, "unique"),
    SKY_COLLECTOR(
            "unique_sky", "하늘 수집가", "하늘 사진 전문가",
            "하늘 사진 찍기 미션 10회 완료", null, "unique"),
    SPEEDRUNNER(
            "unique_speedrunner", "갓생 스피드 러너", "미션 연승 왕",
            "7일 연속 미션 성공", "badge_unique_speedrunner_streakking.png", "unique");

    private final String key;
    private final String name;
    private final String badgeTitle;   // 칭호 (필드명 title은 예약어 충돌 방지)
    private final String description;
    private final String imageFile;    // null 이면 이미지 미준비
    private final String group;
}
