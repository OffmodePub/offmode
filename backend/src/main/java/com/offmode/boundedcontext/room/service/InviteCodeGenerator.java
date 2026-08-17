package com.offmode.boundedcontext.room.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/**
 * 방 초대코드를 만든다.
 *
 * <p>사람이 눈으로 읽고 손으로 옮겨 적는 값이라 헷갈리는 문자를 뺐다 — 숫자 0/1 과 알파벳 O/I/L, 그리고 모음이다. 모음을 빼면 우연히 불쾌한 단어가 만들어지지
 * 않는다. 남은 28자로 6자리를 만들어 약 4.8억 가지가 나온다.
 *
 * <p>이전 형식("OFF" + 3자리 숫자)은 조합이 1000개뿐이라 방이 늘면 발급 자체가 실패했고, 순차 대입으로 남의 방에 들어갈 수 있었다. 추측을 막아야 하는
 * 값이므로 난수는 {@link SecureRandom} 을 쓴다.
 *
 * <p>이미 발급된 {@code OFFxxx} 코드는 그대로 유효하다 — 조회가 형식과 무관한 정확 일치라서다. 새 알파벳에는 O 가 없으니 옛 코드와 겹칠 일도 없다.
 */
@Component
public class InviteCodeGenerator {

  /** 숫자 2~9 + 모음과 O·I·L 을 제외한 자음. */
  static final String ALPHABET = "23456789BCDFGHJKMNPQRSTVWXYZ";

  static final int LENGTH = 6;

  private final SecureRandom random = new SecureRandom();

  public String generate() {
    StringBuilder code = new StringBuilder(LENGTH);
    for (int i = 0; i < LENGTH; i++) {
      code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
    }
    return code.toString();
  }
}
