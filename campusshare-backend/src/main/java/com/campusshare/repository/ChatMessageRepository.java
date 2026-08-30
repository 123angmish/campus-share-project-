package com.campusshare.repository;

import com.campusshare.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByTransactionIdOrderByCreatedAtAsc(Long transactionId);

    long countByTransactionIdAndSenderIdNotAndIsReadFalse(Long transactionId, Long currentUserId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.transaction.id = :transactionId AND m.sender.id != :currentUserId AND m.isRead = false")
    void markMessagesAsRead(Long transactionId, Long currentUserId);
}
