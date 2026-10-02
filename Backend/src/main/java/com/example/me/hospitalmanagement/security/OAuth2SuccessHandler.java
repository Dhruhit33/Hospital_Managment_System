package com.example.me.hospitalmanagement.security;

import com.example.me.hospitalmanagement.dto.LoginResponseDto;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@Slf4j
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final String frontendUrl;

    public OAuth2SuccessHandler(@Lazy AuthService authService,
                                @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.authService = authService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String registrationId = token.getAuthorizedClientRegistrationId();

        try {
            ResponseEntity<LoginResponseDto> loginResponse = authService.handleOAuth2LoginRequest(oAuth2User, registrationId);
            LoginResponseDto body = loginResponse.getBody();

            if (body == null || body.getJwt() == null) {
                log.error("OAuth2 authentication succeeded but JWT token generation failed");
                response.sendRedirect(frontendUrl + "/login?error=oauth_token_failed");
                return;
            }

            // Optional HttpOnly cookie for defense-in-depth
            Cookie jwtCookie = new Cookie("accessToken", body.getJwt());
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // set to true in production with HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge(15 * 60);
            response.addCookie(jwtCookie);

            // Dynamically determine the redirect host based on the request
            String requestHost = request.getServerName();
            String dynamicFrontendUrl = frontendUrl;
            
            // If the frontendUrl in config is localhost but the request came from an IP (like 10.x.x.x or 192.x.x.x), replace localhost with the request's IP
            if (frontendUrl.contains("localhost") && !requestHost.equals("localhost") && !requestHost.equals("127.0.0.1")) {
                dynamicFrontendUrl = frontendUrl.replace("localhost", requestHost);
            }

            // Redirect user to React frontend callback route with tokens
            String redirectUrl = UriComponentsBuilder.fromUriString(dynamicFrontendUrl + "/oauth-callback")
                    .queryParam("jwt", body.getJwt())
                    .queryParam("refreshToken", body.getRefreshToken())
                    .queryParam("userId", body.getUserId())
                    .build()
                    .toUriString();

            response.sendRedirect(redirectUrl);
        } catch (Exception ex) {
            log.error("Failed to process OAuth2 login success: {}", ex.getMessage(), ex);
            response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
        }
    }
}


