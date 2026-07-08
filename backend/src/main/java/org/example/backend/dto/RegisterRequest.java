package org.example.backend.dto;

import lombok.Data;

// DTO dùng để NHẬN dữ liệu đăng ký từ frontend gửi lên.
// Tách riêng khỏi Entity User để kiểm soát chính xác field nào frontend được phép gửi.
@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String fullname;
    private String email;
    private String phone;
}