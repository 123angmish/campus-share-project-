package com.campusshare.service;

import com.campusshare.dto.ReportRequest;
import com.campusshare.model.Item;
import com.campusshare.model.Report;
import com.campusshare.model.User;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.ReportRepository;
import com.campusshare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock ReportRepository reports;
    @Mock UserRepository users;
    @Mock ItemRepository items;

    ReportService service;
    User reporter;
    User owner;
    Item item;

    @BeforeEach
    void setUp() {
        service = new ReportService(reports, users, items);
        reporter = User.builder().id(1L).name("Reporter").email("r@college.edu").password("x")
                .department("ECE").year(4).contactNumber("9999999999").emailVerified(true).build();
        owner = User.builder().id(2L).name("Owner").email("o@college.edu").password("x")
                .department("CSE").year(4).contactNumber("8888888888").emailVerified(true).build();
        item = Item.builder().id(7L).title("Suspicious listing").description("Description")
                .category(Item.Category.ELECTRONICS).dailyPrice(new BigDecimal("50"))
                .owner(owner).availabilityStatus(Item.AvailabilityStatus.AVAILABLE).build();
    }

    @Test
    void thirdOpenItemReportAutoFlagsListingForAdminReview() {
        when(users.findById(1L)).thenReturn(Optional.of(reporter));
        when(items.findById(7L)).thenReturn(Optional.of(item));
        when(reports.existsByReporterIdAndReportedItemIdAndStatusIn(eq(1L), eq(7L), any())).thenReturn(false);
        when(reports.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(10L);
            r.setCreatedAt(java.time.LocalDateTime.now());
            return r;
        });
        when(reports.countByReportedItemIdAndStatusIn(eq(7L), any())).thenReturn(3L);
        when(items.save(any(Item.class))).thenAnswer(inv -> inv.getArgument(0));

        service.create(itemReport(), 1L);

        assertTrue(item.getFlagged());
        assertTrue(item.getFlagReason().contains("multiple community reports"));
        verify(items).save(item);
    }

    @Test
    void ownerCannotReportOwnListing() {
        when(users.findById(2L)).thenReturn(Optional.of(owner));
        when(items.findById(7L)).thenReturn(Optional.of(item));

        RuntimeException error = assertThrows(RuntimeException.class, () -> service.create(itemReport(), 2L));
        assertTrue(error.getMessage().contains("own listing"));
        verify(reports, never()).save(any());
    }

    private ReportRequest itemReport() {
        ReportRequest request = new ReportRequest();
        request.setReportType(Report.ReportType.ITEM);
        request.setTargetId(7L);
        request.setReason("This listing contains misleading information");
        return request;
    }
}
