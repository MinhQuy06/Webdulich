package org.example.backend.repository;

import org.example.backend.model.HotelBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HotelBookingRepository extends JpaRepository<HotelBooking, Long> {
    List<HotelBooking> findByUserId(Long userId);
}
