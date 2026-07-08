package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@MappedSuperclass
@Data // thư viện của lombok tự động sinh contructor, get, set, equal, hashcose...
public abstract class Booking {

    @Id // danh dau field là khóa chính mỗi bản có giá trị duy nhất không trùng nhau
    @GeneratedValue(strategy = GenerationType.IDENTITY) //  tự động tăng id
    private Long id;

    private Long userId;
    private Long total;
    private String status;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "pending";
        }
    }
}