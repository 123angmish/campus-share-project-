package com.campusshare.controller;

import com.campusshare.dto.ChatMessageRequest;
import com.campusshare.dto.ChatMessageResponse;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.ChatMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageService chatService;

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(chatService.getMessages(transactionId, user.getId()));
    }

    @PostMapping("/transaction/{transactionId}")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable Long transactionId,
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(chatService.sendMessage(transactionId, user.getId(), request));
    }
}
