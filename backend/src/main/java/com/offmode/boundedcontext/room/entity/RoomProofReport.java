package com.offmode.boundedcontext.room.entity;

import com.offmode.boundedcontext.room.types.ProofReportReason;
import com.offmode.boundedcontext.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "room_proof_reports",
    uniqueConstraints = @UniqueConstraint(columnNames = {"room_proof_id", "reporter_user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomProofReport {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_proof_id", nullable = false)
  private RoomProof roomProof;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "reporter_user_id", nullable = false)
  private User reporter;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ProofReportReason reason;

  @Column(length = 500)
  private String detail;

  @CreationTimestamp private LocalDateTime createdAt;
}
