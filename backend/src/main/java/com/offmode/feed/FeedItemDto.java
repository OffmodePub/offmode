package com.offmode.feed;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class FeedItemDto {
    private Long          id;
    private String        photoUrl;
    private String        caption;
    private LocalDateTime createdAt;
    private String        userName;
    private String        userAvatar;
    private Integer       userLevel;
    private String        missionIcon;
    private String        missionText;
    private String        missionCategory;
    private long          verifyCount;
    private boolean       myVerify;
    private boolean       isOwn;

    // JPQL 쿼리 후 서비스에서 채움
    @Setter
    private List<ReactionSummaryDto> reactions;
}
