package com.school.school_management.config;

import com.school.school_management.util.ExcelImportUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ExcelImportConfig {

    @Bean
    public ExcelImportUtil excelImportUtil() {
        return new ExcelImportUtil();
    }
}
