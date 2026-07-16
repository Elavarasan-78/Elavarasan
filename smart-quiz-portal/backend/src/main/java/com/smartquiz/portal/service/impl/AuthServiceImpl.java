package com.smartquiz.portal.service.impl;

import com.smartquiz.portal.dto.AuthResponse;
import com.smartquiz.portal.dto.LoginRequest;
import com.smartquiz.portal.dto.RegisterRequest;
import com.smartquiz.portal.entity.Admin;
import com.smartquiz.portal.entity.User;
import com.smartquiz.portal.exception.BadRequestException;
import com.smartquiz.portal.exception.ResourceNotFoundException;
import com.smartquiz.portal.repository.AdminRepository;
import com.smartquiz.portal.repository.UserRepository;
import com.smartquiz.portal.service.AuthService;
import com.smartquiz.portal.util.JwtUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostConstruct
    @Override
    public void seedDefaultAdmin() {
        if (adminRepository.count() == 0) {
            Admin defaultAdmin = Admin.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .email("admin@smartquiz.com")
                    .fullName("System Admin")
                    .build();
            adminRepository.save(defaultAdmin);
            System.out.println("Default Admin seeded successfully. Username: admin, Password: admin123");
        }
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "USER";

        if ("ADMIN".equals(role)) {
            Admin admin = adminRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

            if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
                throw new BadCredentialsException("Invalid username or password");
            }

            String token = jwtUtil.generateToken(admin.getUsername(), "ADMIN");
            return AuthResponse.builder()
                    .token(token)
                    .id(admin.getId())
                    .username(admin.getUsername())
                    .email(admin.getEmail())
                    .fullName(admin.getFullName())
                    .role("ADMIN")
                    .build();
        } else {
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

            if (!user.isActive()) {
                throw new BadRequestException("Your account has been deactivated. Please contact administration.");
            }

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new BadCredentialsException("Invalid username or password");
            }

            String token = jwtUtil.generateToken(user.getUsername(), "USER");
            return AuthResponse.builder()
                    .token(token)
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role("USER")
                    .build();
        }
    }

    @Override
    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()) || adminRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail()) || adminRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getUsername(), "USER");

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role("USER")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse registerAdmin(RegisterRequest request) {
        if (adminRepository.existsByUsername(request.getUsername()) || userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (adminRepository.existsByEmail(request.getEmail()) || userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        Admin admin = Admin.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .build();

        Admin savedAdmin = adminRepository.save(admin);
        String token = jwtUtil.generateToken(savedAdmin.getUsername(), "ADMIN");

        return AuthResponse.builder()
                .token(token)
                .id(savedAdmin.getId())
                .username(savedAdmin.getUsername())
                .email(savedAdmin.getEmail())
                .fullName(savedAdmin.getFullName())
                .role("ADMIN")
                .build();
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> searchUsers(String query) {
        return userRepository.findByFullNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(query, query);
    }

    @Override
    @Transactional
    public User toggleUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setActive(active);
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
