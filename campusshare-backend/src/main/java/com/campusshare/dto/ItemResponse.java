package com.campusshare.dto;

import com.campusshare.model.Item;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String condition;
    private String campusLocation;
    private String pickupLocation;
    private LocalDate availStartDate;
    private LocalDate availEndDate;
    private Integer minRentalDays;
    private Integer maxRentalDays;
    private String brand;
    private String model;
    private BigDecimal replacementValue;
    private BigDecimal dailyPrice;
    private BigDecimal weeklyPrice;
    private BigDecimal buyPrice;
    private String listingType;
    private BigDecimal depositAmount;
    private List<String> imageUrls;
    private String availabilityStatus;
    private PublicUserResponse owner;
    private Integer viewCount;
    private Boolean isFeatured;
    private LocalDateTime featuredUntil;
    private Integer boostCount;
    private Boolean flagged;
    private String flagReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ItemResponse fromItem(Item item) {
        boolean featuredActive = Boolean.TRUE.equals(item.getIsFeatured()) &&
                (item.getFeaturedUntil() == null || item.getFeaturedUntil().isAfter(LocalDateTime.now()));

        return ItemResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .category(item.getCategory() != null ? item.getCategory().name() : null)
                .condition(item.getCondition() != null ? item.getCondition().name() : Item.ItemCondition.GOOD.name())
                .campusLocation(item.getCampusLocation())
                .pickupLocation(item.getPickupLocation())
                .availStartDate(item.getAvailStartDate())
                .availEndDate(item.getAvailEndDate())
                .minRentalDays(item.getMinRentalDays() != null ? item.getMinRentalDays() : 1)
                .maxRentalDays(item.getMaxRentalDays() != null ? item.getMaxRentalDays() : 30)
                .brand(item.getBrand())
                .model(item.getModel())
                .replacementValue(item.getReplacementValue())
                .dailyPrice(item.getDailyPrice())
                .weeklyPrice(item.getWeeklyPrice())
                .buyPrice(item.getBuyPrice())
                .listingType(item.getListingType() != null ? item.getListingType().name() : Item.ListingType.RENT.name())
                .depositAmount(item.getDepositAmount())
                .imageUrls(item.getImageUrls())
                .availabilityStatus(item.getAvailabilityStatus() != null ? item.getAvailabilityStatus().name() : Item.AvailabilityStatus.AVAILABLE.name())
                .owner(item.getOwner() != null ? PublicUserResponse.fromUser(item.getOwner()) : null)
                .viewCount(item.getViewCount())
                .isFeatured(featuredActive)
                .featuredUntil(item.getFeaturedUntil())
                .boostCount(item.getBoostCount())
                .flagged(item.getFlagged())
                .flagReason(item.getFlagReason())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
