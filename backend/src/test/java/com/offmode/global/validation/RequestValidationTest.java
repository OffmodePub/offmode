package com.offmode.global.validation;

import static org.assertj.core.api.Assertions.assertThat;

import com.offmode.boundedcontext.feed.dto.request.ReactRequest;
import com.offmode.boundedcontext.mission.dto.request.SetTodayMissionRequest;
import com.offmode.boundedcontext.user.dto.request.UpdateUserProfileRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;

class RequestValidationTest {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void updateUserProfileRejectsInvalidMissionTime() throws Exception {
    UpdateUserProfileRequest request = new UpdateUserProfileRequest();
    setField(request, "missionHour", 24);
    setField(request, "missionMinute", 60);

    assertThat(validator.validate(request)).hasSize(2);
  }

  @Test
  void setTodayMissionRequiresSupportedCategory() throws Exception {
    SetTodayMissionRequest request = new SetTodayMissionRequest();
    setField(request, "icon", "🏃");
    setField(request, "text", "30분 산책하기");
    setField(request, "category", "Unknown");

    assertThat(validator.validate(request))
        .anyMatch(violation -> violation.getPropertyPath().toString().equals("category"));
  }

  @Test
  void reactRequestRequiresEmoji() {
    ReactRequest request = new ReactRequest();

    assertThat(validator.validate(request))
        .anyMatch(violation -> violation.getPropertyPath().toString().equals("emoji"));
  }

  @Test
  void reactRequestRejectsEmojiLongerThanColumnLength() throws Exception {
    ReactRequest request = new ReactRequest();
    setField(request, "emoji", "12345678901");

    assertThat(validator.validate(request))
        .anyMatch(violation -> violation.getPropertyPath().toString().equals("emoji"));
  }

  private void setField(Object target, String name, Object value) throws Exception {
    Field field = target.getClass().getDeclaredField(name);
    field.setAccessible(true);
    field.set(target, value);
  }
}
