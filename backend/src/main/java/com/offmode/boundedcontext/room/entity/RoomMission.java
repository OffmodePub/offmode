package com.offmode.boundedcontext.room.entity;

import com.offmode.boundedcontext.room.types.MissionSource;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "room_missions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "mission_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_id", nullable = false)
  private Room room;

  @Column(name = "mission_date", nullable = false)
  private LocalDate date;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String icon;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MissionSource source;

  @CreationTimestamp private LocalDateTime createdAt;
}
