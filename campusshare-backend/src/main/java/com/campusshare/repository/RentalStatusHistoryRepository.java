package com.campusshare.repository;

import com.campusshare.model.RentalStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalStatusHistoryRepository extends JpaRepository<RentalStatusHistory, Long> {

    List<RentalStatusHistory> findByRentalIdOrderByCreatedAtAsc(Long rentalId);
}
