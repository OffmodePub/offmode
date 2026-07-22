package com.offmode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class OffmodeApplication {
  public static void main(String[] args) {
    SpringApplication.run(OffmodeApplication.class, args);
  }
}
