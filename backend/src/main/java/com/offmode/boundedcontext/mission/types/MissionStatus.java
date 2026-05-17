package com.offmode.boundedcontext.mission.types;

import java.util.Arrays;

public enum MissionStatus {
  PENDING("pending"),
  VERIFIED("verified");

  private final String value;

  MissionStatus(String value) {
    this.value = value;
  }

  public String value() {
    return value;
  }

  public static MissionStatus from(String value) {
    return Arrays.stream(values())
        .filter(status -> status.value.equals(value))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unknown mission status: " + value));
  }
}
