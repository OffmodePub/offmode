package com.offmode.mission;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.offmode.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_missions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserMission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String missionIcon;

    @Column(nullable = false)
    private String missionText;

    @Column(nullable = false)
    private String missionCategory;

    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";   // "pending" | "verified"

    @CreationTimestamp
    private LocalDateTime assignedAt;

    private LocalDateTime verifiedAt;
}
