package com.campusshare.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentOrderResponse {
    private Long paymentAttemptId;
    private String orderId;
    private String keyId;
    private Long amountPaise;
    private BigDecimal amount;
    private String currency;
    private String itemTitle;
    private String userName;
    private String userEmail;
    private String userPhone;
}
