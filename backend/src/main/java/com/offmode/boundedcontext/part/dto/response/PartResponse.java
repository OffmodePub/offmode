package com.offmode.boundedcontext.part.dto.response;

import com.offmode.boundedcontext.part.entity.UserPart;
import com.offmode.boundedcontext.part.types.PartDefinition;
import lombok.Getter;

/** 파츠 정의 + 유저별 해금 상태 + 캐릭터 위 배치 정보(미배치면 null). */
@Getter
public class PartResponse {

  private final String key;
  private final String name;
  private final int order;
  private final Integer unlockThreshold; // 누적 인증 미션 수 기준, null 이면 Coming Soon
  private final boolean unlocked;
  private final PlacementResponse placement; // 캐릭터에 배치돼 있으면 좌표/스케일 등, 미배치면 null

  public PartResponse(PartDefinition def, boolean unlocked, PlacementResponse placement) {
    this.key = def.getKey();
    this.name = def.getName();
    this.order = def.order();
    this.unlockThreshold = def.getUnlockThreshold();
    this.unlocked = unlocked;
    this.placement = placement;
  }

  /** 캐릭터 위 파츠 배치 정보. x/y 는 0~1 정규화 좌표, z 는 렌더 순서. */
  public record PlacementResponse(double x, double y, double scale, double rotation, int z) {
    public static PlacementResponse from(UserPart part) {
      return new PlacementResponse(
          part.getPosX(), part.getPosY(), part.getScale(), part.getRotation(), part.getZIndex());
    }
  }
}
