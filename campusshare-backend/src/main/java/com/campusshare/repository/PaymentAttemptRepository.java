package com.campusshare.repository;

import com.campusshare.model.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    Optional<PaymentAttempt> findByProviderOrderId(String providerOrderId);
    Optional<PaymentAttempt> findByProviderPaymentId(String providerPaymentId);

    Optional<PaymentAttempt> findFirstByRental_IdAndStatusInOrderByCreatedAtDesc(
            Long rentalId,
            Collection<PaymentAttempt.Status> statuses
    );
}
