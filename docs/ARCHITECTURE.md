# CampusShare — System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Frontend["Frontend (React 18 + Vite)"]
        UI_Home[Marketplace & Discovery]
        UI_Dash[Dashboard & 8 Metric Cards]
        UI_Act[My Activity & 6 Dedicated Tabs]
        UI_Notif[Notification Center Bell]
        UI_List[Item Listing & Editing]
    end

    subgraph Backend["Backend (Spring Boot 3 + Java 21)"]
        Ctrl_Auth[AuthController]
        Ctrl_Item[ItemController]
        Ctrl_Rental[RentalController]
        Ctrl_Pay[PaymentController]
        Ctrl_Dash[DashboardController]
        Ctrl_Notif[NotificationController]

        Svc_Auth[AuthService]
        Svc_Item[ItemService]
        Svc_Rental[RentalService]
        Svc_Pay[PaymentService]
        Svc_Dash[DashboardService]
        Svc_Notif[NotificationService]
    end

    subgraph Database["Database (PostgreSQL / H2)"]
        DB_Users[(users)]
        DB_Items[(items)]
        DB_Rentals[(rental_transactions)]
        DB_History[(rental_status_history)]
        DB_Notifs[(notifications)]
        DB_Reviews[(reviews)]
        DB_Payments[(payment_attempts)]
        DB_Inbox[(payment_webhook_inbox)]
    end

    subgraph External["External Integrations"]
        Ext_Razorpay[Razorpay Payment Gateway]
        Ext_Email[SMTP Email Service]
    end

    UI_Home --> Ctrl_Item
    UI_Dash --> Ctrl_Dash
    UI_Act --> Ctrl_Rental
    UI_Notif --> Ctrl_Notif
    UI_List --> Ctrl_Item

    Ctrl_Dash --> Svc_Dash
    Ctrl_Rental --> Svc_Rental
    Ctrl_Pay --> Svc_Pay
    Ctrl_Notif --> Svc_Notif
    Ctrl_Item --> Svc_Item
    Ctrl_Auth --> Svc_Auth

    Svc_Rental --> DB_Rentals
    Svc_Rental --> DB_History
    Svc_Rental --> Svc_Notif
    Svc_Notif --> DB_Notifs
    Svc_Pay --> Ext_Razorpay
    Svc_Auth --> Ext_Email
```

---

## 🏛️ Key Entities & Relationships

| Entity | Description | Key Relationships |
| :--- | :--- | :--- |
| `User` | Campus student or admin member | Owns multiple `Item`s, acts as borrower or owner on `RentalTransaction`s |
| `Item` | Rented or sold campus item | Belong to `owner` (`User`), has condition, location, prices, date limits |
| `RentalTransaction` | P2P rental or direct purchase record | Links `borrower`, `owner`, and `item`. Tracks status, payment, handover PIN, and deposit refund |
| `RentalStatusHistory` | Immutable audit log of status transitions | Links to `RentalTransaction`, records `fromStatus`, `toStatus`, `changedBy`, and `note` |
| `Notification` | In-app notification for users | Linked to target `User`, has type, title, message, link, and read flag |
| `Review` | Two-way peer trust review | Linked to `RentalTransaction`, `reviewer`, `reviewee`, rating (1-5), comment |
| `PaymentAttempt` | Razorpay order & capture tracking | Linked to `RentalTransaction`, order ID, payment ID, amount in paise, status |
