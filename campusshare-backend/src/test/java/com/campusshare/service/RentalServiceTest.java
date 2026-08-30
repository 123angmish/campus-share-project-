package com.campusshare.service;

import com.campusshare.dto.RentalRequest;
import com.campusshare.model.Item;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.User;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalServiceTest {
    @Mock RentalTransactionRepository transactions;
    @Mock ItemRepository items;
    @Mock UserRepository users;
    @Mock EmailService email;
    @Mock NotificationService notificationService;
    @Mock com.campusshare.repository.RentalStatusHistoryRepository statusHistoryRepository;
    @Mock com.campusshare.repository.ReportRepository reports;

    RentalService service;
    User borrower;
    User owner;
    Item item;

    @BeforeEach
    void setUp() {
        service = new RentalService(transactions, items, users, email, notificationService, statusHistoryRepository, reports);
        borrower = User.builder().id(1L).name("Borrower").email("b@college.edu").password("x")
                .department("ECE").year(4).contactNumber("9999999999").emailVerified(true).build();
        owner = User.builder().id(2L).name("Owner").email("o@college.edu").password("x")
                .department("CSE").year(4).contactNumber("8888888888").emailVerified(true).build();
        item = Item.builder().id(7L).title("Calculator").description("Casio")
                .category(Item.Category.ELECTRONICS).dailyPrice(new BigDecimal("40"))
                .weeklyPrice(new BigDecimal("200")).depositAmount(new BigDecimal("100"))
                .owner(owner).availabilityStatus(Item.AvailabilityStatus.AVAILABLE).build();
        when(users.findById(1L)).thenReturn(Optional.of(borrower));
        when(items.findById(7L)).thenReturn(Optional.of(item));
    }

    @Test
    void usesWeeklyRateAndRemainingDailyRate() {
        when(transactions.existsConflictingBooking(anyLong(), any(), any())).thenReturn(false);
        when(transactions.save(any())).thenAnswer(i -> i.getArgument(0));

        RentalRequest request = new RentalRequest();
        request.setItemId(7L);
        request.setStartDate(LocalDate.now().plusDays(1));
        request.setEndDate(LocalDate.now().plusDays(10)); // 9 rental days = 1 week + 2 days

        RentalTransaction result = service.createRentalRequest(request, 1L);

        assertEquals(0, new BigDecimal("280").compareTo(result.getItemAmount()));
        assertEquals(0, new BigDecimal("294").compareTo(result.getTotalAmount()));
        assertEquals(9, result.getDurationDays());
        assertEquals(RentalTransaction.TransactionStatus.PENDING, result.getStatus());
        verify(email).sendRentalRequestNotification(owner.getEmail(), item.getTitle(), borrower.getName());
    }

    @Test
    void rejectsOverlappingAcceptedBooking() {
        when(transactions.existsConflictingBooking(anyLong(), any(), any())).thenReturn(true);
        RentalRequest request = new RentalRequest();
        request.setItemId(7L);
        request.setStartDate(LocalDate.now().plusDays(2));
        request.setEndDate(LocalDate.now().plusDays(4));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.createRentalRequest(request, 1L));
        assertTrue(ex.getMessage().contains("overlap"));
        verify(transactions, never()).save(any());
    }
}
