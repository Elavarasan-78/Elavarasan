package com.smartquiz.portal.service;

import com.smartquiz.portal.dto.AuthResponse;
import com.smartquiz.portal.dto.LoginRequest;
import com.smartquiz.portal.dto.RegisterRequest;
import com.smartquiz.portal.entity.User;
import java.util.List;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse registerUser(RegisterRequest request);
    AuthResponse registerAdmin(RegisterRequest request);
    void seedDefaultAdmin();
    
    // User management methods for Admin
    List<User> getAllUsers();
    List<User> searchUsers(String query);
    User toggleUserStatus(Long userId, boolean active);
    void resetUserPassword(Long userId, String newPassword);
}
