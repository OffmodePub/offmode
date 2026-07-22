package com.offmode.global.push;

import com.offmode.boundedcontext.user.repository.UserRepository;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Expo Push Service로 원격 푸시를 보낸다.
 *
 * <p>발송은 별도 스레드에서 이뤄지고 실패해도 예외를 밖으로 던지지 않는다 — 푸시가 실패해도 호출부(콕 찌르기 등)의 본래 동작은 성공한다. 토큰이 만료된
 * 경우(DeviceNotRegistered) 저장된 토큰을 지운다.
 *
 * <p>LazyInitializationException 을 피하기 위해 엔티티가 아니라 스칼라 값(userId, token)만 받는다.
 */
@Slf4j
@Service
public class PushService {

  private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
  private static final String TOKEN_PREFIX = "ExponentPushToken[";
  private static final String ANDROID_CHANNEL_ID = "offmode-silent-notifications";

  private final RestClient restClient;
  private final UserRepository userRepository;

  public PushService(UserRepository userRepository) {
    this.userRepository = userRepository;

    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(3));
    factory.setReadTimeout(Duration.ofSeconds(5));

    this.restClient = RestClient.builder().requestFactory(factory).build();
  }

  /** 토큰이 없거나 형식이 다르면 조용히 건너뛴다. */
  @Async
  public void send(Long userId, String token, String title, String body, Map<String, Object> data) {
    if (token == null || token.isBlank() || !token.startsWith(TOKEN_PREFIX)) {
      log.debug("푸시 토큰 없음 — 발송 생략 (userId={})", userId);
      return;
    }

    // Map.of 는 null 값을 허용하지 않는다. sound=null 이 Expo 의 무음 발송 규약이라 HashMap 을 쓴다.
    Map<String, Object> message = new HashMap<>();
    message.put("to", token);
    message.put("title", title);
    message.put("body", body);
    message.put("data", data == null ? Map.of() : data);
    // TODO: 효과음 정식 도입 시 "default" 로 바꾼다 (프론트 notifications.js 의 TODO 와 동시에).
    message.put("sound", null);
    message.put("channelId", ANDROID_CHANNEL_ID);

    try {
      ExpoPushResponse response =
          restClient
              .post()
              .uri(EXPO_PUSH_URL)
              .contentType(MediaType.APPLICATION_JSON)
              .body(List.of(message))
              .retrieve()
              .body(ExpoPushResponse.class);

      handleResponse(userId, response);
    } catch (Exception e) {
      log.warn("푸시 발송 실패 (userId={}): {}", userId, e.getMessage());
    }
  }

  private void handleResponse(Long userId, ExpoPushResponse response) {
    if (response == null || response.data() == null || response.data().isEmpty()) return;

    ExpoPushTicket ticket = response.data().get(0);
    if ("ok".equals(ticket.status())) return;

    log.warn("푸시 티켓 오류 (userId={}): {}", userId, ticket.message());

    String errorCode = ticket.details() == null ? null : ticket.details().error();
    if ("DeviceNotRegistered".equals(errorCode)) {
      userRepository
          .findById(userId)
          .ifPresent(
              user -> {
                user.setExpoPushToken(null);
                userRepository.save(user);
              });
    }
  }

  record ExpoPushResponse(List<ExpoPushTicket> data) {}

  record ExpoPushTicket(String status, String message, ExpoPushTicketDetails details) {}

  record ExpoPushTicketDetails(String error) {}
}
