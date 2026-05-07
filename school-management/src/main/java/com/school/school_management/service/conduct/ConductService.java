package com.school.school_management.service.conduct;

import com.school.school_management.dto.conduct.ConductResponse;
import com.school.school_management.dto.conduct.ConductUpsertRequest;
import java.util.List;

public interface ConductService {

    List<ConductResponse> getConducts();

    ConductResponse getConduct(String id);

    ConductResponse createConduct(ConductUpsertRequest request);

    ConductResponse updateConduct(String id, ConductUpsertRequest request);

    void deleteConduct(String id);
}
