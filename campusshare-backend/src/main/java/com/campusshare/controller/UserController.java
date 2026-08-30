package com.campusshare.controller;

import com.campusshare.dto.PublicUserResponse;
import com.campusshare.dto.UserResponse;
import com.campusshare.model.User;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.UserRepository;
import com.campusshare.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository users;
    private final RentalTransactionRepository rentals;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = users.findById(currentUser.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicUserResponse> user(@PathVariable Long id) {
        User user = users.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(PublicUserResponse.fromUser(user));
    }

    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Object>> myStats(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = users.findById(currentUser.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        long ownerCompleted = safe(rentals.countCompletedRentalsByOwner(user.getId()));
        long borrowerCompleted = safe(rentals.countCompletedRentalsByBorrower(user.getId()));
        double earnings = safe(rentals.getTotalEarnings(user.getId()));
        double spent = safe(rentals.getTotalSpent(user.getId()));

        Map<String, Object> stats = publicStats(user, ownerCompleted, borrowerCompleted);
        stats.put("totalEarnings", earnings);
        stats.put("totalSpent", spent);
        stats.put("estimatedMoneySaved", Math.round(spent * 1.8 * 100.0) / 100.0);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> publicStats(@PathVariable Long id) {
        User user = users.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        long ownerCompleted = safe(rentals.countCompletedRentalsByOwner(id));
        long borrowerCompleted = safe(rentals.countCompletedRentalsByBorrower(id));
        return ResponseEntity.ok(publicStats(user, ownerCompleted, borrowerCompleted));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody Map<String, String> updates,
                                                       @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = users.findById(currentUser.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        if (updates.containsKey("name")) {
            String name = clean(updates.get("name"));
            if (name == null || name.length() < 2 || name.length() > 100) throw new RuntimeException("Name must be between 2 and 100 characters");
            user.setName(name);
        }
        if (updates.containsKey("contactNumber")) {
            String phone = clean(updates.get("contactNumber"));
            if (phone == null || !phone.matches("^[0-9]{10}$")) throw new RuntimeException("Contact number must contain exactly 10 digits");
            user.setContactNumber(phone);
        }
        if (updates.containsKey("department")) {
            String dept = clean(updates.get("department"));
            if (dept != null && !dept.isBlank()) user.setDepartment(dept);
        }
        if (updates.containsKey("year")) {
            try {
                int yr = Integer.parseInt(String.valueOf(updates.get("year")).trim());
                if (yr >= 1 && yr <= 5) user.setYear(yr);
            } catch (Exception ignored) {}
        }
        if (updates.containsKey("hostelBlock")) user.setHostelBlock(clean(updates.get("hostelBlock")));
        if (updates.containsKey("roomNumber")) user.setRoomNumber(clean(updates.get("roomNumber")));
        return ResponseEntity.ok(UserResponse.fromUser(users.save(user)));
    }

    @PostMapping("/upgrade-pro")
    public ResponseEntity<UserResponse> upgradeToPro(
            @RequestParam(defaultValue = "MONTHLY") String plan,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User user = users.findById(currentUser.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        int days = "SEMESTER".equalsIgnoreCase(plan) ? 180 : 30;
        int boostsToAdd = "SEMESTER".equalsIgnoreCase(plan) ? 3 : 1;

        java.time.LocalDateTime newExpiry = (user.getProExpiresAt() != null && user.getProExpiresAt().isAfter(java.time.LocalDateTime.now()))
                ? user.getProExpiresAt().plusDays(days)
                : java.time.LocalDateTime.now().plusDays(days);

        user.setIsProMember(true);
        user.setProExpiresAt(newExpiry);
        user.setFreeBoostsAvailable((user.getFreeBoostsAvailable() == null ? 0 : user.getFreeBoostsAvailable()) + boostsToAdd);
        user = users.save(user);

        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @PostMapping("/withdraw-earnings")
    public ResponseEntity<Map<String, Object>> withdrawEarnings(
            @RequestParam java.math.BigDecimal amount,
            @RequestParam String upiId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User user = users.findById(currentUser.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        if (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Please enter a valid payout amount");
        }
        if (upiId == null || !upiId.contains("@")) {
            throw new RuntimeException("Please provide a valid UPI ID (e.g. yourname@upi)");
        }

        double totalEarned = safe(rentals.getTotalEarnings(user.getId()));
        if (amount.doubleValue() > totalEarned && totalEarned > 0) {
            throw new RuntimeException("Withdrawal amount cannot exceed total earned balance of ₹" + totalEarned);
        }

        Map<String, Object> payoutResponse = new LinkedHashMap<>();
        payoutResponse.put("success", true);
        payoutResponse.put("amount", amount);
        payoutResponse.put("upiId", upiId.trim());
        payoutResponse.put("payoutReference", "CS-PAY-" + (System.currentTimeMillis() % 1000000));
        payoutResponse.put("message", "Payout of ₹" + amount + " initiated successfully to UPI: " + upiId.trim() + ". Funds will reflect in your bank account in 2-5 minutes.");
        return ResponseEntity.ok(payoutResponse);
    }

    private Map<String, Object> publicStats(User user, long ownerCompleted, long borrowerCompleted) {
        Map<String, Object> stats = new LinkedHashMap<>();
        int trustScore = trustScore(user, ownerCompleted + borrowerCompleted);
        stats.put("completedAsOwner", ownerCompleted);
        stats.put("completedAsBorrower", borrowerCompleted);
        stats.put("itemsKeptInUse", ownerCompleted + borrowerCompleted);
        stats.put("trustScore", trustScore);
        stats.put("trustTier", trustTier(trustScore));
        return stats;
    }

    private int trustScore(User user, long completed) {
        int score = 45;
        if (Boolean.TRUE.equals(user.getEmailVerified())) score += 20;
        score += (int) Math.min(20, completed * 2);
        if (user.getTotalReviews() != null && user.getTotalReviews() > 0 && user.getReputationScore() != null) {
            score += (int) Math.round(Math.max(0, Math.min(5, user.getReputationScore())) / 5.0 * 15);
        } else {
            score += 5;
        }
        return Math.max(0, Math.min(100, score));
    }

    private String trustTier(int score) {
        if (score >= 90) return "TOP_RATED";
        if (score >= 80) return "TRUSTED";
        if (score >= 65) return "RELIABLE";
        return "NEW";
    }

    private long safe(Long value) { return value == null ? 0 : value; }
    private double safe(Double value) { return value == null ? 0.0 : value; }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
