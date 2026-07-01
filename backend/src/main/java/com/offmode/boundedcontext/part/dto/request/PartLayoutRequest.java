package com.offmode.boundedcontext.part.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;

/** 캐릭터 꾸미기 전체 레이아웃 저장 요청. placements 로 배치를 통째로 교체한다. */
@Getter
public class PartLayoutRequest {

  @NotNull @Valid private List<PlacementRequest> placements;
}
