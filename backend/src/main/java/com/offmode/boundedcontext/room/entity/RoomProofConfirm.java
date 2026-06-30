package com.offmode.boundedcontext.room.entity;

import com.offmode.boundedcontext.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "room_proof_confirms",
    uniqueConstraints = @UniqueConstraint(columnNames = {"room_proof_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomProofConfirm {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_proof_id", nullable = false)
  private RoomProof roomProof;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @CreationTimestamp private LocalDateTime confirmedAt;
}
