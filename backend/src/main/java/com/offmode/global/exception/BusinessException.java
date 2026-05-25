package com.offmode.global.exception;

import com.offmode.global.status.ErrorStatus;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

  private final ErrorStatus errorStatus;
  private final Object data;

  public BusinessException(ErrorStatus errorStatus) {
    super(errorStatus.getMessage());
    this.errorStatus = errorStatus;
    this.data = null;
  }

  public BusinessException(ErrorStatus errorStatus, Object data) {
    super(errorStatus.getMessage());
    this.errorStatus = errorStatus;
    this.data = data;
  }

  public BusinessException(ErrorStatus errorStatus, Throwable cause) {
    super(errorStatus.getMessage(), cause);
    this.errorStatus = errorStatus;
    this.data = null;
  }
}
