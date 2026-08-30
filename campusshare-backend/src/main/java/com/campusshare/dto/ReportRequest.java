package com.campusshare.dto;

import com.campusshare.model.Report;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportRequest {
    @NotNull(message = "Report type is required")
    private Report.ReportType reportType;

    @NotNull(message = "Target id is required")
    private Long targetId;

    @NotBlank(message = "Tell us what happened")
    @Size(min = 10, max = 1000, message = "Reason must be between 10 and 1000 characters")
    private String reason;
}
