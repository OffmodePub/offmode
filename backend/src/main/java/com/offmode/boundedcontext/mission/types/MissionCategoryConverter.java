package com.offmode.boundedcontext.mission.types;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MissionCategoryConverter implements AttributeConverter<MissionCategory, String> {

  @Override
  public String convertToDatabaseColumn(MissionCategory attribute) {
    return attribute != null ? attribute.value() : null;
  }

  @Override
  public MissionCategory convertToEntityAttribute(String dbData) {
    return dbData != null ? MissionCategory.from(dbData) : null;
  }
}
