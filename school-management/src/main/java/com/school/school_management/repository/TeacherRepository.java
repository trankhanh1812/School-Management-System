package com.school.school_management.repository;

import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface TeacherRepository extends BaseRepository<Teacher, UUID> {

    List<Teacher> findAllByDeletedAtIsNullOrderByTeacherCodeAsc();

    Optional<Teacher> findByTeacherCodeAndDeletedAtIsNull(String teacherCode);

    boolean existsByTeacherCodeAndDeletedAtIsNull(String teacherCode);

    Optional<Teacher> findByUserAndDeletedAtIsNull(User user);

        @Query("""
                        select count(t) from Teacher t
                        where t.deletedAt is null
                            and upper(cast(t.status as string)) = :status
                        """)
        long countActiveByStatusSafe(@Param("status") String status);

        @Query("""
                select t from Teacher t
                left join t.user u
                left join t.department d
                where t.deletedAt is null
                and (:departmentQuery is null or upper(cast(d.code as string)) = :departmentQuery or upper(cast(d.name as string)) = :departmentQuery)
                    and (
                :searchPattern is null
                or upper(coalesce(cast(t.teacherCode as string), '')) like :searchPattern
                or upper(coalesce(cast(u.fullName as string), '')) like :searchPattern
                or upper(coalesce(cast(d.name as string), '')) like :searchPattern
                    )
                order by t.teacherCode asc
                """)
        Page<Teacher> searchTeachers(
                @Param("departmentQuery") String departmentQuery,
            @Param("searchPattern") String searchPattern,
                Pageable pageable
        );

        @Query("""
                select t from Teacher t
                left join t.user u
                left join t.department d
                where t.deletedAt is null
                and size(t.homeroomClasses) = 0
                order by t.teacherCode asc
                """)
        List<Teacher> findAvailableHomeroomTeachers();
}
