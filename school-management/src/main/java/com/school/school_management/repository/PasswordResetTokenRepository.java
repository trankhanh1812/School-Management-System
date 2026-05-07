package com.school.school_management.repository;

import com.school.school_management.entity.PasswordResetToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetTokenRepository extends BaseRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUser_Id(UUID userId);
}
