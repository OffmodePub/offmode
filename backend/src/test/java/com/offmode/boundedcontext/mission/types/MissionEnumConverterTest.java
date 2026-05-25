package com.offmode.boundedcontext.mission.types;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MissionEnumConverterTest {

  @Test
  void missionCategoryKeepsExistingDatabaseValue() {
    MissionCategoryConverter converter = new MissionCategoryConverter();

    assertThat(converter.convertToDatabaseColumn(MissionCategory.ENERGY)).isEqualTo("Energy");
    assertThat(converter.convertToEntityAttribute("Intellect"))
        .isEqualTo(MissionCategory.INTELLECT);
  }

  @Test
  void missionStatusKeepsExistingDatabaseValue() {
    MissionStatusConverter converter = new MissionStatusConverter();

    assertThat(converter.convertToDatabaseColumn(MissionStatus.PENDING)).isEqualTo("pending");
    assertThat(converter.convertToEntityAttribute("verified")).isEqualTo(MissionStatus.VERIFIED);
  }
}
