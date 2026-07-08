package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "contacts")
@Data
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private String subject;

    @Lob // luu string dai khon bi giới hạn
    @Column(columnDefinition = "TEXT")
    private String message;

    private String status;
    private LocalDateTime createdAt;

    @PrePersist // tự động chạy trước
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "new";
        }
    }
}