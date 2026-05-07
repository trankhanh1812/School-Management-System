package com.school.school_management.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "teaching_assignment",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_teaching_assignment_teacher_class_subject_semester",
                    columnNames = {"teacher_id", "class_id", "subject_id", "semester_id"}
            )
        }
)
public class TeachingAssignment {

    @Id
    @GeneratedValue
    private UUID id;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(optional = false)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(optional = false)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @jakarta.persistence.Column(name = "is_homeroom")
    private Boolean isHomeroom;

    @JdbcTypeCode(SqlTypes.JSON)
    @jakarta.persistence.Column(name = "schedule_data", columnDefinition = "jsonb")
    private String scheduleData;

    @jakarta.persistence.Column(name = "note", length = 500)
    private String note;
}