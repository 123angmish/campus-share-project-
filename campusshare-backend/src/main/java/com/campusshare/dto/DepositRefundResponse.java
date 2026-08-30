package com.campusshare.dto;
import lombok.*; import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor public class DepositRefundResponse { private String refundId; private BigDecimal amount; private String status; }
