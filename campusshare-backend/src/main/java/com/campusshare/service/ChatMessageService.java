package com.campusshare.service;

import com.campusshare.dto.ChatMessageRequest;
import com.campusshare.dto.ChatMessageResponse;
import com.campusshare.model.ChatMessage;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.User;
import com.campusshare.repository.ChatMessageRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatRepository;
    private final RentalTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ChatMessageResponse sendMessage(Long transactionId, Long senderId, ChatMessageRequest request) {
        RentalTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        boolean isBorrower = transaction.getBorrower().getId().equals(senderId);
        boolean isOwner = transaction.getOwner().getId().equals(senderId);

        if (!isBorrower && !isOwner) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to send messages in this transaction");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatMessage message = ChatMessage.builder()
                .transaction(transaction)
                .sender(sender)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        message = chatRepository.save(message);

        // Notify the recipient
        User recipient = isBorrower ? transaction.getOwner() : transaction.getBorrower();
        notificationService.createNotification(
                recipient,
                "New Message from " + sender.getName(),
                request.getContent().trim().length() > 60
                        ? request.getContent().trim().substring(0, 57) + "…"
                        : request.getContent().trim(),
                "CHAT_MESSAGE",
                "/history"
        );

        return ChatMessageResponse.from(message, senderId);
    }

    @Transactional
    public List<ChatMessageResponse> getMessages(Long transactionId, Long currentUserId) {
        RentalTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        boolean isBorrower = transaction.getBorrower().getId().equals(currentUserId);
        boolean isOwner = transaction.getOwner().getId().equals(currentUserId);

        if (!isBorrower && !isOwner) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to view messages in this transaction");
        }

        chatRepository.markMessagesAsRead(transactionId, currentUserId);

        return chatRepository.findByTransactionIdOrderByCreatedAtAsc(transactionId).stream()
                .map(msg -> ChatMessageResponse.from(msg, currentUserId))
                .toList();
    }
}
