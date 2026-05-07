package com.school.school_management.service.system;

import com.school.school_management.dto.system.SystemSettingResponse;
import com.school.school_management.dto.system.SystemSettingUpsertRequest;

public interface SystemSettingService {

    SystemSettingResponse getSettings();

    SystemSettingResponse updateSettings(SystemSettingUpsertRequest request);
}
