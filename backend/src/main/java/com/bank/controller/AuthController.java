package com.bank.controller;

import com.bank.dto.request.ChangePasswordRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.AppUser;
import com.bank.repository.AppUserRepository;
import com.bank.repository.EmployeeRepository;
import com.bank.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Authentication and User Profile endpoints.
 *
 * GET  /login                 - Serves login page with CSRF token injected.
 * GET  /api/csrf              - Exposes CSRF token for logout and state management.
 * GET  /api/auth/me           - Returns authenticated user profile and roles.
 * POST /api/auth/change-password - Validates and changes user password.
 */
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @GetMapping(value = "/login", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> loginPage(HttpServletRequest request) throws IOException {
        CsrfToken token = resolveToken(request);
        String html = new ClassPathResource("static/login.html").getContentAsString(StandardCharsets.UTF_8);
        String tokenValue = (token != null && token.getToken() != null) ? token.getToken() : "";
        html = html.replace("{{CSRF_TOKEN}}", tokenValue);
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    @GetMapping("/api/csrf")
    public ResponseEntity<Map<String, String>> csrf(HttpServletRequest request) {
        CsrfToken token = resolveToken(request);
        Map<String, String> body = new LinkedHashMap<>();
        if (token != null && token.getToken() != null) {
            body.put("token", token.getToken());
            body.put("headerName", token.getHeaderName() != null ? token.getHeaderName() : "X-XSRF-TOKEN");
            body.put("paramName", token.getParameterName() != null ? token.getParameterName() : "_csrf");
            return ResponseEntity.ok(body);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.startsWith("ROLE_") ? r.substring(5) : r)
                .toList();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("username", auth.getName());
        data.put("roles", roles);

        appUserRepository.findByUsername(auth.getName()).ifPresent(user -> {
            data.put("userId", user.getUserId());
            data.put("empId", user.getEmpId());
            data.put("isActive", user.getIsActive());
            data.put("createdAt", user.getCreatedAt());
            data.put("lastLogin", user.getLastLogin());
            if (user.getEmpId() != null) {
                employeeRepository.findById(user.getEmpId()).ifPresent(emp -> {
                    data.put("employeeName", emp.getFirstName() + (emp.getLastName() != null ? " " + emp.getLastName() : ""));
                    data.put("designation", emp.getDesignation());
                    data.put("email", emp.getEmail());
                    data.put("phone", emp.getPhone());
                });
            }
        });

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/api/auth/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New password and confirm password do not match"));
        }

        AppUser user = appUserRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New password cannot be the same as current password"));
        }

        String newHash = passwordEncoder.encode(request.getNewPassword());
        appUserRepository.updatePassword(user.getUsername(), newHash);

        String ip = httpRequest.getRemoteAddr();
        auditLogService.logAction("LOGIN", null, user.getEmpId(), "Password changed successfully for user: " + user.getUsername(), ip);

        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", "Password updated successfully"));
    }

    private CsrfToken resolveToken(HttpServletRequest request) {
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token == null) {
            token = (CsrfToken) request.getAttribute("_csrf");
        }
        return token;
    }
}
