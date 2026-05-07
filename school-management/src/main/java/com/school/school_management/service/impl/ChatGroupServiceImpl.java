package com.school.school_management.service.impl;

import com.school.school_management.dto.chat.ChatGroupResponse;
import com.school.school_management.dto.chat.CreateChatGroupRequest;
import com.school.school_management.dto.chat.AddStudentMembersRequest;
import com.school.school_management.entity.ChatGroup;
import com.school.school_management.entity.ChatGroupMember;
import com.school.school_management.entity.Role;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Subject;
import com.school.school_management.entity.Department;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.User;
import com.school.school_management.entity.Student;
import com.school.school_management.exception.CustomException;
import com.school.school_management.exception.ResourceNotFoundException;
import com.school.school_management.repository.ChatGroupMemberRepository;
import com.school.school_management.repository.ChatGroupRepository;
import com.school.school_management.repository.ChatMessageRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.SubjectRepository;
import com.school.school_management.repository.DepartmentRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.chat.ChatGroupService;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ChatGroupServiceImpl implements ChatGroupService {

    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final StudentRepository studentRepository;

    public ChatGroupServiceImpl(
        ChatGroupRepository chatGroupRepository,
        ChatGroupMemberRepository chatGroupMemberRepository,
        ChatMessageRepository chatMessageRepository,
        SchoolClassRepository schoolClassRepository,
        SubjectRepository subjectRepository,
        DepartmentRepository departmentRepository,
        UserRepository userRepository,
        TeacherRepository teacherRepository,
        TeachingAssignmentRepository teachingAssignmentRepository,
        StudentRepository studentRepository
    ) {
        this.chatGroupRepository = chatGroupRepository;
        this.chatGroupMemberRepository = chatGroupMemberRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.subjectRepository = subjectRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    public ChatGroupResponse createGroup(CreateChatGroupRequest request, UUID createdBy) {
        User creator = userRepository
            .findByIdAndDeletedAtIsNull(createdBy)
            .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));

        SchoolClass schoolClass = null;
        if (request.getClassId() != null && !request.getClassId().isEmpty()) {
            schoolClass = schoolClassRepository
                .findByIdAndDeletedAtIsNull(UUID.fromString(request.getClassId()))
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        }

        Subject subject = null;
        if (request.getSubjectId() != null && !request.getSubjectId().isEmpty()) {
            subject = subjectRepository
                .findByIdAndDeletedAtIsNull(UUID.fromString(request.getSubjectId()))
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        }

        Department department = null;
        if (request.getDepartmentId() != null && !request.getDepartmentId().isEmpty()) {
            department = departmentRepository
                .findById(UUID.fromString(request.getDepartmentId()))
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }

            validateCreatePermission(creator, request, schoolClass, subject, department);

        ChatGroup group = ChatGroup.builder()
            .groupName(request.getGroupName())
            .groupType(request.getGroupType())
            .description(request.getDescription())
            .scope(request.getScope())
            .createdBy(createdBy)
            .schoolClass(schoolClass)
            .subject(subject)
            .department(department)
            .isArchived(false)
            .createdAt(OffsetDateTime.now())
            .build();

        ChatGroup savedGroup = chatGroupRepository.save(group);

        if (!chatGroupMemberRepository.existsByChatGroupIdAndUserId(savedGroup.getId(), creator.getId())) {
            chatGroupMemberRepository.save(ChatGroupMember.builder()
                .chatGroup(savedGroup)
                .user(creator)
                .joinedAt(OffsetDateTime.now())
                .build());
        }

        return mapToResponse(savedGroup);
    }

    private void validateCreatePermission(
        User creator,
        CreateChatGroupRequest request,
        SchoolClass schoolClass,
        Subject subject,
        Department department
    ) {
        Set<String> roleCodes = creator.getUserRoles().stream()
            .map(userRole -> userRole.getRole())
            .map(Role::getCode)
            .filter(code -> code != null && !code.isBlank())
            .map(code -> code.trim().toUpperCase(Locale.ROOT))
            .collect(Collectors.toCollection(HashSet::new));

        String groupType = safeUpper(request.getGroupType());
        String scope = safeUpper(request.getScope());
        boolean isAdmin = roleCodes.contains("ADMIN");

        if (roleCodes.contains("STUDENT") || roleCodes.contains("PARENT")) {
            throw new CustomException("STUDENT/PARENT cannot create chat groups", 403);
        }

        if ("ROLE_GROUP".equals(groupType)) {
            if (!isAdmin) {
                throw new CustomException("Only ADMIN can create role groups", 403);
            }

            if (!"ROLE_GROUP_TEACHER".equals(scope) && !"ROLE_GROUP_PARENT".equals(scope)) {
                throw new CustomException("ROLE_GROUP scope must be role_group_teacher or role_group_parent", 400);
            }

            return;
        }

        // For DEPARTMENT_GROUP, CLASS_GROUP, SUBJECT_CLASS_GROUP - Teacher profile is required
        if ("DEPARTMENT_GROUP".equals(groupType) || "CLASS_GROUP".equals(groupType) || "SUBJECT_CLASS_GROUP".equals(groupType)) {
            Teacher teacher = teacherRepository.findByUserAndDeletedAtIsNull(creator)
                .orElseThrow(() -> new CustomException("Teacher profile not found", 403));

            if ("DEPARTMENT_GROUP".equals(groupType)) {
                if (!isDepartmentLeader(teacher)) {
                    throw new CustomException("Only department head/vice can create department groups", 403);
                }

                if (department == null || teacher.getDepartment() == null || teacher.getDepartment().getId() == null) {
                    throw new CustomException("Department group requires department", 400);
                }

                if (!teacher.getDepartment().getId().equals(department.getId())) {
                    throw new CustomException("You can only create group for your own department", 403);
                }
                return;
            }

            if ("CLASS_GROUP".equals(groupType)) {
                if (schoolClass == null || schoolClass.getHomeroomTeacher() == null || schoolClass.getHomeroomTeacher().getId() == null) {
                    throw new CustomException("Class group requires valid homeroom class", 400);
                }

                if (!schoolClass.getHomeroomTeacher().getId().equals(teacher.getId())) {
                    throw new CustomException("Only homeroom teacher can create class group", 403);
                }
                return;
            }

            if ("SUBJECT_CLASS_GROUP".equals(groupType)) {
                if (schoolClass == null || subject == null) {
                    throw new CustomException("Subject class group requires class and subject", 400);
                }

                boolean hasAssignment = teachingAssignmentRepository
                    .existsByTeacher_IdAndSchoolClass_IdAndSubject_Id(
                        teacher.getId(),
                        schoolClass.getId(),
                        subject.getId());

                if (!hasAssignment) {
                    throw new CustomException("Teacher is not assigned for this subject-class", 403);
                }
                return;
            }
        }

        // For custom groups - only ADMIN allowed (no Teacher profile required)
        if (!isAdmin) {
            throw new CustomException("Only ADMIN can create custom groups", 403);
        }
    }

    private boolean isDepartmentLeader(Teacher teacher) {
        Integer level = teacher.getDepartmentLevel();
        return level != null && (level == 1 || level == 2);
    }

    private String safeUpper(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatGroupResponse getGroupById(UUID groupId) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found with id: " + groupId));
        return mapToResponse(group);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatGroupResponse> getUserGroups(UUID userId, Pageable pageable) {
        List<UUID> groupIds = chatGroupMemberRepository
            .findByUserId(userId)
            .stream()
            .map(member -> member.getChatGroup().getId())
            .collect(Collectors.toList());

        if (groupIds.isEmpty()) {
            return Page.empty(pageable);
        }

        List<ChatGroupResponse> groups = chatGroupRepository
            .findByDeletedAtIsNullOrderByCreatedAtDesc(pageable)
            .getContent()
            .stream()
            .filter(group -> groupIds.contains(group.getId()))
            .map(this::mapToResponse)
            .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(groups, pageable, groups.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatGroupResponse> getGroupsByType(String groupType) {
        return chatGroupRepository
            .findByGroupTypeAndDeletedAtIsNull(groupType)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatGroupResponse> getAllGroups(Pageable pageable) {
        return chatGroupRepository
            .findByDeletedAtIsNullOrderByCreatedAtDesc(pageable)
            .map(this::mapToResponse);
    }

    @Override
    public void addMemberToGroup(UUID groupId, UUID userId) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));

        User user = userRepository
            .findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!chatGroupMemberRepository.existsByChatGroupIdAndUserId(groupId, userId)) {
            ChatGroupMember member = ChatGroupMember.builder()
                .chatGroup(group)
                .user(user)
                .joinedAt(OffsetDateTime.now())
                .build();
            chatGroupMemberRepository.save(member);
        }
    }

    @Override
    public void addStudentMembersToGroup(UUID groupId, AddStudentMembersRequest request) {
        System.out.println("[DEBUG] addStudentMembersToGroup called with groupId=" + groupId);
        System.out.println("[DEBUG] Request studentCodes: " + request.getStudentCodes());
        System.out.println("[DEBUG] Request classCode: " + request.getClassCode());
        
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));

        List<Student> students = new java.util.ArrayList<>();

        // If studentCodes are provided, find by code or by ID (trying both)
        if (request.getStudentCodes() != null && !request.getStudentCodes().isEmpty()) {
            for (String identifier : request.getStudentCodes()) {
                System.out.println("[DEBUG] Looking for student identifier: '" + identifier + "'");
                Student student = null;
                
                // First try to find by studentCode (string code like "S001")
                student = studentRepository.findByStudentCodeAndDeletedAtIsNull(identifier).orElse(null);
                if (student != null) {
                    System.out.println("[DEBUG]   ✓ Found by studentCode");
                } else {
                    System.out.println("[DEBUG]   ✗ Not found by studentCode, trying UUID...");
                }
                
                // If not found and identifier looks like a UUID, try to find by student ID
                if (student == null) {
                    try {
                        UUID studentId = UUID.fromString(identifier);
                        student = studentRepository.findByIdAndDeletedAtIsNull(studentId).orElse(null);
                        if (student != null) {
                            System.out.println("[DEBUG]   ✓ Found by UUID");
                        } else {
                            System.out.println("[DEBUG]   ✗ Not found by UUID either");
                        }
                    } catch (IllegalArgumentException e) {
                        System.out.println("[DEBUG]   ✗ Not a valid UUID format");
                    }
                }
                
                if (student == null) {
                    System.out.println("[DEBUG] ERROR: Student not found, throwing exception");
                    throw new ResourceNotFoundException("Student not found: " + identifier);
                }
                students.add(student);
            }
        }

        // If classCode is provided, find all students in that class
        if (request.getClassCode() != null && !request.getClassCode().isEmpty()) {
            System.out.println("[DEBUG] Finding students by classCode: " + request.getClassCode());
            students = studentRepository.findByClass(request.getClassCode());
            System.out.println("[DEBUG] Found " + students.size() + " students in class");
        }

        System.out.println("[DEBUG] Total students to add: " + students.size());
        
        // Add each student's associated user to the group
        for (Student student : students) {
            User user = student.getUser();
            System.out.println("[DEBUG] Student " + student.getStudentCode() + " -> User: " + (user != null ? user.getId() : "null"));
            if (user != null && !chatGroupMemberRepository.existsByChatGroupIdAndUserId(groupId, user.getId())) {
                ChatGroupMember member = ChatGroupMember.builder()
                    .chatGroup(group)
                    .user(user)
                    .joinedAt(OffsetDateTime.now())
                    .build();
                chatGroupMemberRepository.save(member);
            }
        }
    }

    @Override
    public void removeMemberFromGroup(UUID groupId, UUID userId) {
        chatGroupMemberRepository.deleteByChatGroupIdAndUserId(groupId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isMemberOfGroup(UUID groupId, UUID userId) {
        return chatGroupMemberRepository.existsByChatGroupIdAndUserId(groupId, userId);
    }

    @Override
    public void archiveGroup(UUID groupId) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));
        group.setIsArchived(true);
        group.setUpdatedAt(OffsetDateTime.now());
        chatGroupRepository.save(group);
    }

    @Override
    public void unarchiveGroup(UUID groupId) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));
        group.setIsArchived(false);
        group.setUpdatedAt(OffsetDateTime.now());
        chatGroupRepository.save(group);
    }

    @Override
    public void deleteGroup(UUID groupId) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));
        
        // Soft delete
        group.setDeletedAt(OffsetDateTime.now());
        chatGroupRepository.save(group);
    }

    @Override
    public ChatGroupResponse updateGroup(UUID groupId, CreateChatGroupRequest request) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));

        if (request.getGroupName() != null) {
            group.setGroupName(request.getGroupName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        group.setUpdatedAt(OffsetDateTime.now());

        ChatGroup updatedGroup = chatGroupRepository.save(group);
        return mapToResponse(updatedGroup);
    }

    private ChatGroupResponse mapToResponse(ChatGroup group) {
        long memberCount = chatGroupMemberRepository.countByChatGroupId(group.getId());
        long messageCount = chatMessageRepository.countByChatGroupIdAndDeletedAtIsNull(group.getId());

        return ChatGroupResponse.builder()
            .id(group.getId())
            .groupName(group.getGroupName())
            .groupType(group.getGroupType())
            .description(group.getDescription())
            .scope(group.getScope())
            .createdBy(group.getCreatedBy())
            .classCode(group.getSchoolClass() != null ? group.getSchoolClass().getClassCode() : null)
            .subjectCode(group.getSubject() != null ? group.getSubject().getCode() : null)
            .departmentCode(group.getDepartment() != null ? group.getDepartment().getCode() : null)
            .isArchived(group.getIsArchived())
            .memberCount(memberCount)
            .messageCount(messageCount)
            .createdAt(group.getCreatedAt())
            .updatedAt(group.getUpdatedAt())
            .build();
    }
}
