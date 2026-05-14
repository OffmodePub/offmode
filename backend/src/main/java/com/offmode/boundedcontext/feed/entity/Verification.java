package com.offmode.boundedcontext.feed.domain.entity;

import com.offmode.boundedcontext.mission.domain.entity.UserMission;
import com.offmode.boundedcontext.user.domain.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Verification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_mission_id", nullable = false)
  private UserMission userMission;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  private String photoUrl;

  @Column(length = 500)
  private String caption;

  @CreationTimestamp private LocalDateTime createdAt;
}
