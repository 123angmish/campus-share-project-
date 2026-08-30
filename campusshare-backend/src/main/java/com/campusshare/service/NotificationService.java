package com.campusshare.service;

import com.campusshare.model.Notification;
import com.campusshare.model.User;
import com.campusshare.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final com.campusshare.repository.UserRepository userRepository;

    @Transactional
    public void createNotification(User user, String title, String message, String type, String link) {
        if (user == null) return;
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public List<com.campusshare.dto.NotificationResponse> getUserNotifications(Long userId) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (list.isEmpty()) {
            userRepository.findById(userId).ifPresent(user -> {
                Notification welcome = Notification.builder()
                        .user(user)
                        .title("Welcome to CampusShare! 🎉")
                        .message("Your student account is active. Explore campus essentials to rent or buy, or list your own gear.")
                        .type("INFO")
                        .link("/")
                        .read(false)
                        .build();
                notificationRepository.save(welcome);
            });
            list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return list.stream()
                .map(com.campusshare.dto.NotificationResponse::fromNotification)
                .toList();
    }

    @Transactional
    public long getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndReadFalse(userId);
        if (count == 0 && notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty()) {
            getUserNotifications(userId);
            return 1;
        }
        return count;
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                n.setReadAt(LocalDateTime.now());
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }
}
