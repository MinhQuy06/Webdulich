package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    // Lưu ý: đang lưu password dạng thường (chưa mã hóa) để dễ làm quen trước.
    // Trước khi đưa lên thật, cần mã hóa bằng BCryptPasswordEncoder.
    private String password;

    private String fullname;

    @Column(unique = true)
    private String email;

    private String phone;
}