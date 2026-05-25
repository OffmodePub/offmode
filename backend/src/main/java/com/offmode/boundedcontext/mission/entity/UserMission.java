package com.offmode.boundedcontext.mission.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "user_missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  private String missionIcon;

  @Column(nullable = false)
  private String missionText;

  @Column(nullable = false)
  private MissionCategory missionCategory;

  @Column(nullable = false)
  @Builder.Default
  private MissionStatus status = MissionStatus.PENDING;

  @CreationTimestamp private LocalDateTime assignedAt;

  private LocalDateTime verifiedAt;
}
