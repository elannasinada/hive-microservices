package com.gl.hive.ProjectService.feign.client;

import feign.codec.ErrorDecoder;
import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignClientConfiguration {

    @Bean
    public ErrorDecoder errorDecoder() {
        return new ProjectErrorDecoder();
    }

    @Bean
    public RequestInterceptor requestInterceptor(@Autowired(required = false) HttpServletRequest request) {
        return template -> {
            if (request != null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null) {
                    template.header("Authorization", authHeader);
                }
            }
        };
    }

}
