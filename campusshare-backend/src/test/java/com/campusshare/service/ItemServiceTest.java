package com.campusshare.service;

import com.campusshare.dto.ItemRequest;
import com.campusshare.dto.ItemResponse;
import com.campusshare.model.Item;
import com.campusshare.model.User;
import com.campusshare.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock ItemRepository itemRepository;
    @Mock UserRepository userRepository;
    @Mock RentalTransactionRepository rentalRepository;
    @Mock ChatMessageRepository chatRepository;
    @Mock RentalStatusHistoryRepository historyRepository;
    @Mock ReviewRepository reviewRepository;
    @Mock WishlistRepository wishlistRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock ReportRepository reportRepository;

    ItemService service;
    User owner;
    User otherUser;
    Item item;

    @BeforeEach
    void setUp() {
        service = new ItemService(
                itemRepository, userRepository, rentalRepository,
                chatRepository, historyRepository, reviewRepository,
                wishlistRepository, notificationRepository, reportRepository
        );

        owner = User.builder().id(10L).name("Owner").email("owner@college.edu").emailVerified(true).build();
        otherUser = User.builder().id(20L).name("Attacker").email("attacker@college.edu").emailVerified(true).build();

        item = Item.builder()
                .id(100L)
                .title("Scientific Calculator")
                .description("Casio scientific calculator")
                .category(Item.Category.CALCULATOR)
                .condition(Item.ItemCondition.GOOD)
                .dailyPrice(new BigDecimal("50"))
                .owner(owner)
                .availabilityStatus(Item.AvailabilityStatus.AVAILABLE)
                .build();
    }

    @Test
    void rejectsUpdateFromNonOwner_IDORPrevention() {
        when(itemRepository.findById(100L)).thenReturn(Optional.of(item));

        ItemRequest request = new ItemRequest();
        request.setTitle("Hacked Title");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                service.updateItem(100L, request, 20L)
        );
        assertTrue(ex.getMessage().contains("permission"));
        verify(itemRepository, never()).save(any());
    }

    @Test
    void rejectsDeleteFromNonOwner_IDORPrevention() {
        when(itemRepository.findById(100L)).thenReturn(Optional.of(item));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                service.deleteItem(100L, 20L)
        );
        assertTrue(ex.getMessage().contains("permission"));
        verify(itemRepository, never()).save(any());
    }

    @Test
    void allowsOwnerToUpdateItem() {
        when(itemRepository.findById(100L)).thenReturn(Optional.of(item));
        when(itemRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ItemRequest request = new ItemRequest();
        request.setTitle("Updated Casio Calculator");

        ItemResponse response = service.updateItem(100L, request, 10L);
        assertEquals("Updated Casio Calculator", response.getTitle());
    }
}
