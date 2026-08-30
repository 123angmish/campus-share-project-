package com.campusshare.dto;

import com.campusshare.model.ChatMessage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long transactionId;
    private Long senderId;
    private String senderName;
    private String content;
    private Boolean isRead;
    private Boolean isOwnMessage;
    private LocalDateTime createdAt;

    public static ChatMessageResponse from(ChatMessage msg, Long currentUserId) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .transactionId(msg.getTransaction().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getName())
                .content(msg.getContent())
                .isRead(msg.getIsRead())
                .isOwnMessage(msg.getSender().getId().equals(currentUserId))
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
