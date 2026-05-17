package com.offmode.boundedcontext.mission.repository;

import com.offmode.boundedcontext.mission.entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {}
