package com.campusshare.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MeetingProposalRequest {
    @NotBlank(message = "Meeting location is required")
    private String location;

    @NotNull(message = "Meeting date is required")
    @FutureOrPresent(message = "Meeting date cannot be in the past")
    private LocalDate date;

    @NotBlank(message = "Meeting time is required")
    private String time;

    private String notes;
}
