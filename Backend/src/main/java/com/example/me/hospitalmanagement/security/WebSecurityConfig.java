package com.example.me.hospitalmanagement.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.util.Arrays;
import java.util.List;

import static com.example.me.hospitalmanagement.entity.type.PermissionType.APPOINTMENT_DELETE;
import static com.example.me.hospitalmanagement.entity.type.PermissionType.USER_MANAGE;
import static com.example.me.hospitalmanagement.entity.type.RoleType.ADMIN;
import static com.example.me.hospitalmanagement.entity.type.RoleType.DOCTOR;
import static com.example.me.hospitalmanagement.entity.type.RoleType.PATIENT;

@Configuration
@RequiredArgsConstructor
@EnableWebSecurity
@Slf4j
@EnableMethodSecurity
public class WebSecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CustomOAuth2UserService customOAuth2UserService;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, HandlerExceptionResolver handlerExceptionResolver) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/logout").authenticated()
                        .requestMatchers("/auth/**", "/public/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/admin/records/**").hasRole(ADMIN.name())
                        .requestMatchers(HttpMethod.DELETE, "/admin/**")
                        .hasAllAuthorities(com.example.me.hospitalmanagement.entity.type.PermissionType.APPOINTMENT_DELETE.getPermission(), com.example.me.hospitalmanagement.entity.type.PermissionType.USER_MANAGE.getPermission())
                        .requestMatchers("/admin/**").hasRole(ADMIN.name())
                        .requestMatchers("/patient/**").hasAnyRole(PATIENT.name(), ADMIN.name())
                        .requestMatchers("/doctor/slots").hasAnyRole(PATIENT.name(), DOCTOR.name(), ADMIN.name())
                        .requestMatchers(HttpMethod.GET, "/doctor/**").hasAnyRole(PATIENT.name(), DOCTOR.name(), ADMIN.name())
                        .requestMatchers("/doctor/**").hasAnyRole(DOCTOR.name(), ADMIN.name())
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .failureHandler((request, response, exception) -> {
                            log.error("OAuth2 error: {}", exception.getMessage());
                            handlerExceptionResolver.resolveException(request, response, null, exception);
                        })
                        .successHandler(oAuth2SuccessHandler)
                )
                .exceptionHandling(exceptionHandling ->
                        exceptionHandling
                                .accessDeniedHandler((request, response, accessDeniedException) ->
                                        handlerExceptionResolver.resolveException(request, response, null, accessDeniedException)
                                )
                                .authenticationEntryPoint((request, response, authException) ->
                                        handlerExceptionResolver.resolveException(request, response, null, authException)
                                )
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> patterns = new java.util.ArrayList<>(List.of("http://localhost:*", "http://127.0.0.1:*"));
        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            for (String origin : allowedOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty() && !patterns.contains(trimmed)) {
                    patterns.add(trimmed);
                }
            }
        }
        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Set-Cookie", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
