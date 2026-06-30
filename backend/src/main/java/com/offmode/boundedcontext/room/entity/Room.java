package com.offmode.boundedcontext.room.entity;

import com.offmode.boundedcontext.room.types.RoomIconKey;
import com.offmode.boundedcontext.room.types.RoomType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "rooms", uniqueConstraints = @UniqueConstraint(columnNames = {"invite_code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(name = "icon_key", nullable = false)
  private RoomIconKey iconKey;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private RoomType type;

  // GROUP 방만 발급. SOLO는 null.
  @Column(name = "invite_code")
  private String inviteCode;

  @CreationTimestamp private LocalDateTime createdAt;
}
