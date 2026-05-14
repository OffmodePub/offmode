package com.offmode.boundedcontext.feed.domain.entity;

import com.offmode.boundedcontext.user.domain.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "reactions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"verification_id", "user_id", "emoji"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reaction {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "verification_id", nullable = false)
  private Verification verification;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 10)
  private String emoji;

  @CreationTimestamp private LocalDateTime createdAt;
}
