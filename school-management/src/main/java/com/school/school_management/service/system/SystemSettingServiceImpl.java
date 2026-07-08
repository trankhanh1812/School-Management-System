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
            return applyPromotionDefaults(response);
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
                .passMark(request.getPassMark())
                .failingSubjectMark(request.getFailingSubjectMark())
                .maxFailedSubjectsToPromote(request.getMaxFailedSubjectsToPromote())
                .graduationGradeLevel(request.getGraduationGradeLevel())
                .build();
        applyPromotionDefaults(response);

        try {
            Files.createDirectories(SETTINGS_PATH.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(SETTINGS_PATH.toFile(), response);
            return response;
        } catch (IOException exception) {
            throw new CustomException("Failed to save system settings", 500);
        }
    }

    /**
     * Fills any missing promotion-policy field with its default. Uses nullable wrappers
     * so that an older settings file (saved before these fields existed) still gets sane
     * defaults instead of 0, which would break promotion logic.
     */
    private SystemSettingResponse applyPromotionDefaults(SystemSettingResponse response) {
        if (response.getPassMark() == null) {
            response.setPassMark(5.0);
        }
        if (response.getFailingSubjectMark() == null) {
            response.setFailingSubjectMark(5.0);
        }
        if (response.getMaxFailedSubjectsToPromote() == null) {
            response.setMaxFailedSubjectsToPromote(2);
        }
        if (response.getGraduationGradeLevel() == null) {
            response.setGraduationGradeLevel(12);
        }
        return response;
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
                .peek(this::validateCidr)
                .toList();
    }

    /**
     * Validates an entry as either a plain IPv4 address ("192.168.1.5") or an IPv4
     * CIDR block ("192.168.1.0/24"). Rejects malformed values so they can't silently
     * disable QR attendance at scan time (spec: backend must validate CIDR format).
     */
    private void validateCidr(String entry) {
        String value = entry.trim();
        String ipPart = value;
        int slash = value.indexOf('/');
        if (slash >= 0) {
            String prefixPart = value.substring(slash + 1);
            ipPart = value.substring(0, slash);
            int prefix;
            try {
                prefix = Integer.parseInt(prefixPart);
            } catch (NumberFormatException ex) {
                throw new CustomException("Invalid IP/CIDR entry: " + entry, 400);
            }
            if (prefix < 0 || prefix > 32) {
                throw new CustomException("Invalid CIDR prefix (0-32): " + entry, 400);
            }
        }
        String[] octets = ipPart.split("\\.", -1);
        if (octets.length != 4) {
            throw new CustomException("Invalid IPv4 address: " + entry, 400);
        }
        for (String octet : octets) {
            int number;
            try {
                number = Integer.parseInt(octet);
            } catch (NumberFormatException ex) {
                throw new CustomException("Invalid IPv4 address: " + entry, 400);
            }
            if (number < 0 || number > 255) {
                throw new CustomException("Invalid IPv4 address: " + entry, 400);
            }
        }
    }

    private SystemSettingResponse defaultSettings() {
        return SystemSettingResponse.builder()
                // Empty by default = allow QR attendance from any IP. Admin can add
                // CIDR ranges in System Settings to restrict to the school network.
                .allowedSchoolIps(new ArrayList<>())
                .oralWeight(1.0)
                .quiz15Weight(1.0)
                .onePeriodWeight(2.0)
                .midtermWeight(3.0)
                .finalWeight(3.0)
                .scoreEditWindowDays(3)
                .requireAdminApproval(true)
                .passMark(5.0)
                .failingSubjectMark(5.0)
                .maxFailedSubjectsToPromote(2)
                .graduationGradeLevel(12)
                .build();
    }
}
