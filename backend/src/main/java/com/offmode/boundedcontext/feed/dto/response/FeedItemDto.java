package com.offmode.boundedcontext.feed.app.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@AllArgsConstructor
public class FeedItemDto {
  private Long id;
  private String photoUrl;
  private String caption;
  private LocalDateTime createdAt;
  private String userName;
  private String userAvatar;
  private Integer userLevel;
  private String missionIcon;
  private String missionText;
  private String missionCategory;
  private long verifyCount;
  private boolean myVerify;

  @JsonProperty("isOwn") // Lombok이 isOwn() 생성 → Jackson이 "own"으로 직렬화하는 문제 방지
  private boolean isOwn;

  // JPQL 쿼리 후 서비스에서 채움
  @Setter private List<ReactionSummaryDto> reactions;
}
