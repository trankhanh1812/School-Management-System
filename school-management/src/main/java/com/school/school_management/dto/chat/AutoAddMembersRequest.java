package com.school.school_management.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for auto-adding members to a chat group based on scope.
 *
 * <p>Supported scopes:
 * <ul>
 *   <li>{@code ROLE_GROUP_TEACHER} — add all active teachers</li>
 *   <li>{@code ROLE_GROUP_PARENT} — add all active parents</li>
 *   <li>{@code DEPARTMENT_GROUP} — add all teachers in the given departmentCode</li>
 *   <li>{@code HOMEROOM_CLASS_GROUP_STUDENT} — add all students of classCode</li>
 *   <li>{@code HOMEROOM_CLASS_GROUP_PARENT} — add all parents of students in classCode</li>
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoAddMembersRequest {
    /** One of the scope constants listed above. */
    private String scope;
    /** Required for DEPARTMENT_GROUP scope. */
    private String departmentCode;
    /** Required for class-based scopes. */
    private String classCode;
}
