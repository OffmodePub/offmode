package com.offmode.boundedcontext.part.types;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 캐릭터 꾸미기 파츠 카탈로그.
 *
 * <p>선언 순서가 곧 그리드 표시 순서(order)이며, 누적 인증 미션 수(totalVerified)가 {@code unlockThreshold} 이상이면 해금된다.
 * {@code unlockThreshold == null} 인 파츠는 "Coming Soon" 자리로 항상 잠겨 있다.
 */
@Getter
@RequiredArgsConstructor
public enum PartDefinition {
  LEAF("leaf", "새싹", 1),
  CROWN("crown", "왕관", 2),
  SUNGLASS("sunglass", "선글라스", 3),
  TWINKLE("twinkle", "반짝이", 5),
  HEART("heart", "하트", 7),
  RIBBON("ribbon", "리본", 10),
  STAR("star", "별", 13),
  GLASSES("glasses", "안경", 16),
  PEAKED_HAT("peakedHat", "고깔모자", 19),
  DOUBLE_HEART("doubleHeart", "더블하트", 22),
  ANGEL_RING("angelRing", "천사링", 25),
  BERET("beret", "베레모", 28),
  STAR_TWINKLE("starTwinkle", "별빛", 31),
  COMING_SOON_14("comingSoon14", "준비 중", null),
  COMING_SOON_15("comingSoon15", "준비 중", null),
  COMING_SOON_16("comingSoon16", "준비 중", null);

  private final String key;
  private final String name;
  private final Integer unlockThreshold; // 누적 인증 미션 수 기준, null 이면 Coming Soon (항상 잠김)

  /** 그리드 표시 순서(1-based). */
  public int order() {
    return ordinal() + 1;
  }

  /** 누적 인증 미션 수가 해금 조건을 충족하는지. */
  public boolean isUnlockedBy(long verifiedCount) {
    return unlockThreshold != null && verifiedCount >= unlockThreshold;
  }

  public static Optional<PartDefinition> fromKey(String key) {
    return Arrays.stream(values()).filter(def -> def.key.equals(key)).findFirst();
  }
}
