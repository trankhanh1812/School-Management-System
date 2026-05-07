package com.school.school_management.config;

import com.school.school_management.repository.ConductRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.SemesterRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.service.conduct.ConductService;
import com.school.school_management.service.conduct.ConductServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConductConfiguration {

    @Bean
    public ConductService conductService(
            ConductRepository conductRepository,
            StudentRepository studentRepository,
            SemesterRepository semesterRepository,
            SchoolClassRepository schoolClassRepository,
            TeacherRepository teacherRepository) {
        return new ConductServiceImpl(
            conductRepository,
            studentRepository,
            semesterRepository,
            schoolClassRepository,
            teacherRepository
        );
    }
}
