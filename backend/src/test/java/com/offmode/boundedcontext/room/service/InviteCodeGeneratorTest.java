package com.offmode.boundedcontext.room.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class InviteCodeGeneratorTest {

  private final InviteCodeGenerator generator = new InviteCodeGenerator();

  @Test
  void generatesSixCharacterUppercaseCode() {
    assertThat(generator.generate()).hasSize(6).matches("[A-Z0-9]{6}");
  }

  @Test
  void usesOnlyAllowedAlphabet() {
    IntStream.range(0, 500)
        .forEach(
            i ->
                assertThat(generator.generate())
                    .matches("[" + InviteCodeGenerator.ALPHABET + "]{6}"));
  }

  @Test
  void excludesCharactersThatAreEasilyConfused() {
    // 0/O, 1/I/L 은 손으로 옮겨 적을 때 서로 헷갈린다
    assertThat(InviteCodeGenerator.ALPHABET).doesNotContain("0", "1", "O", "I", "L");
  }

  @Test
  void excludesVowelsSoCodesCannotSpellWords() {
    assertThat(InviteCodeGenerator.ALPHABET).doesNotContain("A", "E", "I", "O", "U");
  }

  @Test
  void producesDistinctCodesAcrossManyCalls() {
    // 4.8억 조합에서 1000개를 뽑으면 충돌 확률은 사실상 0이다.
    // 상수를 반환하거나 난수원이 고장 난 경우를 잡는다.
    Set<String> codes = new HashSet<>();
    IntStream.range(0, 1000).forEach(i -> codes.add(generator.generate()));

    assertThat(codes).hasSize(1000);
  }

  @Test
  void doesNotCollideWithLegacyOffPrefixedCodes() {
    // 기존 코드는 "OFF"로 시작한다. 새 알파벳에 O 가 없어 구조적으로 겹칠 수 없다.
    assertThat(InviteCodeGenerator.ALPHABET).doesNotContain("O");
    IntStream.range(0, 200).forEach(i -> assertThat(generator.generate()).doesNotStartWith("OFF"));
  }
}
