package com.offmode.boundedcontext.mission.dto.request;

import com.offmode.boundedcontext.mission.types.MissionCategory;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidMissionCategoryValidator
    implements ConstraintValidator<ValidMissionCategory, String> {

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    return value == null || value.isBlank() || MissionCategory.contains(value);
  }
}
