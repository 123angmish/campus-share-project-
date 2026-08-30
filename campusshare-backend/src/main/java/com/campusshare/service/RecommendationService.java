package com.campusshare.service;

import com.campusshare.dto.ItemResponse;
import com.campusshare.dto.RecommendationResponse;
import com.campusshare.model.Item;
import com.campusshare.model.RentalTransaction;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.UserRepository;
import com.campusshare.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Explainable marketplace ranking. It deliberately avoids pretending a simple heuristic is "AI":
 * user intent, owner trust, freshness and demand signals are combined into a deterministic score.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {
    private final ItemRepository items;
    private final WishlistRepository wishlist;
    private final RentalTransactionRepository rentals;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<RecommendationResponse> recommend(Long userId, int requestedLimit) {
        users.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        int limit = Math.max(1, Math.min(requestedLimit, 12));

        EnumMap<Item.Category, Integer> preference = new EnumMap<>(Item.Category.class);
        wishlist.findByUserIdOrderByCreatedAtDesc(userId).forEach(saved ->
                preference.merge(saved.getItem().getCategory(), 4, Integer::sum));
        rentals.findByBorrowerIdOrderByCreatedAtDesc(userId).stream()
                .filter(r -> r.getStatus() != RentalTransaction.TransactionStatus.DECLINED
                        && r.getStatus() != RentalTransaction.TransactionStatus.CANCELLED)
                .forEach(r -> preference.merge(r.getItem().getCategory(), 6, Integer::sum));

        boolean coldStart = preference.isEmpty();
        List<Item> candidates = items.findRecommendationCandidates(userId, PageRequest.of(0, 100));

        return candidates.stream()
                .map(item -> score(item, preference, coldStart))
                .sorted(Comparator.comparing(RecommendationResponse::getMatchScore).reversed()
                        .thenComparing(rec -> Optional.ofNullable(rec.getItem().getCreatedAt()).orElse(LocalDateTime.MIN), Comparator.reverseOrder()))
                .limit(limit)
                .toList();
    }

    private RecommendationResponse score(Item item, Map<Item.Category, Integer> preference, boolean coldStart) {
        int score = 35;
        int categoryWeight = preference.getOrDefault(item.getCategory(), 0);
        score += Math.min(30, categoryWeight * 3);

        double reputation = item.getOwner().getReputationScore() == null ? 5.0 : item.getOwner().getReputationScore();
        score += (int) Math.round(Math.max(0, Math.min(5, reputation)) / 5.0 * 15);

        int views = item.getViewCount() == null ? 0 : item.getViewCount();
        score += Math.min(10, views / 5);

        long ageDays = item.getCreatedAt() == null ? 365 : Math.max(0, Duration.between(item.getCreatedAt(), LocalDateTime.now()).toDays());
        if (ageDays <= 7) score += 10;
        else if (ageDays <= 30) score += 5;

        score = Math.max(1, Math.min(99, score));
        String reason;
        if (categoryWeight > 0) {
            reason = "Matches your " + pretty(item.getCategory()) + " activity";
        } else if (reputation >= 4.6) {
            reason = "Highly rated campus owner";
        } else if (views >= 20) {
            reason = "Popular on your campus";
        } else if (coldStart) {
            reason = "Fresh trusted campus listing";
        } else {
            reason = "Explore something new";
        }

        return RecommendationResponse.builder()
                .item(ItemResponse.fromItem(item))
                .matchScore(score)
                .reason(reason)
                .build();
    }

    private String pretty(Item.Category category) {
        String value = category.name().toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
