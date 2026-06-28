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

/** 유저별 장착 중인 파츠. 동시 장착은 1개만 허용하므로 유저당 한 행만 존재한다. */
@Entity
@Table(name = "user_parts", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id"}))
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

  @Column(name = "equipped_key")
  private String equippedKey; // null 이면 장착 해제 상태

  @UpdateTimestamp private LocalDateTime updatedAt;

  /** 장착 파츠 변경 (null 이면 해제). */
  public void updateEquippedKey(String equippedKey) {
    this.equippedKey = equippedKey;
  }
}
