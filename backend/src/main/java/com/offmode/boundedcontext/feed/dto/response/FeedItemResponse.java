package com.offmode.boundedcontext.feed.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@AllArgsConstructor
public class FeedItemResponse {
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
  @Setter private List<ReactionSummaryResponse> reactions;

  public FeedItemResponse(
      Long id,
      String photoUrl,
      String caption,
      LocalDateTime createdAt,
      String userName,
      String userAvatar,
      Integer userLevel,
      String missionIcon,
      String missionText,
      MissionCategory missionCategory,
      long verifyCount,
      boolean myVerify,
      boolean isOwn,
      List<ReactionSummaryResponse> reactions) {
    this(
        id,
        photoUrl,
        caption,
        createdAt,
        userName,
        userAvatar,
        userLevel,
        missionIcon,
        missionText,
        missionCategory.value(),
        verifyCount,
        myVerify,
        isOwn,
        reactions);
  }
}
