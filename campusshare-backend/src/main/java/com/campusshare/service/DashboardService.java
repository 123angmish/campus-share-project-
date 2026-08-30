package com.campusshare.service;

import com.campusshare.dto.DashboardResponse;
import com.campusshare.model.Item;
import com.campusshare.model.RentalTransaction;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.NotificationRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ItemRepository itemRepository;
    private final RentalTransactionRepository rentalRepository;
    private final WishlistRepository wishlistRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        long itemsListed = itemRepository.countByOwnerId(userId);
        Long rentedOut = rentalRepository.countActiveRentalsByOwner(userId);
        Long currentlyRenting = rentalRepository.countActiveRentalsByBorrower(userId);
        Long pendingRequests = rentalRepository.countPendingRequestsByOwner(userId);
        Long completedBorrower = rentalRepository.countCompletedRentalsByBorrower(userId);
        Long completedOwner = rentalRepository.countCompletedRentalsByOwner(userId);
        long completedTotal = (completedBorrower != null ? completedBorrower : 0) + (completedOwner != null ? completedOwner : 0);

        Double spentDouble = rentalRepository.getTotalSpent(userId);
        Double earningsDouble = rentalRepository.getTotalEarnings(userId);
        BigDecimal totalSpent = BigDecimal.valueOf(spentDouble != null ? spentDouble : 0.0);
        BigDecimal totalEarnings = BigDecimal.valueOf(earningsDouble != null ? earningsDouble : 0.0);

        long wishlistCount = wishlistRepository.countByUserId(userId);

        // Recent Activity Feed
        List<DashboardResponse.ActivityItem> activities = new ArrayList<>();
        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (var notif : notifications.stream().limit(10).toList()) {
            activities.add(DashboardResponse.ActivityItem.builder()
                    .id("notif-" + notif.getId())
                    .type(notif.getType() != null ? notif.getType() : "GENERAL")
                    .title(notif.getTitle())
                    .description(notif.getMessage())
                    .timestamp(notif.getCreatedAt())
                    .link(notif.getLink())
                    .build());
        }

        // Monthly Earnings for last 6 months
        List<RentalTransaction> completedOwnerTxns = rentalRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .filter(t -> t.getStatus() == RentalTransaction.TransactionStatus.COMPLETED && t.getPaymentStatus() == RentalTransaction.PaymentStatus.PAID)
                .toList();

        Map<String, BigDecimal> monthlyTotals = new LinkedHashMap<>();
        Map<String, Integer> monthlyCounts = new LinkedHashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = 5; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusMonths(i);
            String label = d.format(monthFormatter);
            monthlyTotals.put(label, BigDecimal.ZERO);
            monthlyCounts.put(label, 0);
        }

        for (RentalTransaction tx : completedOwnerTxns) {
            LocalDate date = tx.getItemReturnedAt() != null ? tx.getItemReturnedAt().toLocalDate() : tx.getStartDate();
            String label = date.format(monthFormatter);
            if (monthlyTotals.containsKey(label)) {
                monthlyTotals.put(label, monthlyTotals.get(label).add(tx.getTotalAmount()));
                monthlyCounts.put(label, monthlyCounts.get(label) + 1);
            }
        }

        List<DashboardResponse.MonthlyEarning> monthlyEarnings = monthlyTotals.entrySet().stream()
                .map(e -> DashboardResponse.MonthlyEarning.builder()
                        .month(e.getKey())
                        .amount(e.getValue())
                        .count(monthlyCounts.get(e.getKey()))
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .itemsListedCount(itemsListed)
                .currentlyRentedOutCount(rentedOut != null ? rentedOut : 0)
                .itemsRentingCount(currentlyRenting != null ? currentlyRenting : 0)
                .pendingRequestsCount(pendingRequests != null ? pendingRequests : 0)
                .completedRentalsCount(completedTotal)
                .totalRentalSpending(totalSpent)
                .totalRentalEarnings(totalEarnings)
                .wishlistCount(wishlistCount)
                .recentActivity(activities)
                .monthlyEarnings(monthlyEarnings)
                .build();
    }
}
