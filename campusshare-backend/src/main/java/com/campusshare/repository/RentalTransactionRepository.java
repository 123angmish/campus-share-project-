package com.campusshare.repository;

import com.campusshare.model.RentalTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RentalTransactionRepository extends JpaRepository<RentalTransaction, Long> {
    Optional<RentalTransaction> findByRazorpayOrderId(String razorpayOrderId);
    Optional<RentalTransaction> findByRazorpayPaymentId(String razorpayPaymentId);
    Optional<RentalTransaction> findByRazorpayRefundId(String razorpayRefundId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from RentalTransaction t where t.id = :id")
    Optional<RentalTransaction> findByIdForUpdate(@Param("id") Long id);

    List<RentalTransaction> findByBorrowerIdOrderByCreatedAtDesc(Long borrowerId);
    List<RentalTransaction> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<RentalTransaction> findByItemId(Long itemId);

    @Query("SELECT t FROM RentalTransaction t WHERE t.borrower.id = :userId OR t.owner.id = :userId ORDER BY t.createdAt DESC")
    List<RentalTransaction> findByBorrowerIdOrOwnerId(@Param("userId") Long userId);

    @Query("SELECT t FROM RentalTransaction t WHERE (t.borrower.id = :userId OR t.owner.id = :userId) AND t.status = 'COMPLETED'")
    List<RentalTransaction> findCompletedTransactionsByUser(Long userId);

    @Query("SELECT t FROM RentalTransaction t WHERE t.owner.id = :ownerId AND t.status = 'PENDING' ORDER BY t.createdAt DESC")
    List<RentalTransaction> findPendingRequestsForOwner(Long ownerId);

    @Query("SELECT COUNT(t) > 0 FROM RentalTransaction t WHERE t.item.id = :itemId " +
            "AND t.status IN ('ACCEPTED', 'ACTIVE') " +
            "AND t.startDate < :endDate AND t.endDate > :startDate")
    boolean existsConflictingBooking(Long itemId, LocalDate startDate, LocalDate endDate);

    boolean existsByItemIdAndStatusIn(Long itemId, Collection<RentalTransaction.TransactionStatus> statuses);

    long countByStatus(RentalTransaction.TransactionStatus status);
    long countByPaymentStatus(RentalTransaction.PaymentStatus status);

    @Query("SELECT SUM(t.totalAmount) FROM RentalTransaction t WHERE t.paymentStatus = 'PAID'")
    Double getCapturedRentalGmv();

    @Query("SELECT COUNT(t) FROM RentalTransaction t WHERE t.borrower.id = :userId AND t.status = 'COMPLETED'")
    Long countCompletedRentalsByBorrower(Long userId);

    @Query("SELECT COUNT(t) FROM RentalTransaction t WHERE t.owner.id = :userId AND t.status = 'COMPLETED'")
    Long countCompletedRentalsByOwner(Long userId);

    @Query("SELECT COUNT(t) FROM RentalTransaction t WHERE t.borrower.id = :userId AND t.status = 'ACTIVE'")
    Long countActiveRentalsByBorrower(Long userId);

    @Query("SELECT COUNT(t) FROM RentalTransaction t WHERE t.owner.id = :userId AND t.status = 'ACTIVE'")
    Long countActiveRentalsByOwner(Long userId);

    @Query("SELECT COUNT(t) FROM RentalTransaction t WHERE t.owner.id = :ownerId AND t.status = 'PENDING'")
    Long countPendingRequestsByOwner(Long ownerId);

    @Query("SELECT SUM(t.totalAmount) FROM RentalTransaction t WHERE t.owner.id = :ownerId AND t.status = 'COMPLETED' AND t.paymentStatus = 'PAID'")
    Double getTotalEarnings(Long ownerId);

    @Query("SELECT SUM(t.totalAmount) FROM RentalTransaction t WHERE t.borrower.id = :userId AND t.status = 'COMPLETED' AND t.paymentStatus = 'PAID'")
    Double getTotalSpent(Long userId);
}
