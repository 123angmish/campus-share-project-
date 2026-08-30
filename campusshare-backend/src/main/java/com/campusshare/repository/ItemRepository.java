package com.campusshare.repository;

import com.campusshare.model.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Item i where i.id = :id")
    Optional<Item> findByIdForUpdate(@Param("id") Long id);

    Page<Item> findByAvailabilityStatusAndFlagged(
            Item.AvailabilityStatus status,
            Boolean flagged,
            Pageable pageable
    );

    @Query("SELECT i FROM Item i WHERE " +
            "i.availabilityStatus = 'AVAILABLE' AND " +
            "i.flagged = false AND " +
            "(:category IS NULL OR i.category = :category) AND " +
            "(:condition IS NULL OR i.condition = :condition) AND " +
            "(:listingType IS NULL OR i.listingType = :listingType OR i.listingType = 'BOTH') AND " +
            "(:location IS NULL OR :location = '' OR LOWER(COALESCE(i.campusLocation, '')) LIKE LOWER(CONCAT('%', :location, '%')) OR LOWER(COALESCE(i.pickupLocation, '')) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:minPrice IS NULL OR " +
            "  (i.listingType = 'RENT' AND i.dailyPrice >= :minPrice) OR " +
            "  (i.listingType = 'BUY' AND i.buyPrice >= :minPrice) OR " +
            "  (i.listingType = 'BOTH' AND (i.dailyPrice >= :minPrice OR i.buyPrice >= :minPrice))) AND " +
            "(:maxPrice IS NULL OR " +
            "  (i.listingType = 'RENT' AND i.dailyPrice <= :maxPrice) OR " +
            "  (i.listingType = 'BUY' AND i.buyPrice <= :maxPrice) OR " +
            "  (i.listingType = 'BOTH' AND (i.dailyPrice <= :maxPrice OR i.buyPrice <= :maxPrice))) AND " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR " +
            "  LOWER(i.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "  LOWER(COALESCE(i.description, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "  LOWER(COALESCE(i.brand, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "  LOWER(COALESCE(i.model, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "  LOWER(CAST(i.category AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%')))" +
            " ORDER BY i.isFeatured DESC, i.createdAt DESC")
    Page<Item> searchItems(
            @Param("category") Item.Category category,
            @Param("condition") Item.ItemCondition condition,
            @Param("listingType") Item.ListingType listingType,
            @Param("location") String location,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("searchTerm") String searchTerm,
            Pageable pageable
    );

    List<Item> findByOwnerId(Long ownerId);

    long countByOwnerId(Long ownerId);

    @Query("SELECT i FROM Item i WHERE i.availabilityStatus = 'AVAILABLE' AND i.flagged = false " +
            "AND i.owner.id <> :userId ORDER BY i.createdAt DESC")
    List<Item> findRecommendationCandidates(@Param("userId") Long userId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.flagged = true ORDER BY i.updatedAt DESC")
    List<Item> findFlaggedItems();

    @Query("SELECT i FROM Item i WHERE i.owner.reputationScore >= :minRating AND " +
            "i.availabilityStatus = 'AVAILABLE' AND i.flagged = false")
    Page<Item> findByOwnerMinRating(Double minRating, Pageable pageable);
}
