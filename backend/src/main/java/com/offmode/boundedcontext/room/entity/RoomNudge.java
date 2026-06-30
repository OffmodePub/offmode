package com.offmode.boundedcontext.room.entity;

import com.offmode.boundedcontext.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "room_nudges",
    uniqueConstraints =
        @UniqueConstraint(columnNames = {"room_mission_id", "from_user_id", "to_user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomNudge {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_mission_id", nullable = false)
  private RoomMission roomMission;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "from_user_id", nullable = false)
  private User fromUser;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "to_user_id", nullable = false)
  private User toUser;

  @CreationTimestamp private LocalDateTime createdAt;
}
