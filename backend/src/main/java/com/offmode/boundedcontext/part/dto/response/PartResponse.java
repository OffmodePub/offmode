package com.offmode.boundedcontext.part.dto.response;

import com.offmode.boundedcontext.part.types.PartDefinition;
import lombok.Getter;

/** 파츠 정의 + 유저별 해금/장착 상태. */
@Getter
public class PartResponse {

  private final String key;
  private final String name;
  private final int order;
  private final Integer unlockThreshold; // 누적 인증 미션 수 기준, null 이면 Coming Soon
  private final boolean unlocked;
  private final boolean equipped;

  public PartResponse(PartDefinition def, boolean unlocked, boolean equipped) {
    this.key = def.getKey();
    this.name = def.getName();
    this.order = def.order();
    this.unlockThreshold = def.getUnlockThreshold();
    this.unlocked = unlocked;
    this.equipped = equipped;
  }
}
