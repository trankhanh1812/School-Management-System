package com.school.school_management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_group")
public class ChatGroup {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "group_name", length = 255)
    private String groupName;

    @Column(name = "group_type", length = 50)
    private String groupType;

    @Column(columnDefinition = "text")
    private String description;

    @Column(length = 50)
    private String scope;

    @Column(name = "created_by")
    private UUID createdBy;

    @ManyToOne
    @JoinColumn(name = "class_id")
    private SchoolClass schoolClass;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "is_archived")
    private Boolean isArchived;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    @OneToMany(mappedBy = "chatGroup")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<ChatGroupMember> members = new LinkedHashSet<>();

    @OneToMany(mappedBy = "chatGroup")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<ChatMessage> messages = new LinkedHashSet<>();
}
