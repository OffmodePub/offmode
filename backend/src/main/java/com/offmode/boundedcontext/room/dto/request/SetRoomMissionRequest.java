package com.offmode.boundedcontext.room.dto.request;

import com.offmode.boundedcontext.room.types.MissionSource;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SetRoomMissionRequest {

  @NotNull private MissionSource source;

  // DIRECT 직접 입력 시
  @Size(max = 100)
  private String title;

  @Size(max = 10)
  private String icon;

  // DIRECT 후보 선택 시 (마스터 풀 Mission id)
  private Long missionId;
}
