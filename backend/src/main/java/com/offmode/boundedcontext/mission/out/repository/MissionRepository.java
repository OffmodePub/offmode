package com.offmode.boundedcontext.mission.out.repository;

import com.offmode.boundedcontext.mission.domain.entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {}
