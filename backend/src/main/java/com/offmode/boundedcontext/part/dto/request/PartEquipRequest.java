package com.offmode.boundedcontext.part.dto.request;

import lombok.Getter;

/** 장착 요청. equippedKey 가 null 이면 장착 해제. */
@Getter
public class PartEquipRequest {
  private String equippedKey;
}
