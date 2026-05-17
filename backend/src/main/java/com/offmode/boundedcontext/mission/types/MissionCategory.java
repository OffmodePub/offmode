package com.offmode.boundedcontext.mission.types;

import java.util.Arrays;

public enum MissionCategory {
  ENERGY("Energy"),
  INTELLECT("Intellect"),
  VITALITY("Vitality");

  private final String value;

  MissionCategory(String value) {
    this.value = value;
  }

  public String value() {
    return value;
  }

  public static MissionCategory from(String value) {
    return Arrays.stream(values())
        .filter(category -> category.value.equals(value))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unknown mission category: " + value));
  }

  public static boolean contains(String value) {
    return Arrays.stream(values()).anyMatch(category -> category.value.equals(value));
  }
}
