package com.campusshare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private Long itemsListedCount;
    private Long currentlyRentedOutCount;
    private Long itemsRentingCount;
    private Long pendingRequestsCount;
    private Long completedRentalsCount;
    private BigDecimal totalRentalSpending;
    private BigDecimal totalRentalEarnings;
    private Long wishlistCount;
    private List<ActivityItem> recentActivity;
    private List<MonthlyEarning> monthlyEarnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityItem {
        private String id;
        private String type; // LISTED, REQUESTED, ACCEPTED, PAID, ACTIVE, RETURNED, COMPLETED, REFUNDED
        private String title;
        private String description;
        private LocalDateTime timestamp;
        private String link;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyEarning {
        private String month;
        private BigDecimal amount;
        private Integer count;
    }
}
