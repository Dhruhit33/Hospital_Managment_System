package com.example.me.hospitalmanagement.entity;

import com.example.me.hospitalmanagement.entity.type.AuthProviderType;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.service.RolePermissionMapping;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "app_user", indexes = {
        @Index(name = "provider_id_provider_Type", columnList = "providerId,authProviderType")
})
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Size(max = 100)
    @Column(length = 100)
    private String name;

    @Size(max = 100)
    @Column(length = 100)
    @ToString.Exclude
    private String password;

    private String providerId;

    @Enumerated(EnumType.STRING)
    private AuthProviderType authProviderType;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @ToString.Exclude
    private Set<RoleType> roles = new HashSet<>();

    @Builder.Default
    private boolean enabled = true;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();
        roles.forEach(
                role -> {
                    Set<SimpleGrantedAuthority> permissions = RolePermissionMapping.getAuthoritiesForEach(role);
                    authorities.addAll(permissions);
                    authorities.add(new SimpleGrantedAuthority(com.example.me.hospitalmanagement.constant.AppConstants.ROLE_PREFIX + role.name()));
                }
        );
        return authorities;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
