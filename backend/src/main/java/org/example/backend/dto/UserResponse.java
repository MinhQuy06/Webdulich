package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.example.backend.model.User;

// DTO dùng để TRẢ dữ liệu User về cho frontend.
// KHÔNG có field "password" — đây là lý do chính cần DTO thay vì trả thẳng Entity User.
@Data
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String fullname;
    private String email;
    private String phone;

    // Constructor tiện lợi: truyền thẳng Entity User vào,
    // tự động lấy ra các field an toàn, bỏ qua password.
    public UserResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.fullname = user.getFullname();
        this.email = user.getEmail();
        this.phone = user.getPhone();
    }
}