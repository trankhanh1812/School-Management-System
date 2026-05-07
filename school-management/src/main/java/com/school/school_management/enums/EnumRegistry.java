package com.school.school_management.enums;

/**
 * EnumRegistry - Quick reference guide for all enums in the system.
 * 
 * This document provides a quick overview of all standardized enums.
 * All enums follow consistent patterns and support Vietnamese localization.
 */
public class EnumRegistry {

    /**
     * ========== USER & ROLE MANAGEMENT ==========
     */

    /**
     * UserRole - Roles of users in the system
     * Values: ADMIN, TEACHER, STUDENT, PARENT, STAFF
     * Features: priority comparison, role checks (isAdmin, isTeacher, etc.)
     * Usage: user.getRole().isAdmin()
     */
    public static final Class<?> USER_ROLE = UserRole.class;

    /**
     * ========== STUDENT MANAGEMENT ==========
     */

    /**
     * StudentStatus - Status of student in the system
     * Values: ACTIVE, INACTIVE, SUSPENDED, GRADUATED, DROPPED, TRANSFERRED
     * Features: isActive(), isTerminated()
     * Usage: student.getStatus().isActive()
     */
    public static final Class<?> STUDENT_STATUS = StudentStatus.class;

    /**
     * Gender - Gender/sex of person
     * Values: MALE, FEMALE, OTHER
     * Features: getShortCode(), fromShortCode()
     * Usage: Gender.fromString("MALE")
     */
    public static final Class<?> GENDER = Gender.class;

    /**
     * ========== ACADEMIC STRUCTURE ==========
     */

    /**
     * GradeLevel - Grade/class level
     * Values: GRADE_1 to GRADE_12
     * Features: isElementary(), isMiddleSchool(), isHighSchool(), getNextGrade()
     * Usage: GradeLevel.fromNumber(10)
     */
    public static final Class<?> GRADE_LEVEL = GradeLevel.class;

    /**
     * Semester - Semester/academic period
     * Values: SEMESTER_1, SEMESTER_2
     * Features: getCurrentSemester(month), containsMonth(), getNextSemester()
     * Usage: Semester.fromSemesterNumber(1)
     */
    public static final Class<?> SEMESTER = Semester.class;

    /**
     * ========== ASSESSMENT & GRADING ==========
     */

    /**
     * ExamType - Type of exam/assessment
     * Values: QUIZ, MIDTERM, FINAL, PRACTICE, DIAGNOSTIC
     * Features: getDurationMinutes(), getWeight(), isHighStakes(), isGraded()
     * Usage: exam.getType().getWeight()
     */
    public static final Class<?> EXAM_TYPE = ExamType.class;

    /**
     * ScoreStatus - Status of score/grade
     * Values: PENDING, APPROVED, REJECTED, SUBMITTED, ABSENT
     * Features: needsGrading(), isFinalized()
     * Usage: score.getStatus().needsGrading()
     */
    public static final Class<?> SCORE_STATUS = ScoreStatus.class;

    /**
     * ConductRating - Conduct/behavior rating
     * Values: EXCELLENT, GOOD, AVERAGE, POOR, VERY_POOR
     * Features: getScore(), getMinThreshold(), fromScore(), isGood(), isPoor()
     * Usage: ConductRating.fromScore(85)
     */
    public static final Class<?> CONDUCT_RATING = ConductRating.class;

    /**
     * ========== ATTENDANCE ==========
     */

    /**
     * AttendanceStatus - Attendance status
     * Values: PRESENT, ABSENT, LATE, EXCUSED
     * Features: getAttendanceScore(), isAbsent(), isPresentOrExcused()
     * Usage: attendance.getStatus().getAttendanceScore()
     */
    public static final Class<?> ATTENDANCE_STATUS = AttendanceStatus.class;

    /**
     * ========== PROGRESSION ==========
     */

    /**
     * PromotionStatus - Promotion/progression status
     * Values: PROMOTED, RETAINED, TRANSFERRED, GRADUATED, PENDING
     * Features: isProgression(), isRetention(), isFinal()
     * Usage: student.getPromotionStatus().isProgression()
     */
    public static final Class<?> PROMOTION_STATUS = PromotionStatus.class;

    /**
     * ========== SYSTEM OPERATIONS ==========
     */

    /**
     * ImportStatus - Status of import job
     * Values: PENDING, PROCESSING, SUCCESS, FAILED, PARTIAL, CANCELLED
     * Features: isCompleted(), isInProgress(), isSuccessful()
     * Usage: importLog.getStatus().isSuccessful()
     */
    public static final Class<?> IMPORT_STATUS = ImportStatus.class;

    /**
     * RequestStatus - Status of request (approval workflow)
     * Values: PENDING, APPROVED, REJECTED, CANCELLED
     * Features: isPending(), isApproved(), isFinalized()
     * Usage: request.getStatus().isPending()
     */
    public static final Class<?> REQUEST_STATUS = RequestStatus.class;

    /**
     * NotificationType - Type of notification
     * Values: SCORE_UPDATE, ATTENDANCE, SCHEDULE_CHANGE, EVENT, ANNOUNCEMENT, SYSTEM
     * Features: getIcon(), isUrgent()
     * Usage: notification.getType().isUrgent()
     */
    public static final Class<?> NOTIFICATION_TYPE = NotificationType.class;

    /**
     * ========== ENUM USAGE GUIDE ==========
     * 
     * 1. SAFE PARSING:
     *    StudentStatus status = StudentStatus.fromString(userInput);
     *    // Returns ACTIVE if invalid - never throws exception
     * 
     * 2. DISPLAY IN UI:
     *    String label = status.getDisplayName();  // "Đang học", etc.
     * 
     * 3. CONDITIONAL LOGIC:
     *    if (student.getStatus().isActive()) { ... }
     *    if (user.getRole().isAdmin()) { ... }
     * 
     * 4. QUERIES:
     *    Specification<Student> spec = BaseSpecification.equal("status", StudentStatus.ACTIVE);
     * 
     * 5. CALCULATIONS:
     *    double weight = exam.getType().getWeight();
     *    int score = conduct.getRating().getScore();
     *    double attendanceScore = attendance.getStatus().getAttendanceScore();
     * 
     * 6. WORKFLOW:
     *    - Score: PENDING -> SUBMITTED -> APPROVED/REJECTED
     *    - Request: PENDING -> APPROVED/REJECTED
     *    - Import: PENDING -> PROCESSING -> SUCCESS/FAILED/PARTIAL
     * 
     * ========== ENUM FEATURES SUMMARY ==========
     * 
     * ✅ All enums have displayName in Vietnamese
     * ✅ All enums have fromString() for safe parsing
     * ✅ All enums have appropriate helper methods
     * ✅ All enums support toString() for logging
     * ✅ All enums can be used in @Enumerated JPA field
     * ✅ All enums are JSON serializable (spring.jackson automatic)
     * ✅ No exceptions thrown - default values provided
     * 
     * ========== DATABASE MAPPING ==========
     * 
     * In Entity:
     * @Enumerated(EnumType.STRING)
     * private StudentStatus status;
     * 
     * In Repository Query:
     * Specification<Student> spec = 
     *     BaseSpecification.equal("status", StudentStatus.ACTIVE);
     * 
     * In REST Response:
     * {
     *   "status": "ACTIVE"           // Raw enum name
     *   "statusDisplay": "Đang học"  // Display name optional
     * }
     * 
     * ========== IMPORTS FOR USAGE ==========
     * 
     * import com.school.school_management.enums.*;
     * // or individual imports:
     * // import com.school.school_management.enums.StudentStatus;
     * // import com.school.school_management.enums.UserRole;
     */
}
