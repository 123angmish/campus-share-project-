package com.campusshare.repository;

import com.campusshare.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatus(Report.ReportStatus status);
    long countByStatusIn(Collection<Report.ReportStatus> statuses);

    @Query("SELECT r FROM Report r WHERE r.status = 'PENDING' ORDER BY r.createdAt DESC")
    List<Report> findPendingReports();

    List<Report> findByReportedUserId(Long userId);
    List<Report> findByReportedItemId(Long itemId);
    List<Report> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.reportedUser.id = :userId")
    Long countReportsAgainstUser(Long userId);

    long countByReportedItemIdAndStatusIn(Long itemId, Collection<Report.ReportStatus> statuses);
    long countByReportedUserIdAndStatusIn(Long userId, Collection<Report.ReportStatus> statuses);

    boolean existsByReporterIdAndReportedItemIdAndStatusIn(Long reporterId, Long itemId, Collection<Report.ReportStatus> statuses);
    boolean existsByReporterIdAndReportedUserIdAndStatusIn(Long reporterId, Long userId, Collection<Report.ReportStatus> statuses);
}
