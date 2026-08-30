package com.campusshare.controller;

import com.campusshare.dto.ItemRequest;
import com.campusshare.dto.ItemResponse;
import com.campusshare.dto.RecommendationResponse;
import com.campusshare.model.Item;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.ItemService;
import com.campusshare.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final RecommendationService recommendationService;

    @PostMapping
    public ResponseEntity<ItemResponse> createItem(
            @Valid @RequestBody ItemRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(itemService.createItem(request, currentUser.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemResponse> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(itemService.updateItem(id, request, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        itemService.deleteItem(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getItem(id));
    }

    @GetMapping({"", "/search"})
    public ResponseEntity<Page<ItemResponse>> searchItems(
            @RequestParam(required = false) Item.Category category,
            @RequestParam(required = false) Item.ItemCondition condition,
            @RequestParam(required = false) Item.ListingType listingType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Minimum price cannot be negative");
        }
        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Maximum price cannot be negative");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new RuntimeException("Minimum price cannot be greater than maximum price");
        }

        String safeSearch = (searchTerm != null && !searchTerm.trim().isEmpty()) ? searchTerm.trim() : null;
        String safeLocation = (location != null && !location.trim().isEmpty()) ? location.trim() : null;

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        String safeSortBy = switch (sortBy) {
            case "dailyPrice", "buyPrice", "title", "viewCount" -> sortBy;
            default -> "createdAt";
        };
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(safeSortBy).ascending() : Sort.by(safeSortBy).descending();
        Pageable pageable = PageRequest.of(safePage, safeSize, sort);
        return ResponseEntity.ok(itemService.searchItems(category, condition, listingType, safeLocation, minPrice, maxPrice, safeSearch, pageable));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<RecommendationResponse>> recommendations(
            @RequestParam(defaultValue = "6") int limit,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(recommendationService.recommend(currentUser.getId(), limit));
    }

    @GetMapping("/my-items")
    public ResponseEntity<List<ItemResponse>> getMyItems(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(itemService.getMyItems(currentUser.getId()));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<Void> updateAvailability(
            @PathVariable Long id,
            @RequestParam Item.AvailabilityStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        itemService.updateAvailability(id, status, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/boost")
    public ResponseEntity<ItemResponse> boostItem(
            @PathVariable Long id,
            @RequestParam(defaultValue = "3") int days,
            @RequestParam(defaultValue = "UPI") String paymentMethod,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(itemService.boostItem(id, days, paymentMethod, currentUser.getId()));
    }

    @PostMapping("/clean-dummy-data")
    public ResponseEntity<Map<String, String>> cleanDummyData() {
        itemService.cleanAllDummyData();
        return ResponseEntity.ok(Map.of("message", "All dummy items, test transactions, and test data removed successfully."));
    }
}
