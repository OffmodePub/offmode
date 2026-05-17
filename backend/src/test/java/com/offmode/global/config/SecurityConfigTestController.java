package com.offmode.global.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class SecurityConfigTestController {

  @GetMapping("/h2-console/test")
  String h2Console() {
    return "ok";
  }
}
