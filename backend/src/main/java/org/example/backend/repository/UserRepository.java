package org.example.backend.repository;

import org.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Dùng để tìm user lúc đăng nhập, theo username HOẶC email
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);
}
