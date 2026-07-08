package com.school.school_management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cấu hình hệ thống — bảng singleton (đúng 1 dòng, luôn id = 1).
 * Thay cho lối lưu file tạm trước đây (không bền trên container như Render).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "system_setting")
public class SystemSetting {

    @Id
    private Integer id;

    // Danh sách IP/CIDR cho phép điểm danh QR, lưu dạng chuỗi ngăn cách bởi dấu phẩy.
    @Column(name = "allowed_school_ips", columnDefinition = "text")
    private String allowedSchoolIps;

    private double oralWeight;
    private double quiz15Weight;
    private double onePeriodWeight;
    private double midtermWeight;
    private double finalWeight;

    private int scoreEditWindowDays;
    private boolean requireAdminApproval;

    private Double passMark;
    private Double failingSubjectMark;
    private Integer maxFailedSubjectsToPromote;
    private Integer graduationGradeLevel;
}
