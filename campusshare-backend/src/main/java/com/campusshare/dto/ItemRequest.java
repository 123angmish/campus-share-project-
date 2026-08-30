package com.campusshare.dto;

import com.campusshare.model.Item;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ItemRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 120, message = "Title must be between 3 and 120 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private Item.Category category;

    private Item.ItemCondition condition;

    @Size(max = 150, message = "Campus area cannot exceed 150 characters")
    private String campusLocation;

    @Size(max = 200, message = "Pickup location cannot exceed 200 characters")
    private String pickupLocation;

    private LocalDate availStartDate;

    private LocalDate availEndDate;

    @Min(value = 1, message = "Minimum rental days must be at least 1")
    private Integer minRentalDays;

    @Min(value = 1, message = "Maximum rental days must be at least 1")
    @Max(value = 365, message = "Maximum rental days cannot exceed 365 days")
    private Integer maxRentalDays;

    @Size(max = 80, message = "Brand name cannot exceed 80 characters")
    private String brand;

    @Size(max = 100, message = "Model name cannot exceed 100 characters")
    private String model;

    @DecimalMin(value = "0.0", inclusive = true, message = "Replacement value cannot be negative")
    private BigDecimal replacementValue;

    @DecimalMin(value = "0.0", inclusive = true, message = "Daily price cannot be negative")
    private BigDecimal dailyPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Weekly price cannot be negative")
    private BigDecimal weeklyPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Buy price cannot be negative")
    private BigDecimal buyPrice;

    private Item.ListingType listingType;

    private Item.AvailabilityStatus availabilityStatus;

    @DecimalMin(value = "0.0", inclusive = true, message = "Deposit cannot be negative")
    private BigDecimal depositAmount;

    @Size(max = 6, message = "A listing can have at most 6 images")
    private List<String> imageUrls;
}
