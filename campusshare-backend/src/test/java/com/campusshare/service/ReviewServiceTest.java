package com.campusshare.service;

import com.campusshare.dto.ReviewRequest;
import com.campusshare.model.Item;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.Review;
import com.campusshare.model.User;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.ReviewRepository;
import com.campusshare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {
    @Mock ReviewRepository reviews;
    @Mock RentalTransactionRepository rentals;
    @Mock UserRepository users;
    @Mock NotificationService notificationService;

    ReviewService service;
    User borrower;
    User owner;
    RentalTransaction rental;

    @BeforeEach
    void setUp() {
        service = new ReviewService(reviews, rentals, users, notificationService);
        borrower = User.builder().id(1L).name("Borrower").email("b@college.edu").password("x")
                .department("ECE").year(4).contactNumber("9999999999").emailVerified(true).build();
        owner = User.builder().id(2L).name("Owner").email("o@college.edu").password("x")
                .department("CSE").year(4).contactNumber("8888888888").emailVerified(true).build();
        Item item = Item.builder().id(3L).title("Calculator").description("Casio")
                .category(Item.Category.STATIONERY).dailyPrice(new BigDecimal("30"))
                .owner(owner).availabilityStatus(Item.AvailabilityStatus.AVAILABLE).build();
        rental = RentalTransaction.builder().id(10L).item(item).borrower(borrower).owner(owner)
                .status(RentalTransaction.TransactionStatus.COMPLETED).paymentStatus(RentalTransaction.PaymentStatus.PAID)
                .totalAmount(new BigDecimal("90")).build();
    }

    @Test
    void borrowerAndOwnerCanEachReviewSameCompletedRental() {
        when(rentals.findById(10L)).thenReturn(Optional.of(rental));
        when(users.findById(1L)).thenReturn(Optional.of(borrower));
        when(users.findById(2L)).thenReturn(Optional.of(owner));
        when(reviews.existsByTransactionIdAndReviewerId(10L, 1L)).thenReturn(false);
        when(reviews.existsByTransactionIdAndReviewerId(10L, 2L)).thenReturn(false);
        when(reviews.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(r.getReviewer().getId() + 100);
            return r;
        });
        when(reviews.getAverageRatingForUser(anyLong())).thenReturn(5.0);
        when(reviews.countReviewsForUser(anyLong())).thenReturn(1L);
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewRequest fromBorrower = request(10L, 5, "Smooth handover");
        ReviewRequest fromOwner = request(10L, 5, "Responsible borrower");

        assertEquals(owner.getId(), service.createReview(fromBorrower, borrower.getId()).getReviewee().getId());
        assertEquals(borrower.getId(), service.createReview(fromOwner, owner.getId()).getReviewee().getId());
        verify(reviews, times(2)).save(any(Review.class));
    }

    @Test
    void blocksDuplicateReviewFromSameParty() {
        when(users.findById(1L)).thenReturn(Optional.of(borrower));
        when(rentals.findById(10L)).thenReturn(Optional.of(rental));
        when(reviews.existsByTransactionIdAndReviewerId(10L, 1L)).thenReturn(true);

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> service.createReview(request(10L, 4, "Good rental"), 1L));
        assertTrue(error.getMessage().contains("already reviewed"));
    }

    private ReviewRequest request(Long rentalId, int rating, String comment) {
        ReviewRequest request = new ReviewRequest();
        request.setTransactionId(rentalId);
        request.setRating(rating);
        request.setComment(comment);
        return request;
    }
}
