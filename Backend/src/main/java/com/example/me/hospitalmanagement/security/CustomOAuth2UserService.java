package com.example.me.hospitalmanagement.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());

        if ("github".equalsIgnoreCase(registrationId)) {
            String email = (String) attributes.get("email");
            if (email == null || email.isBlank()) {
                String token = userRequest.getAccessToken().getTokenValue();
                String fetchedEmail = fetchGitHubPrimaryEmail(token);
                if (fetchedEmail != null && !fetchedEmail.isBlank()) {
                    attributes.put("email", fetchedEmail);
                    log.info("Fetched private GitHub email for user: {}", fetchedEmail);
                }
            }
        }

        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        if (userNameAttributeName == null || userNameAttributeName.isBlank()) {
            userNameAttributeName = "github".equalsIgnoreCase(registrationId) ? "id" : "sub";
        }

        return new DefaultOAuth2User(oAuth2User.getAuthorities(), attributes, userNameAttributeName);
    }

    private String fetchGitHubPrimaryEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            List<Map<String, Object>> emailList = response.getBody();
            if (emailList != null && !emailList.isEmpty()) {
                // Priority 1: primary AND verified
                for (Map<String, Object> emailObj : emailList) {
                    Boolean primary = (Boolean) emailObj.get("primary");
                    Boolean verified = (Boolean) emailObj.get("verified");
                    if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified)) {
                        return (String) emailObj.get("email");
                    }
                }
                // Priority 2: verified
                for (Map<String, Object> emailObj : emailList) {
                    Boolean verified = (Boolean) emailObj.get("verified");
                    if (Boolean.TRUE.equals(verified)) {
                        return (String) emailObj.get("email");
                    }
                }
                // Priority 3: any email entry
                return (String) emailList.get(0).get("email");
            }
        } catch (Exception e) {
            log.warn("Could not fetch emails from GitHub API: {}", e.getMessage());
        }
        return null;
    }
}
