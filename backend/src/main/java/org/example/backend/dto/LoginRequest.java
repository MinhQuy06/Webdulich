package org.example.backend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username; // có thể là username hoặc email
    private String password;
}
