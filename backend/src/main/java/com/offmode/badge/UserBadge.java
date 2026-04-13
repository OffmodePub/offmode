package com.offmode.badge;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.offmode.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_badges",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "badge_key"})
)
@Getter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserBadge {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "badge_key", nullable = false)
    private String badgeKey;

    @CreationTimestamp
    private LocalDateTime earnedAt;
}
