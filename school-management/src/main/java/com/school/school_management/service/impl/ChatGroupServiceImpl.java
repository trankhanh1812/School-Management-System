package com.school.school_management.service.impl;

import java.time.OffsetDateTime;
import java.util.Comparator;
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

import com.school.school_management.dto.chat.AddStudentMembersRequest;
import com.school.school_management.dto.chat.AutoAddMembersRequest;
import com.school.school_management.dto.chat.ChatGroupResponse;
import com.school.school_management.dto.chat.CreateChatGroupRequest;
import com.school.school_management.entity.ChatGroup;
import com.school.school_management.entity.ChatGroupMember;
import com.school.school_management.entity.Department;
import com.school.school_management.entity.Role;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.Subject;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.exception.ResourceNotFoundException;
import com.school.school_management.repository.ChatGroupMemberRepository;
import com.school.school_management.repository.ChatGroupRepository;
import com.school.school_management.repository.ChatMessageRepository;
import com.school.school_management.repository.DepartmentRepository;
import com.school.school_management.repository.ParentRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.SubjectRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.chat.ChatGroupService;

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
    private final ParentRepository parentRepository;
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
        ParentRepository parentRepository,
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
        this.parentRepository = parentRepository;
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

        autoAddMembers(savedGroup, request);

        return mapToResponse(savedGroup);
    }

    @Override
    public void autoAddMembersToGroup(UUID groupId, AutoAddMembersRequest request) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));

        Department department = group.getDepartment();
        if (department == null && request.getDepartmentCode() != null && !request.getDepartmentCode().isBlank()) {
            department = departmentRepository.findByCode(request.getDepartmentCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }

        SchoolClass schoolClass = group.getSchoolClass();
        if (schoolClass == null && request.getClassCode() != null && !request.getClassCode().isBlank()) {
            schoolClass = schoolClassRepository.findByClassCodeAndDeletedAtIsNull(request.getClassCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        }

        autoAddMembersByScope(group, group.getGroupType(), request.getScope(), department, schoolClass);
    }

    private void autoAddMembers(ChatGroup group, CreateChatGroupRequest request) {
        autoAddMembersByScope(group, request.getGroupType(), request.getScope(), group.getDepartment(), group.getSchoolClass());
    }

    private void autoAddMembersByScope(
        ChatGroup group,
        String groupType,
        String scope,
        Department department,
        SchoolClass schoolClass
    ) {
        String normalizedGroupType = safeUpper(groupType);
        String normalizedScope = safeUpper(scope);

        switch (normalizedGroupType) {
            case "ROLE_GROUP":
                if ("ROLE_GROUP_TEACHER".equals(normalizedScope)) {
                    addTeachersToGroup(group, null);
                } else if ("ROLE_GROUP_PARENT".equals(normalizedScope)) {
                    addParentsToGroup(group);
                }
                break;
            case "DEPARTMENT_GROUP":
                addTeachersToGroup(group, department);
                break;
            case "CLASS_GROUP":
                if ("HOMEROOM_CLASS_GROUP_PARENT".equals(normalizedScope)) {
                    addParentsOfClassStudentsToGroup(group, schoolClass);
                } else {
                    addStudentsToGroup(group, schoolClass);
                }
                break;
            case "SUBJECT_CLASS_GROUP":
                addStudentsToGroup(group, schoolClass);
                break;
            default:
                break;
        }
    }

    private void addUserToGroup(ChatGroup group, User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        if (!chatGroupMemberRepository.existsByChatGroupIdAndUserId(group.getId(), user.getId())) {
            chatGroupMemberRepository.save(ChatGroupMember.builder()
                .chatGroup(group)
                .user(user)
                .joinedAt(OffsetDateTime.now())
                .build());
        }
    }

    private void addTeachersToGroup(ChatGroup group, Department department) {
        teacherRepository.findAll().stream()
            .filter(teacher -> teacher.getDeletedAt() == null)
            .filter(teacher -> teacher.getUser() != null && teacher.getUser().getDeletedAt() == null)
            .filter(teacher -> department == null || teacher.getDepartment() == null || department.getId() == null || department.getId().equals(teacher.getDepartment().getId()))
            .map(Teacher::getUser)
            .forEach(user -> addUserToGroup(group, user));
    }

    private void addParentsToGroup(ChatGroup group) {
        parentRepository.findAll().stream()
            .filter(parent -> parent.getUser() != null && parent.getUser().getDeletedAt() == null)
            .map(com.school.school_management.entity.Parent::getUser)
            .forEach(user -> addUserToGroup(group, user));
    }

    private void addStudentsToGroup(ChatGroup group, SchoolClass schoolClass) {
        if (schoolClass == null || schoolClass.getClassCode() == null) {
            return;
        }

        studentRepository.findByClass(schoolClass.getClassCode()).stream()
            .filter(student -> student.getUser() != null && student.getUser().getDeletedAt() == null)
            .map(Student::getUser)
            .forEach(user -> addUserToGroup(group, user));
    }

    private void addParentsOfClassStudentsToGroup(ChatGroup group, SchoolClass schoolClass) {
        if (schoolClass == null || schoolClass.getClassCode() == null) {
            return;
        }

        studentRepository.findByClass(schoolClass.getClassCode()).stream()
            .flatMap(student -> student.getParentStudents().stream())
            .map(com.school.school_management.entity.ParentStudent::getParent)
            .map(com.school.school_management.entity.Parent::getUser)
            .filter(user -> user != null && user.getDeletedAt() == null)
            .forEach(user -> addUserToGroup(group, user));
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
        // Collect ALL of the user's non-deleted groups, then paginate in memory.
        // (The previous version paginated the whole-group table first and filtered,
        // which silently dropped a user's groups that fell outside the fetched page.)
        List<ChatGroup> groups = chatGroupMemberRepository
            .findByUserId(userId)
            .stream()
            .map(ChatGroupMember::getChatGroup)
            .filter(group -> group != null && group.getDeletedAt() == null)
            .sorted(Comparator.comparing(ChatGroup::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());

        if (groups.isEmpty()) {
            return Page.empty(pageable);
        }

        int start = (int) pageable.getOffset();
        if (start >= groups.size()) {
            return new org.springframework.data.domain.PageImpl<>(List.of(), pageable, groups.size());
        }
        int end = Math.min(start + pageable.getPageSize(), groups.size());
        List<ChatGroupResponse> content = groups.subList(start, end).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(content, pageable, groups.size());
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
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));

        List<Student> students = new java.util.ArrayList<>();

        // If studentCodes are provided, find by code or by ID (trying both)
        if (request.getStudentCodes() != null && !request.getStudentCodes().isEmpty()) {
            for (String identifier : request.getStudentCodes()) {
                // First try to find by studentCode (string code like "S001")
                Student student = studentRepository.findByStudentCodeAndDeletedAtIsNull(identifier).orElse(null);

                // If not found and identifier looks like a UUID, try to find by student ID
                if (student == null) {
                    try {
                        UUID studentId = UUID.fromString(identifier);
                        student = studentRepository.findByIdAndDeletedAtIsNull(studentId).orElse(null);
                    } catch (IllegalArgumentException e) {
                        // identifier is neither a known studentCode nor a valid UUID
                    }
                }

                if (student == null) {
                    throw new ResourceNotFoundException("Student not found: " + identifier);
                }
                students.add(student);
            }
        }

        // If classCode is provided, find all students in that class
        if (request.getClassCode() != null && !request.getClassCode().isEmpty()) {
            students = studentRepository.findByClass(request.getClassCode());
        }

        // Add each student's associated user to the group
        for (Student student : students) {
            User user = student.getUser();
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
