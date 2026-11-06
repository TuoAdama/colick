package com.coliclic.backoffice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.core.io.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import java.nio.file.Paths;

/**
 * MVC configuration that serves uploaded files from the local filesystem
 * under the {@code /uploads/**} URL prefix.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    /**
     * Maps the {@code /uploads/**} URL pattern to the configured upload directory
     * so that stored files can be fetched directly over HTTP.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(absolutePath)
                .resourceChain(false)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        // Also deny active documents uploaded before image validation was introduced.
                        if (!resourcePath.matches("[a-f0-9-]{36}\\.(?i:jpg|jpeg|png|webp)")) return null;
                        return super.getResource(resourcePath, location);
                    }
                });
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                response.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
                response.setHeader("X-Content-Type-Options", "nosniff");
                return true;
            }
        }).addPathPatterns("/uploads/**");
    }
}
