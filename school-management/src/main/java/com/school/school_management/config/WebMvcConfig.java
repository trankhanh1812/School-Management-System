package com.school.school_management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Exclude /ws/** from static resource handling (for WebSocket/SockJS)
        registry.addResourceHandler(
            "/css/**",
            "/js/**",
            "/images/**",
            "/fonts/**",
            "/webjars/**",
            "/swagger-ui/**",
            "/v3/api-docs/**"
        )
        .addResourceLocations(
            "classpath:/static/css/",
            "classpath:/static/js/",
            "classpath:/static/images/",
            "classpath:/static/fonts/",
            "classpath:/META-INF/resources/webjars/",
            "classpath:/META-INF/resources/swagger-ui/",
            "classpath:/META-INF/resources/api-docs/"
        )
        .setCachePeriod(3600);

        // Ensure /ws/** is NOT mapped as a static resource
        registry.addResourceHandler("/favicon.ico")
            .addResourceLocations("classpath:/static/")
            .setCachePeriod(3600);
    }
}
