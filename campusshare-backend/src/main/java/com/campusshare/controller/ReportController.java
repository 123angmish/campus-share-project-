package com.campusshare.controller;

import com.campusshare.dto.ReportRequest;
import com.campusshare.dto.ReportResponse;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> create(@Valid @RequestBody ReportRequest request,
                                                  @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reportService.create(request, currentUser.getId()));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ReportResponse>> mine(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reportService.mine(currentUser.getId()));
    }
}
