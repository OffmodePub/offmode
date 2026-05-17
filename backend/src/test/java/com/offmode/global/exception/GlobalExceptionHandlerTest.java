package com.offmode.global.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.offmode.global.dto.response.ApiResponse;
import com.offmode.global.status.ErrorStatus;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class GlobalExceptionHandlerTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  void businessExceptionReturnsMappedStatusAndCode() {
    ResponseEntity<ApiResponse<?>> response =
        handler.handleBusinessException(
            new BusinessException(ErrorStatus.VERIFICATION_ALREADY_CONFIRMED));

    assertThat(response.getStatusCode())
        .isEqualTo(ErrorStatus.VERIFICATION_ALREADY_CONFIRMED.getHttpStatus());
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().getIsSuccess()).isFalse();
    assertThat(response.getBody().getCode()).isEqualTo("VERIFICATION_409_002");
  }

  @Test
  void unexpectedExceptionReturnsGenericServerError() {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");

    ResponseEntity<ApiResponse<?>> response =
        handler.handleException(new IllegalStateException("hidden detail"), request);

    assertThat(response.getStatusCode())
        .isEqualTo(ErrorStatus.INTERNAL_SERVER_ERROR.getHttpStatus());
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().getCode()).isEqualTo("COMMON_500");
    assertThat(response.getBody().getMessage()).isEqualTo("서버 에러, 관리자에게 문의 바랍니다.");
  }
}
