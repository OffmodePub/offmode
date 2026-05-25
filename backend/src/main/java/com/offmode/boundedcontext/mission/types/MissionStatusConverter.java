package com.offmode.boundedcontext.mission.types;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MissionStatusConverter implements AttributeConverter<MissionStatus, String> {

  @Override
  public String convertToDatabaseColumn(MissionStatus attribute) {
    return attribute != null ? attribute.value() : null;
  }

  @Override
  public MissionStatus convertToEntityAttribute(String dbData) {
    return dbData != null ? MissionStatus.from(dbData) : null;
  }
}
