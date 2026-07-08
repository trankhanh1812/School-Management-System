package com.school.school_management.dto.student;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentUpsertRequest {

    @NotBlank(message = "Student code is required")
    private String studentCode;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String dateOfBirth;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String academicYear;
    private String className;
    private String status;
    private String conduct;

    /** Ngày nhập học (YYYY-MM-DD). Nếu trống, mặc định là ngày tạo. */
    private String enrollmentDate;

    /**
     * Mã căn cước công dân / CMND.
     * Nếu có, sẽ được dùng làm username đăng nhập thay cho studentCode.
     */
    private String nationalId;

    /**
     * Danh sách phụ huynh cần upsert khi tạo/sửa học sinh qua UI.
     * Nếu null hoặc rỗng thì bỏ qua.
     */
    private List<ParentUpsertRequest> parents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParentUpsertRequest {
        private String fullName;
        /** Phone dùng làm username đăng nhập của phụ huynh */
        private String phone;
        private String email;
        /** father / mother / guardian */
        private String relation;
        private boolean isPrimaryContact;
    }
}
