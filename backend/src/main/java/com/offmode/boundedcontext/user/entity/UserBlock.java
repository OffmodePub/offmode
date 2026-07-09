package com.offmode.boundedcontext.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "user_blocks",
    uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_user_id", "blocked_user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBlock {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "blocker_user_id", nullable = false)
  private User blocker;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "blocked_user_id", nullable = false)
  private User blocked;

  @CreationTimestamp private LocalDateTime createdAt;
}
