package com.offmode.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.offmode.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private User   user;
    @JsonProperty("isNew")
    private boolean isNew;   // true → 회원가입 화면으로 이동
}
