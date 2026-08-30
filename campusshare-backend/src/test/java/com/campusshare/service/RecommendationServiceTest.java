package com.campusshare.service;

import com.campusshare.dto.RecommendationResponse;
import com.campusshare.model.Item;
import com.campusshare.model.User;
import com.campusshare.model.WishlistItem;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.UserRepository;
import com.campusshare.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {
    @Mock ItemRepository items;
    @Mock WishlistRepository wishlist;
    @Mock RentalTransactionRepository rentals;
    @Mock UserRepository users;

    RecommendationService service;
    User current;
    User trustedOwner;

    @BeforeEach
    void setUp() {
        service = new RecommendationService(items, wishlist, rentals, users);
        current = user(1L, "Current", 4.4);
        trustedOwner = user(2L, "Trusted", 4.9);
        when(users.findById(1L)).thenReturn(Optional.of(current));
        when(rentals.findByBorrowerIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
    }

    @Test
    void categoryIntentOutranksUnrelatedListingAndReturnsExplanation() {
        Item savedBook = item(10L, "DSA Book", Item.Category.BOOKS, 2);
        Item bookCandidate = item(11L, "Operating Systems", Item.Category.BOOKS, 2);
        Item sportsCandidate = item(12L, "Badminton Racket", Item.Category.SPORTS, 80);

        when(wishlist.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(WishlistItem.builder().user(current).item(savedBook).build()));
        when(items.findRecommendationCandidates(eq(1L), any()))
                .thenReturn(List.of(sportsCandidate, bookCandidate));

        List<RecommendationResponse> result = service.recommend(1L, 6);

        assertEquals(2, result.size());
        assertEquals(11L, result.get(0).getItem().getId());
        assertTrue(result.get(0).getReason().contains("Books"));
        assertTrue(result.get(0).getMatchScore() > result.get(1).getMatchScore());
    }

    @Test
    void coldStartStillRanksTrustedFreshListings() {
        when(wishlist.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        Item fresh = item(21L, "Calculator", Item.Category.ELECTRONICS, 3);
        fresh.setCreatedAt(LocalDateTime.now().minusDays(1));
        when(items.findRecommendationCandidates(eq(1L), any())).thenReturn(List.of(fresh));

        RecommendationResponse result = service.recommend(1L, 1).getFirst();

        assertEquals(21L, result.getItem().getId());
        assertTrue(result.getMatchScore() >= 50);
        assertFalse(result.getReason().isBlank());
    }

    private Item item(Long id, String title, Item.Category category, int views) {
        return Item.builder().id(id).title(title).description("Useful campus item")
                .category(category).dailyPrice(new BigDecimal("50.00"))
                .availabilityStatus(Item.AvailabilityStatus.AVAILABLE)
                .owner(trustedOwner).viewCount(views).createdAt(LocalDateTime.now().minusDays(3)).build();
    }

    private User user(Long id, String name, double rating) {
        return User.builder().id(id).name(name).email(name.toLowerCase() + "@college.edu")
                .password("hash").department("ECE").year(4).contactNumber("9999999999")
                .emailVerified(true).active(true).reputationScore(rating).totalReviews(10).build();
    }
}
