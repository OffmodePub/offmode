package com.offmode.boundedcontext.room.entity;

import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "room_proofs",
    uniqueConstraints = @UniqueConstraint(columnNames = {"room_mission_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomProof {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_mission_id", nullable = false)
  private RoomMission roomMission;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  private String photoUrl;

  @Column(length = 500)
  private String caption;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ProofStatus status;

  @CreationTimestamp private LocalDateTime createdAt;
}
