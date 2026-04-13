package com.offmode.feed;

import com.offmode.mission.UserMission;
import com.offmode.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "verifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Verification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_mission_id", nullable = false)
    private UserMission userMission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String photoUrl;

    @Column(length = 500)
    private String caption;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
