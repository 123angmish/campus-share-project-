package com.campusshare.dto;

import com.campusshare.model.Report;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponse {
    private Long id;
    private String reportType;
    private String reason;
    private String status;
    private PublicUserResponse reporter;
    private PublicUserResponse reportedUser;
    private ItemResponse reportedItem;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public static ReportResponse from(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .reportType(report.getReportType().name())
                .reason(report.getReason())
                .status(report.getStatus().name())
                .reporter(PublicUserResponse.fromUser(report.getReporter()))
                .reportedUser(PublicUserResponse.fromUser(report.getReportedUser()))
                .reportedItem(report.getReportedItem() == null ? null : ItemResponse.fromItem(report.getReportedItem()))
                .adminNotes(report.getAdminNotes())
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .build();
    }
}
