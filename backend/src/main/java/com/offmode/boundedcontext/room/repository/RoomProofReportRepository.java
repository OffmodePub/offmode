package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomProofReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomProofReportRepository extends JpaRepository<RoomProofReport, Long> {

  boolean existsByRoomProofIdAndReporterId(Long roomProofId, Long reporterId);
}
