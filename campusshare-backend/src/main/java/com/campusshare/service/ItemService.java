package com.campusshare.service;

import com.campusshare.dto.ItemRequest;
import com.campusshare.dto.ItemResponse;
import com.campusshare.model.Item;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.User;
import com.campusshare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final RentalTransactionRepository rentalRepository;
    private final ChatMessageRepository chatRepository;
    private final RentalStatusHistoryRepository historyRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;

    @Transactional
    public void cleanAllDummyData() {
        chatRepository.deleteAll();
        historyRepository.deleteAll();
        reviewRepository.deleteAll();
        notificationRepository.deleteAll();
        wishlistRepository.deleteAll();
        reportRepository.deleteAll();
        rentalRepository.deleteAll();
        itemRepository.deleteAll();
    }

    @Transactional
    public ItemResponse createItem(ItemRequest request, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Boolean.TRUE.equals(owner.getEmailVerified())) {
            throw new RuntimeException("Please verify your email before listing items");
        }

        Item.ListingType type = request.getListingType() != null ? request.getListingType() : Item.ListingType.RENT;
        BigDecimal dailyPrice = request.getDailyPrice() != null ? request.getDailyPrice() : BigDecimal.ZERO;
        if (type != Item.ListingType.BUY && dailyPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Daily price must be greater than 0 for rental items");
        }
        if (type != Item.ListingType.RENT && (request.getBuyPrice() == null || request.getBuyPrice().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new RuntimeException("Buy price must be greater than 0 for items for sale");
        }

        if (request.getMinRentalDays() != null && request.getMaxRentalDays() != null && request.getMinRentalDays() > request.getMaxRentalDays()) {
            throw new RuntimeException("Minimum rental days cannot exceed maximum rental days");
        }
        if (request.getAvailStartDate() != null && request.getAvailEndDate() != null && request.getAvailStartDate().isAfter(request.getAvailEndDate())) {
            throw new RuntimeException("Availability start date cannot be after end date");
        }

        Item item = Item.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .condition(request.getCondition() != null ? request.getCondition() : Item.ItemCondition.GOOD)
                .campusLocation(request.getCampusLocation())
                .pickupLocation(request.getPickupLocation())
                .availStartDate(request.getAvailStartDate())
                .availEndDate(request.getAvailEndDate())
                .minRentalDays(request.getMinRentalDays() != null ? request.getMinRentalDays() : 1)
                .maxRentalDays(request.getMaxRentalDays() != null ? request.getMaxRentalDays() : 30)
                .brand(request.getBrand())
                .model(request.getModel())
                .replacementValue(request.getReplacementValue())
                .dailyPrice(dailyPrice)
                .weeklyPrice(request.getWeeklyPrice())
                .buyPrice(request.getBuyPrice())
                .listingType(type)
                .depositAmount(request.getDepositAmount() != null ? request.getDepositAmount() : BigDecimal.ZERO)
                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new ArrayList<>())
                .availabilityStatus(request.getAvailabilityStatus() != null ? request.getAvailabilityStatus() : Item.AvailabilityStatus.AVAILABLE)
                .owner(owner)
                .flagged(false)
                .viewCount(0)
                .build();

        item = itemRepository.save(item);
        return ItemResponse.fromItem(item);
    }

    @Transactional
    public ItemResponse updateItem(Long itemId, ItemRequest request, Long userId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (!item.getOwner().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to modify this listing");
        }

        if (request.getListingType() != null) {
            item.setListingType(request.getListingType());
        }
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            item.setTitle(request.getTitle());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            item.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            item.setCategory(request.getCategory());
        }
        if (request.getCondition() != null) {
            item.setCondition(request.getCondition());
        }
        if (request.getCampusLocation() != null) {
            item.setCampusLocation(request.getCampusLocation());
        }
        if (request.getPickupLocation() != null) {
            item.setPickupLocation(request.getPickupLocation());
        }
        item.setAvailStartDate(request.getAvailStartDate());
        item.setAvailEndDate(request.getAvailEndDate());
        if (request.getMinRentalDays() != null) {
            item.setMinRentalDays(request.getMinRentalDays());
        }
        if (request.getMaxRentalDays() != null) {
            item.setMaxRentalDays(request.getMaxRentalDays());
        }
        if (request.getBrand() != null) {
            item.setBrand(request.getBrand());
        }
        if (request.getModel() != null) {
            item.setModel(request.getModel());
        }
        if (request.getReplacementValue() != null) {
            item.setReplacementValue(request.getReplacementValue());
        }
        if (request.getDailyPrice() != null) {
            item.setDailyPrice(request.getDailyPrice());
        }
        item.setWeeklyPrice(request.getWeeklyPrice());
        if (request.getBuyPrice() != null) {
            item.setBuyPrice(request.getBuyPrice());
        }
        if (request.getDepositAmount() != null) {
            item.setDepositAmount(request.getDepositAmount());
        }
        if (request.getImageUrls() != null) {
            item.setImageUrls(request.getImageUrls());
        }
        if (request.getAvailabilityStatus() != null) {
            item.setAvailabilityStatus(request.getAvailabilityStatus());
        }

        item = itemRepository.save(item);
        return ItemResponse.fromItem(item);
    }

    @Transactional
    public void deleteItem(Long itemId, Long userId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (!item.getOwner().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this listing");
        }

        boolean hasActiveRentals = rentalRepository.existsByItemIdAndStatusIn(
                itemId,
                List.of(RentalTransaction.TransactionStatus.PENDING, RentalTransaction.TransactionStatus.ACCEPTED, RentalTransaction.TransactionStatus.ACTIVE)
        );
        if (hasActiveRentals) {
            throw new RuntimeException("Cannot delete or deactivate an item with active or pending rental requests");
        }

        item.setAvailabilityStatus(Item.AvailabilityStatus.INACTIVE);
        itemRepository.save(item);
    }

    @Transactional
    public ItemResponse getItem(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (Boolean.TRUE.equals(item.getFlagged()) || item.getAvailabilityStatus() == Item.AvailabilityStatus.INACTIVE) {
            throw new RuntimeException("This listing is not currently available");
        }

        item.setViewCount((item.getViewCount() == null ? 0 : item.getViewCount()) + 1);
        itemRepository.save(item);

        return ItemResponse.fromItem(item);
    }

    @Transactional(readOnly = true)
    public Page<ItemResponse> searchItems(
            Item.Category category,
            Item.ItemCondition condition,
            Item.ListingType listingType,
            String location,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String searchTerm,
            Pageable pageable
    ) {
        return itemRepository.searchItems(category, condition, listingType, location, minPrice, maxPrice, searchTerm, pageable)
                .map(ItemResponse::fromItem);
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> getMyItems(Long userId) {
        return itemRepository.findByOwnerId(userId)
                .stream()
                .filter(item -> item.getAvailabilityStatus() != Item.AvailabilityStatus.INACTIVE)
                .map(ItemResponse::fromItem)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateAvailability(Long itemId, Item.AvailabilityStatus status, Long userId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (!item.getOwner().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own items");
        }

        if (status == Item.AvailabilityStatus.INACTIVE) {
            boolean hasActiveRentals = rentalRepository.existsByItemIdAndStatusIn(
                    itemId,
                    List.of(RentalTransaction.TransactionStatus.PENDING, RentalTransaction.TransactionStatus.ACCEPTED, RentalTransaction.TransactionStatus.ACTIVE)
            );
            if (hasActiveRentals) {
                throw new RuntimeException("Cannot deactivate an item with active or pending rental requests");
            }
        }

        item.setAvailabilityStatus(status);
        itemRepository.save(item);
    }

    @Transactional
    public ItemResponse boostItem(Long itemId, int days, String paymentMethod, Long userId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (!item.getOwner().getId().equals(userId)) {
            throw new RuntimeException("You can only boost your own listings");
        }

        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("FREE_PRO_BOOST".equalsIgnoreCase(paymentMethod)) {
            if (owner.getFreeBoostsAvailable() == null || owner.getFreeBoostsAvailable() <= 0) {
                throw new RuntimeException("No free Pro boosts available. Please select UPI or Card payment.");
            }
            owner.setFreeBoostsAvailable(owner.getFreeBoostsAvailable() - 1);
            userRepository.save(owner);
        }

        int boostDays = days > 0 ? days : 3;
        LocalDateTime newExpiry = (item.getFeaturedUntil() != null && item.getFeaturedUntil().isAfter(LocalDateTime.now()))
                ? item.getFeaturedUntil().plusDays(boostDays)
                : LocalDateTime.now().plusDays(boostDays);

        item.setIsFeatured(true);
        item.setFeaturedUntil(newExpiry);
        item.setBoostCount((item.getBoostCount() == null ? 0 : item.getBoostCount()) + 1);
        item = itemRepository.save(item);

        return ItemResponse.fromItem(item);
    }
}
