package com.campusshare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentMarkRequest {
    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // UPI, CASH, ONLINE_RAZORPAY
}
