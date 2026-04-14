package com.offmode.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_id"})
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String provider;          // "kakao" | "apple"

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    private String email;

    @Column(nullable = false)
    @Builder.Default
    private String name = "오프모더";

    @Column(nullable = false)
    @Builder.Default
    private String avatar = "🏃";

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Builder.Default
    private Integer missionHour = 8;

    @Builder.Default
    private Integer missionMinute = 0;

    @Builder.Default
    private Boolean autoRoulette = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
