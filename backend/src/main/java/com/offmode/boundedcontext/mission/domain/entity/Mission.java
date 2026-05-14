package com.offmode.boundedcontext.mission.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "missions")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String icon;

  @Column(nullable = false)
  private String text;

  @Column(nullable = false)
  private String category; // "Vitality" | "Energy" | "Intellect"
}
