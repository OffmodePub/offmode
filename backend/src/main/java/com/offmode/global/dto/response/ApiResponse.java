package com.offmode.global.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.offmode.global.status.ErrorStatus;
import lombok.Getter;
import org.springframework.http.ResponseEntity;

@Getter
@JsonPropertyOrder({"isSuccess", "code", "message", "result"})
public class ApiResponse<T> {

  private final Boolean isSuccess;
  private final String code;
  private final String message;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  private final T result;

  private ApiResponse(Boolean isSuccess, String code, String message, T result) {
    this.isSuccess = isSuccess;
    this.code = code;
    this.message = message;
    this.result = result;
  }

  public static ResponseEntity<ApiResponse<?>> onFailure(ErrorStatus error) {
    return new ResponseEntity<>(
        new ApiResponse<>(false, error.getCode(), error.getMessage(), null), error.getHttpStatus());
  }

  public static ResponseEntity<ApiResponse<?>> onFailure(ErrorStatus error, String message) {
    return new ResponseEntity<>(
        new ApiResponse<>(false, error.getCode(), error.getMessage(message), null),
        error.getHttpStatus());
  }

  public static ResponseEntity<ApiResponse<?>> onFailure(ErrorStatus error, Object data) {
    return new ResponseEntity<>(
        new ApiResponse<>(false, error.getCode(), error.getMessage(), data), error.getHttpStatus());
  }
}
