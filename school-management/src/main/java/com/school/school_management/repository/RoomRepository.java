package com.school.school_management.repository;

import com.school.school_management.entity.Room;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends BaseRepository<Room, UUID> {

    List<Room> findAllByOrderByNameAsc();
}
