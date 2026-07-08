package org.example.backend.service;

import org.example.backend.dto.RegisterRequest;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    // Nghiệp vụ: kiểm tra đăng nhập, cho phép dùng username HOẶC email
    public User login(String usernameOrEmail, String password) {
        Optional<User> found = userRepository.findByUsername(usernameOrEmail);
        if (found.isEmpty()) {
            found = userRepository.findByEmail(usernameOrEmail);
        }

        // TODO: khi thêm BCrypt, thay dòng dưới bằng:
        // passwordEncoder.matches(password, found.get().getPassword())
        if (found.isEmpty() || !found.get().getPassword().equals(password)) {
            throw new IllegalArgumentException("Sai tên đăng nhập hoặc mật khẩu");
        }

        return found.get();
    }

    // Nghiệp vụ: kiểm tra trùng username/email trước khi tạo tài khoản mới.
    // Nhận vào RegisterRequest (DTO) thay vì nhận thẳng Entity User.
    public User register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalStateException("Tên đăng nhập đã tồn tại");
        }
        if (request.getEmail() != null && userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email đã được sử dụng");
        }

        // Chuyển dữ liệu từ DTO (RegisterRequest) sang Entity (User) để lưu vào DB
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setPassword(request.getPassword()); // TODO: mã hóa bằng BCrypt trước khi lưu
        newUser.setFullname(request.getFullname());
        newUser.setEmail(request.getEmail());
        newUser.setPhone(request.getPhone());

        return userRepository.save(newUser);
    }
}