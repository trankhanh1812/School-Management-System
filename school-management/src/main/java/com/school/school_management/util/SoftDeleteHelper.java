package com.school.school_management.util;

import com.school.school_management.entity.BaseEntity;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SoftDeleteHelper - Reusable utility for soft-delete operations.
 * 
 * Provides methods for:
 * - Single entity mark/restore
 * - Batch operations (mark/restore multiple entities)
 * - Deletion status checks
 * - Restore all deleted entities
 * 
 * Usage:
 * Student student = studentRepository.findById(id);
 * SoftDeleteHelper.markDeleted(student, userId);
 * studentRepository.save(student);
 */
public final class SoftDeleteHelper {

    private SoftDeleteHelper() {
        // Private constructor to prevent instantiation
    }

    /**
     * Mark a single entity as deleted.
     * Sets deletedAt to current time and deletedBy to the provided user ID.
     * Also updates updatedAt timestamp.
     * 
     * @param entity the entity to mark as deleted
     * @param deletedBy the UUID of the user performing the deletion
     * @return the marked entity
     */
    public static <T extends BaseEntity> T markDeleted(T entity, UUID deletedBy) {
        if (entity == null) {
            return null;
        }
        OffsetDateTime now = DateTimeUtil.nowUtc();
        entity.setDeletedAt(now);
        entity.setUpdatedAt(now);
        entity.setDeletedBy(deletedBy);
        return entity;
    }

    /**
     * Restore a single entity (undo soft-delete).
     * Clears deletedAt and deletedBy, updates updatedAt.
     * 
     * @param entity the entity to restore
     * @return the restored entity
     */
    public static <T extends BaseEntity> T restore(T entity) {
        if (entity == null) {
            return null;
        }
        entity.setDeletedAt(null);
        entity.setDeletedBy(null);
        entity.setUpdatedAt(DateTimeUtil.nowUtc());
        return entity;
    }

    /**
     * Check if an entity is deleted.
     * 
     * @param entity the entity to check
     * @return true if entity is soft-deleted, false otherwise
     */
    public static boolean isDeleted(BaseEntity entity) {
        return entity != null && entity.getDeletedAt() != null;
    }

    /**
     * Check if an entity is NOT deleted (active).
     * 
     * @param entity the entity to check
     * @return true if entity is active (not deleted), false otherwise
     */
    public static boolean isActive(BaseEntity entity) {
        return entity != null && entity.getDeletedAt() == null;
    }

    /**
     * Mark multiple entities as deleted (batch operation).
     * 
     * @param entities the collection of entities to mark
     * @param deletedBy the UUID of the user performing the deletion
     * @return the list of marked entities
     */
    public static <T extends BaseEntity> List<T> markDeletedBatch(Collection<T> entities, UUID deletedBy) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        return entities.stream()
            .map(entity -> markDeleted(entity, deletedBy))
            .collect(Collectors.toList());
    }

    /**
     * Restore multiple entities (batch operation).
     * 
     * @param entities the collection of entities to restore
     * @return the list of restored entities
     */
    public static <T extends BaseEntity> List<T> restoreBatch(Collection<T> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        return entities.stream()
            .map(SoftDeleteHelper::restore)
            .collect(Collectors.toList());
    }

    /**
     * Restore all deleted entities (delete all soft-deleted records).
     * This is useful when you want to permanently remove soft-deleted records.
     * 
     * @param entities the collection of entities (both deleted and active)
     * @return the list with only previously deleted entities restored
     */
    public static <T extends BaseEntity> List<T> restoreAllDeleted(Collection<T> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        return entities.stream()
            .filter(SoftDeleteHelper::isDeleted)
            .map(SoftDeleteHelper::restore)
            .collect(Collectors.toList());
    }

    /**
     * Filter active (non-deleted) entities from a collection.
     * 
     * @param entities the collection of entities
     * @return list containing only active entities
     */
    public static <T extends BaseEntity> List<T> filterActive(Collection<T> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        return entities.stream()
            .filter(SoftDeleteHelper::isActive)
            .collect(Collectors.toList());
    }

    /**
     * Filter deleted entities from a collection.
     * 
     * @param entities the collection of entities
     * @return list containing only deleted entities
     */
    public static <T extends BaseEntity> List<T> filterDeleted(Collection<T> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        return entities.stream()
            .filter(SoftDeleteHelper::isDeleted)
            .collect(Collectors.toList());
    }

    /**
     * Get deletion info for an entity (who deleted it and when).
     * 
     * @param entity the entity to check
     * @return a formatted string with deletion info or null if not deleted
     */
    public static String getDeletionInfo(BaseEntity entity) {
        if (!isDeleted(entity)) {
            return null;
        }
        return String.format("Deleted at: %s, Deleted by: %s", 
            entity.getDeletedAt(), 
            entity.getDeletedBy());
    }

    /**
     * Check if entity was deleted by specific user.
     * 
     * @param entity the entity to check
     * @param userId the user ID to check
     * @return true if entity was deleted by the specified user
     */
    public static boolean isDeletedBy(BaseEntity entity, UUID userId) {
        return isDeleted(entity) && entity.getDeletedBy() != null && entity.getDeletedBy().equals(userId);
    }

    /**
     * Get days since deletion.
     * Returns 0 if not deleted. Returns negative if deletion is in future.
     * 
     * @param entity the entity to check
     * @return number of days since deletion, or 0 if not deleted
     */
    public static long daysSinceDeletion(BaseEntity entity) {
        if (!isDeleted(entity)) {
            return 0;
        }
        OffsetDateTime now = DateTimeUtil.nowUtc();
        OffsetDateTime deletedAt = entity.getDeletedAt();
        return java.time.temporal.ChronoUnit.DAYS.between(deletedAt, now);
    }
}

