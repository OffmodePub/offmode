package com.offmode.boundedcontext.mission.dto.request;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = ValidMissionCategoryValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidMissionCategory {

  String message() default "허용되지 않은 미션 카테고리입니다";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
