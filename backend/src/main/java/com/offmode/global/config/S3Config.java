package com.offmode.global.config;

import java.net.URI;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class S3Config {

  @Value("${r2.access-key:}")
  private String accessKey;

  @Value("${r2.secret-key:}")
  private String secretKey;

  @Value("${r2.endpoint:}")
  private String endpoint;

  @Bean
  public Optional<S3Client> s3Client() {
    if (accessKey == null || accessKey.isBlank()) {
      return Optional.empty();
    }
    return Optional.of(
        S3Client.builder()
            .region(Region.of("auto"))
            .endpointOverride(URI.create(endpoint))
            .credentialsProvider(
                StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
            .httpClient(UrlConnectionHttpClient.builder().build())
            .build());
  }
}
