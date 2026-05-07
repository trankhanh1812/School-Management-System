package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.system.SystemSettingResponse;
import com.school.school_management.dto.system.SystemSettingUpsertRequest;
import com.school.school_management.service.system.SystemSettingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system-settings")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    public SystemSettingController(SystemSettingService systemSettingService) {
        this.systemSettingService = systemSettingService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<SystemSettingResponse>> getSettings() {
        return ResponseEntity.ok(ApiResponse.of(systemSettingService.getSettings(), "System settings fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    public ResponseEntity<ApiResponse<SystemSettingResponse>> updateSettings(
            @Valid @RequestBody SystemSettingUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(systemSettingService.updateSettings(request), "System settings updated successfully", 200));
    }
}
