package com.campusshare.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank(message = "Name is required") @Size(min = 2, max = 70, message = "Name must be between 2 and 70 characters") private String name;
    @NotBlank(message = "Email is required") @Email(message = "Please provide a valid email address") @Column(unique = true, nullable = false) private String email;
    @NotBlank @JsonIgnore private String password;
    @NotBlank(message = "Department is required") @Size(max = 100) private String department;
    @NotNull(message = "Academic year is required") @Min(value = 1, message = "Year must be between 1 and 5") @Max(value = 5, message = "Year must be between 1 and 5") @Column(name = "study_year") private Integer year;
    @NotBlank(message = "Contact phone is required") @Pattern(regexp = "^[0-9]{10}$", message = "Contact number must be exactly 10 digits") private String contactNumber;
    @Column(nullable = false) @Builder.Default private Boolean emailVerified = false;
    @JsonIgnore private String verificationToken;
    @JsonIgnore private LocalDateTime verificationTokenExpiry;
    @JsonIgnore private String refreshTokenHash;
    @JsonIgnore private LocalDateTime refreshTokenExpiry;
    @JsonIgnore private String passwordResetTokenHash;
    @JsonIgnore private LocalDateTime passwordResetTokenExpiry;
    @DecimalMin(value = "0.0", message = "Trust score cannot be below 0.0") @DecimalMax(value = "5.0", message = "Trust score cannot exceed 5.0") @Column(nullable = false) @Builder.Default private Double reputationScore = 5.0;
    @Column(nullable = false) @Builder.Default private Integer totalReviews = 0;
    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default private Role role = Role.USER;
    @Column(nullable = false) @Builder.Default private Boolean active = true;
    @Column(nullable = false) @Builder.Default private Integer reportCount = 0;
    @Column(name = "is_pro_member") @Builder.Default private Boolean isProMember = false;
    private LocalDateTime proExpiresAt;
    @Column(name = "free_boosts_available") @Builder.Default private Integer freeBoostsAvailable=0;
    private String hostelBlock;
    private String roomNumber;
    @OneToMany(mappedBy="owner",cascade=CascadeType.ALL,orphanRemoval=true) @JsonIgnore @Builder.Default private List<Item> items=new ArrayList<>();
    @OneToMany(mappedBy="borrower",cascade=CascadeType.ALL) @JsonIgnore @Builder.Default private List<RentalTransaction> rentalsAsBorrower=new ArrayList<>();
    @OneToMany(mappedBy="owner",cascade=CascadeType.ALL) @JsonIgnore @Builder.Default private List<RentalTransaction> rentalsAsOwner=new ArrayList<>();
    @OneToMany(mappedBy="reviewer",cascade=CascadeType.ALL) @JsonIgnore @Builder.Default private List<Review> givenReviews=new ArrayList<>();
    @OneToMany(mappedBy="reviewee",cascade=CascadeType.ALL) @JsonIgnore @Builder.Default private List<Review> receivedReviews=new ArrayList<>();
    @CreatedDate @Column(nullable=false,updatable=false) private LocalDateTime createdAt;
    @LastModifiedDate private LocalDateTime updatedAt;
    public enum Role { USER, ADMIN }
}
