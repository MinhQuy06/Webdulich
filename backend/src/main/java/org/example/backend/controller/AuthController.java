package org.example.backend.controller;

import org.example.backend.dto.ApiErrorResponse;
import org.example.backend.dto.LoginRequest;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.UserResponse;
import org.example.backend.model.User;
import org.example.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = authService.login(request.getUsername(), request.getPassword());
            // Trả về UserResponse (DTO) thay vì Map hoặc Entity User trực tiếp -> không lộ password
            return ResponseEntity.ok(new UserResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(new ApiErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User saved = authService.register(request);
            return ResponseEntity.ok(new UserResponse(saved));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(new ApiErrorResponse(e.getMessage()));
        }
    }
}