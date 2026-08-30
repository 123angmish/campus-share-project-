package com.campusshare.dto;

import com.campusshare.model.Report;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminReportActionRequest {
    @NotNull(message = "Status is required")
    private Report.ReportStatus status;

    @Size(max = 1000, message = "Admin notes cannot exceed 1000 characters")
    private String adminNotes;

    private ModerationAction action = ModerationAction.NONE;

    public enum ModerationAction {
        NONE,
        FLAG_ITEM,
        UNFLAG_ITEM,
        DEACTIVATE_USER,
        ACTIVATE_USER
    }
}
