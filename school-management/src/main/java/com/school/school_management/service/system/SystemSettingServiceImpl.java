package com.school.school_management.service.system;

import com.school.school_management.dto.system.SystemSettingResponse;
import com.school.school_management.dto.system.SystemSettingUpsertRequest;
import com.school.school_management.entity.SystemSetting;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.SystemSettingRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SystemSettingServiceImpl implements SystemSettingService {

    // Cấu hình là singleton: đúng 1 dòng trong bảng, luôn id = 1.
    private static final Integer SETTINGS_ID = 1;

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingServiceImpl(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettingResponse getSettings() {
        return systemSettingRepository.findById(SETTINGS_ID)
            .map(this::toResponse)
            .orElseGet(this::defaultSettings);
    }

    @Override
    public SystemSettingResponse updateSettings(SystemSettingUpsertRequest request) {
        validateWeights(request);

        List<String> normalizedIps = normalizeIps(request.getAllowedSchoolIps());

        SystemSetting entity = SystemSetting.builder()
            .id(SETTINGS_ID)
            .allowedSchoolIps(String.join(",", normalizedIps))
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

        return toResponse(systemSettingRepository.save(entity));
    }

    private SystemSettingResponse toResponse(SystemSetting entity) {
        SystemSettingResponse response = SystemSettingResponse.builder()
            .allowedSchoolIps(splitIps(entity.getAllowedSchoolIps()))
            .oralWeight(entity.getOralWeight())
            .quiz15Weight(entity.getQuiz15Weight())
            .onePeriodWeight(entity.getOnePeriodWeight())
            .midtermWeight(entity.getMidtermWeight())
            .finalWeight(entity.getFinalWeight())
            .scoreEditWindowDays(entity.getScoreEditWindowDays())
            .requireAdminApproval(entity.isRequireAdminApproval())
            .passMark(entity.getPassMark())
            .failingSubjectMark(entity.getFailingSubjectMark())
            .maxFailedSubjectsToPromote(entity.getMaxFailedSubjectsToPromote())
            .graduationGradeLevel(entity.getGraduationGradeLevel())
            .build();
        return applyPromotionDefaults(response);
    }

    private List<String> splitIps(String joined) {
        if (joined == null || joined.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(joined.split(","))
            .map(String::trim)
            .filter(ip -> !ip.isEmpty())
            .distinct()
            .collect(Collectors.toCollection(ArrayList::new));
    }

    /**
     * Fills any missing promotion-policy field with its default. Uses nullable wrappers
     * so that an older settings row (saved before these fields existed) still gets sane
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
