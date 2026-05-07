package com.school.school_management.service.system;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.school_management.dto.system.SystemSettingResponse;
import com.school.school_management.dto.system.SystemSettingUpsertRequest;
import com.school.school_management.exception.CustomException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SystemSettingServiceImpl implements SystemSettingService {

    private static final Path SETTINGS_PATH = Paths.get("tmp", "system-settings.json");

    private final ObjectMapper objectMapper;

    public SystemSettingServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettingResponse getSettings() {
        if (!Files.exists(SETTINGS_PATH)) {
            return defaultSettings();
        }

        try {
            SystemSettingResponse response = objectMapper.readValue(
                SETTINGS_PATH.toFile(),
                SystemSettingResponse.class
            );
            if (response.getAllowedSchoolIps() == null) {
                response.setAllowedSchoolIps(new ArrayList<>());
            }
            return response;
        } catch (IOException exception) {
            throw new CustomException("Failed to read system settings", 500);
        }
    }

    @Override
    public SystemSettingResponse updateSettings(SystemSettingUpsertRequest request) {
        validateWeights(request);

        SystemSettingResponse response = SystemSettingResponse.builder()
            .allowedSchoolIps(normalizeIps(request.getAllowedSchoolIps()))
            .oralWeight(request.getOralWeight())
            .quiz15Weight(request.getQuiz15Weight())
            .onePeriodWeight(request.getOnePeriodWeight())
            .midtermWeight(request.getMidtermWeight())
            .finalWeight(request.getFinalWeight())
            .scoreEditWindowDays(request.getScoreEditWindowDays())
            .requireAdminApproval(request.isRequireAdminApproval())
            .build();

        try {
            Files.createDirectories(SETTINGS_PATH.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(SETTINGS_PATH.toFile(), response);
            return response;
        } catch (IOException exception) {
            throw new CustomException("Failed to save system settings", 500);
        }
    }

    private void validateWeights(SystemSettingUpsertRequest request) {
        double total = request.getOralWeight()
            + request.getQuiz15Weight()
            + request.getOnePeriodWeight()
            + request.getMidtermWeight()
            + request.getFinalWeight();

        if (total <= 0) {
            throw new CustomException("Total weighted assessment weights must be greater than 0", 400);
        }
    }

    private List<String> normalizeIps(List<String> rawIps) {
        if (rawIps == null) {
            return List.of();
        }

        return rawIps.stream()
            .filter(ip -> ip != null && !ip.trim().isEmpty())
            .map(String::trim)
            .distinct()
            .toList();
    }

    private SystemSettingResponse defaultSettings() {
        return SystemSettingResponse.builder()
            .allowedSchoolIps(List.of("192.168.1.0/24"))
            .oralWeight(1.0)
            .quiz15Weight(1.0)
            .onePeriodWeight(2.0)
            .midtermWeight(3.0)
            .finalWeight(3.0)
            .scoreEditWindowDays(3)
            .requireAdminApproval(true)
            .build();
    }
}
