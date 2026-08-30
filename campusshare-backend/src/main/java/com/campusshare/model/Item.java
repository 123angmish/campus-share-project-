package com.campusshare.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "items", indexes = {
        @Index(name = "idx_item_category", columnList = "category"),
        @Index(name = "idx_item_avail_status", columnList = "availabilityStatus"),
        @Index(name = "idx_item_listing_type", columnList = "listingType"),
        @Index(name = "idx_item_condition", columnList = "item_condition"),
        @Index(name = "idx_item_daily_price", columnList = "dailyPrice"),
        @Index(name = "idx_item_buy_price", columnList = "buyPrice"),
        @Index(name = "idx_item_created_at", columnList = "createdAt"),
        @Index(name = "idx_item_owner", columnList = "owner_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 120, message = "Title must be between 3 and 120 characters")
    @Column(length = 120, nullable = false)
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    @Column(length = 2000, nullable = false)
    private String description;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_condition", nullable = false)
    @Builder.Default
    private ItemCondition condition = ItemCondition.GOOD;

    @Size(max = 150, message = "Campus area cannot exceed 150 characters")
    @Column(name = "campus_location", length = 150)
    private String campusLocation;

    @Size(max = 200, message = "Pickup location cannot exceed 200 characters")
    @Column(name = "pickup_location", length = 200)
    private String pickupLocation;

    @Column(name = "avail_start_date")
    private LocalDate availStartDate;

    @Column(name = "avail_end_date")
    private LocalDate availEndDate;

    @Min(value = 1, message = "Minimum rental duration must be at least 1 day")
    @Column(name = "min_rental_days")
    @Builder.Default
    private Integer minRentalDays = 1;

    @Max(value = 365, message = "Maximum rental duration cannot exceed 365 days")
    @Column(name = "max_rental_days")
    @Builder.Default
    private Integer maxRentalDays = 30;

    @Size(max = 80, message = "Brand name cannot exceed 80 characters")
    @Column(length = 80)
    private String brand;

    @Size(max = 100, message = "Model name cannot exceed 100 characters")
    @Column(length = 100)
    private String model;

    @PositiveOrZero(message = "Replacement value must be zero or positive")
    @Column(name = "replacement_value", precision = 10, scale = 2)
    private BigDecimal replacementValue;

    @PositiveOrZero(message = "Daily price must be zero or positive")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal dailyPrice = BigDecimal.ZERO;

    @PositiveOrZero(message = "Weekly price must be zero or positive")
    @Column(precision = 10, scale = 2)
    private BigDecimal weeklyPrice;

    @PositiveOrZero(message = "Buy price must be zero or positive")
    @Column(precision = 10, scale = 2)
    private BigDecimal buyPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ListingType listingType = ListingType.RENT;

    @PositiveOrZero(message = "Security deposit must be zero or positive")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Size(max = 6, message = "A listing can have at most 6 photos")
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "item_images", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    @NotNull(message = "Availability status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<RentalTransaction> transactions = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean flagged = false;

    @Column(length = 500)
    private String flagReason;

    @Column(nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "featured_until")
    private LocalDateTime featuredUntil;

    @Column(name = "boost_count")
    @Builder.Default
    private Integer boostCount = 0;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum ItemCondition {
        NEW,
        LIKE_NEW,
        GOOD,
        FAIR
    }

    public enum ListingType {
        RENT,
        BUY,
        BOTH
    }

    public enum Category {
        ELECTRONICS,
        CALCULATOR,
        BOOKS,
        LAB_EQUIPMENT,
        SPORTS,
        CAMERA,
        LAPTOP_ACCESSORIES,
        CYCLE,
        PROJECT_COMPONENTS,
        MUSICAL_INSTRUMENTS,
        HOSTEL_ESSENTIALS,
        STATIONERY,
        CLOTHING,
        FURNITURE,
        OTHER
    }

    public enum AvailabilityStatus {
        AVAILABLE,
        RENTED,
        SOLD,
        INACTIVE
    }
}
