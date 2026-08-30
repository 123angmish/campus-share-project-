package com.campusshare.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReturnConfirmationRequest {
    private BigDecimal depositDeductionAmount;
    private String depositDeductionReason;
}
