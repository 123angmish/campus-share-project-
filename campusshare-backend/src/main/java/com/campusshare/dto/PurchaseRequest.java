package com.campusshare.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PurchaseRequest {
    @NotNull(message = "Item ID is required")
    private Long itemId;

    private String message;
    private String pickupLocation;
    private String meetingTime;
}
