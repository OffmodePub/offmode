package com.offmode.global.status;

import java.util.Optional;
import java.util.function.Predicate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorStatus {
  INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_500", "서버 에러, 관리자에게 문의 바랍니다."),
  BAD_REQUEST(HttpStatus.BAD_REQUEST, "COMMON_400", "잘못된 요청입니다."),
  UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON_401", "인증이 필요합니다."),
  FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON_403", "금지된 요청입니다."),
  VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VALID_400_001", "입력값이 올바르지 않습니다."),

  // Auth
  AUTH_OAUTH_FAILED(HttpStatus.UNAUTHORIZED, "AUTH_401_001", "OAuth 인증에 실패했습니다."),
  AUTH_ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH_403_001", "접근 권한이 없습니다."),

  // User
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_404_001", "해당 사용자를 찾을 수 없습니다."),

  // Mission
  MISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "MISSION_404_001", "해당 미션을 찾을 수 없습니다."),

  // Verification
  VERIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "VERIFICATION_404_001", "해당 인증을 찾을 수 없습니다."),
  VERIFICATION_ALREADY_SUBMITTED(
      HttpStatus.CONFLICT, "VERIFICATION_409_001", "이미 인증 사진을 올린 미션입니다."),
  VERIFICATION_SELF_CONFIRM_NOT_ALLOWED(
      HttpStatus.BAD_REQUEST, "VERIFICATION_400_001", "자신의 인증은 확인할 수 없습니다."),
  VERIFICATION_ALREADY_CONFIRMED(HttpStatus.CONFLICT, "VERIFICATION_409_002", "이미 인증해준 게시물입니다."),

  // File
  FILE_EMPTY(HttpStatus.BAD_REQUEST, "FILE_400_001", "업로드할 파일이 비어있습니다."),
  FILE_INVALID_TYPE(HttpStatus.BAD_REQUEST, "FILE_400_002", "허용되지 않은 파일 형식입니다."),
  FILE_INVALID_IMAGE(HttpStatus.BAD_REQUEST, "FILE_400_003", "유효한 이미지 파일이 아닙니다."),
  FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_500_001", "파일 업로드에 실패했습니다."),
  FILE_STORAGE_CONFIG_INVALID(
      HttpStatus.INTERNAL_SERVER_ERROR, "FILE_500_002", "파일 저장소 설정이 올바르지 않습니다.");

  private final HttpStatus httpStatus;
  private final String code;
  private final String message;

  public String getMessage(String message) {
    return Optional.ofNullable(message)
        .filter(Predicate.not(String::isBlank))
        .orElse(this.getMessage());
  }
}
