package com.offmode.boundedcontext.room.service;

import com.offmode.boundedcontext.room.dto.response.RoomProofResponse;
import com.offmode.boundedcontext.room.dto.response.RoomReactionSummaryResponse;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomReactionRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** RoomProof 엔티티를 응답 DTO로 변환하는 공용 헬퍼 (방 상세/인증 상세/리액션 응답에서 재사용). */
@Component
@RequiredArgsConstructor
public class RoomProofAssembler {

  // UI 기본 노출 이모지 — count 0이어도 항상 내려준다.
  static final List<String> DEFAULT_EMOJIS = List.of("🔥", "👍", "❤️");

  private final RoomProofConfirmRepository confirmRepository;
  private final RoomReactionRepository reactionRepository;

  public RoomProofResponse build(RoomProof proof, int requiredConfirm, Long currentUserId) {
    return buildAll(List.of(proof), requiredConfirm, currentUserId).getFirst();
  }

  public List<RoomProofResponse> buildAll(
      List<RoomProof> proofs, int requiredConfirm, Long currentUserId) {
    if (proofs.isEmpty()) return List.of();

    // confirm/리액션을 인증 건수와 무관하게 상수 쿼리로 배치 조회해 집계한다.
    List<Long> proofIds = proofs.stream().map(RoomProof::getId).toList();
    Map<Long, Long> confirmCounts = new HashMap<>();
    Set<Long> myConfirmedProofIds = new HashSet<>();
    for (Object[] row : confirmRepository.findRowsByRoomProofIdIn(proofIds)) {
      Long proofId = ((Number) row[0]).longValue();
      Long confirmerUserId = ((Number) row[1]).longValue();
      confirmCounts.merge(proofId, 1L, Long::sum);
      if (confirmerUserId.equals(currentUserId)) {
        myConfirmedProofIds.add(proofId);
      }
    }
    Map<Long, List<Object[]>> reactionRowsByProofId =
        reactionRepository.findRowsByRoomProofIdIn(proofIds).stream()
            .collect(Collectors.groupingBy(row -> ((Number) row[0]).longValue()));

    List<RoomProofResponse> result = new ArrayList<>();
    for (RoomProof proof : proofs) {
      result.add(
          new RoomProofResponse(
              proof.getId(),
              proof.getUser().getId(),
              proof.getUser().getName(),
              proof.getUser().getAvatar(),
              proof.getPhotoUrl(),
              proof.getCaption(),
              proof.getCreatedAt(),
              proof.getStatus(),
              confirmCounts.getOrDefault(proof.getId(), 0L).intValue(),
              requiredConfirm,
              myConfirmedProofIds.contains(proof.getId()),
              proof.getUser().getId().equals(currentUserId),
              aggregateReactions(
                  reactionRowsByProofId.getOrDefault(proof.getId(), List.of()), currentUserId)));
    }
    return result;
  }

  /** reaction row(Object[]{proofId, emoji, userId}) 목록을 기본 이모지 패딩과 함께 집계한다. */
  public List<RoomReactionSummaryResponse> aggregateReactions(
      List<Object[]> rows, Long currentUserId) {
    Map<String, long[]> counts = new LinkedHashMap<>(); // emoji -> {count, mine(0/1)}
    DEFAULT_EMOJIS.forEach(emoji -> counts.put(emoji, new long[] {0L, 0L}));

    for (Object[] row : rows) {
      String emoji = (String) row[1];
      Long reactorId = ((Number) row[2]).longValue();
      long[] agg = counts.computeIfAbsent(emoji, key -> new long[] {0L, 0L});
      agg[0]++;
      if (reactorId.equals(currentUserId)) {
        agg[1] = 1L;
      }
    }

    List<RoomReactionSummaryResponse> defaults = new ArrayList<>();
    List<RoomReactionSummaryResponse> extras = new ArrayList<>();
    counts.forEach(
        (emoji, agg) -> {
          RoomReactionSummaryResponse summary =
              new RoomReactionSummaryResponse(emoji, agg[0], agg[1] == 1L);
          if (DEFAULT_EMOJIS.contains(emoji)) {
            defaults.add(summary);
          } else {
            extras.add(summary);
          }
        });
    extras.sort(
        Comparator.comparingLong(RoomReactionSummaryResponse::count)
            .reversed()
            .thenComparing(RoomReactionSummaryResponse::emoji));

    List<RoomReactionSummaryResponse> result = new ArrayList<>(defaults);
    result.addAll(extras);
    return result;
  }
}
