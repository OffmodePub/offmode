package com.offmode.boundedcontext.badge.app.dto.response;

import com.offmode.boundedcontext.badge.domain.entity.UserBadge;
import com.offmode.boundedcontext.badge.domain.types.BadgeDefinition;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class BadgeDto {
  private final String key;
  private final String name;
  private final String badgeTitle;
  private final String description;
  private final String imageFile;
  private final String group;
  private final boolean earned;
  private final LocalDateTime earnedAt;

  public BadgeDto(BadgeDefinition def, UserBadge userBadge) {
    this.key = def.getKey();
    this.name = def.getName();
    this.badgeTitle = def.getBadgeTitle();
    this.description = def.getDescription();
    this.imageFile = def.getImageFile();
    this.group = def.getGroup();
    this.earned = userBadge != null;
    this.earnedAt = userBadge != null ? userBadge.getEarnedAt() : null;
  }
}
