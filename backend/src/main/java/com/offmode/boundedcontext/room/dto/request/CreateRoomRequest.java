package com.offmode.boundedcontext.room.dto.request;

import com.offmode.boundedcontext.room.types.RoomIconKey;
import com.offmode.boundedcontext.room.types.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class CreateRoomRequest {

  @NotBlank
  @Size(max = 30)
  private String name;

  @NotNull private RoomIconKey iconKey;

  @NotNull private RoomType type;
}
