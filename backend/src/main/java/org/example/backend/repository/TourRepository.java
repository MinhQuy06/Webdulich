package org.example.backend.repository;

import org.example.backend.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TourRepository extends JpaRepository<Tour, Long> {
    // JpaRepository đã có sẵn: findAll(), findById(), save(), deleteById()...
    // Cần lọc thêm gì thì khai báo thêm ở đây, VD:
    // List<Tour> findByCategory(String category);
}
