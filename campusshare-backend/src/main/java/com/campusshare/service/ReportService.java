package com.campusshare.service;

import com.campusshare.dto.AdminReportActionRequest;
import com.campusshare.dto.ReportRequest;
import com.campusshare.dto.ReportResponse;
import com.campusshare.model.Item;
import com.campusshare.model.Report;
import com.campusshare.model.User;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.ReportRepository;
import com.campusshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {
    private static final List<Report.ReportStatus> OPEN = List.of(Report.ReportStatus.PENDING, Report.ReportStatus.INVESTIGATING);

    private final ReportRepository reports;
    private final UserRepository users;
    private final ItemRepository items;

    @Transactional
    public ReportResponse create(ReportRequest request, Long reporterId) {
        User reporter = users.findById(reporterId).orElseThrow(() -> new RuntimeException("Reporter not found"));
        Report.ReportBuilder builder = Report.builder()
                .reporter(reporter)
                .reportType(request.getReportType())
                .reason(request.getReason().trim())
                .status(Report.ReportStatus.PENDING);

        if (request.getReportType() == Report.ReportType.USER) {
            User target = users.findById(request.getTargetId()).orElseThrow(() -> new RuntimeException("User not found"));
            if (target.getId().equals(reporterId)) throw new RuntimeException("You cannot report yourself");
            if (reports.existsByReporterIdAndReportedUserIdAndStatusIn(reporterId, target.getId(), OPEN)) {
                throw new RuntimeException("You already have an open report for this user");
            }
            builder.reportedUser(target);
            target.setReportCount((target.getReportCount() == null ? 0 : target.getReportCount()) + 1);
            users.save(target);
        } else {
            Item target = items.findById(request.getTargetId()).orElseThrow(() -> new RuntimeException("Item not found"));
            if (target.getOwner().getId().equals(reporterId)) throw new RuntimeException("You cannot report your own listing");
            if (reports.existsByReporterIdAndReportedItemIdAndStatusIn(reporterId, target.getId(), OPEN)) {
                throw new RuntimeException("You already have an open report for this listing");
            }
            builder.reportedItem(target);
        }

        Report saved = reports.save(builder.build());
        applyAutoFlagIfNeeded(saved);
        return ReportResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> mine(Long reporterId) {
        return reports.findByReporterIdOrderByCreatedAtDesc(reporterId).stream()
                .map(ReportResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> list(Report.ReportStatus status) {
        List<Report> source = status == null ? reports.findAll() : reports.findByStatus(status);
        return source.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(ReportResponse::from)
                .toList();
    }

    @Transactional
    public ReportResponse moderate(Long reportId, AdminReportActionRequest request, Long adminId) {
        Report report = reports.findById(reportId).orElseThrow(() -> new RuntimeException("Report not found"));
        User admin = users.findById(adminId).orElseThrow(() -> new RuntimeException("Admin not found"));
        if (admin.getRole() != User.Role.ADMIN) throw new RuntimeException("Admin access required");

        report.setStatus(request.getStatus());
        report.setAdminNotes(clean(request.getAdminNotes()));
        if (request.getStatus() == Report.ReportStatus.RESOLVED || request.getStatus() == Report.ReportStatus.DISMISSED) {
            report.setResolvedAt(LocalDateTime.now());
            report.setResolvedBy(admin);
        } else {
            report.setResolvedAt(null);
            report.setResolvedBy(null);
        }

        applyAction(report, request.getAction());
        return ReportResponse.from(reports.save(report));
    }

    private void applyAction(Report report, AdminReportActionRequest.ModerationAction action) {
        if (action == null || action == AdminReportActionRequest.ModerationAction.NONE) return;
        switch (action) {
            case FLAG_ITEM -> {
                if (report.getReportedItem() == null) throw new RuntimeException("This report is not about an item");
                report.getReportedItem().setFlagged(true);
                report.getReportedItem().setFlagReason(limit("Admin moderation: " + report.getReason(), 500));
                items.save(report.getReportedItem());
            }
            case UNFLAG_ITEM -> {
                if (report.getReportedItem() == null) throw new RuntimeException("This report is not about an item");
                report.getReportedItem().setFlagged(false);
                report.getReportedItem().setFlagReason(null);
                items.save(report.getReportedItem());
            }
            case DEACTIVATE_USER -> {
                if (report.getReportedUser() == null) throw new RuntimeException("This report is not about a user");
                if (report.getReportedUser().getRole() == User.Role.ADMIN) throw new RuntimeException("Admin accounts require a separate privileged process");
                report.getReportedUser().setActive(false);
                report.getReportedUser().setRefreshTokenHash(null);
                report.getReportedUser().setRefreshTokenExpiry(null);
                items.findByOwnerId(report.getReportedUser().getId()).forEach(item -> {
                    item.setFlagged(true);
                    item.setFlagReason("Owner account suspended by moderation");
                    items.save(item);
                });
                users.save(report.getReportedUser());
            }
            case ACTIVATE_USER -> {
                if (report.getReportedUser() == null) throw new RuntimeException("This report is not about a user");
                report.getReportedUser().setActive(true);
                items.findByOwnerId(report.getReportedUser().getId()).forEach(item -> {
                    if (Boolean.TRUE.equals(item.getFlagged()) && "Owner account suspended by moderation".equals(item.getFlagReason())) {
                        item.setFlagged(false);
                        item.setFlagReason(null);
                        items.save(item);
                    }
                });
                users.save(report.getReportedUser());
            }
            default -> { }
        }
    }

    private void applyAutoFlagIfNeeded(Report report) {
        if (report.getReportedItem() == null) return;
        long openReports = reports.countByReportedItemIdAndStatusIn(report.getReportedItem().getId(), OPEN);
        if (openReports >= 3) {
            Item item = report.getReportedItem();
            item.setFlagged(true);
            item.setFlagReason("Auto-flagged after multiple community reports; awaiting admin review");
            items.save(item);
        }
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String limit(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
