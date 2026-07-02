package com.offmode.boundedcontext.part.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.offmode.boundedcontext.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

/** 유저별로 캐릭터에 자유 배치된 파츠 1개. 유저당 파츠 종류별로 최대 한 행씩 존재한다. */
@Entity
@Table(
    name = "user_parts",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "part_key"}))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPart {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "part_key", nullable = false)
  private String partKey;

  @Column(name = "pos_x", nullable = false)
  private double posX; // 0~1 정규화 X 좌표

  @Column(name = "pos_y", nullable = false)
  private double posY; // 0~1 정규화 Y 좌표

  @Column(name = "scale", nullable = false)
  private double scale;

  @Column(name = "rotation", nullable = false)
  private double rotation; // 도(degree)

  @Column(name = "z_index", nullable = false)
  private int zIndex;

  @UpdateTimestamp private LocalDateTime updatedAt;
}
