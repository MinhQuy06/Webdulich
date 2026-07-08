package org.example.backend.controller;

import org.example.backend.model.HotelBooking;
import org.example.backend.service.HotelBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hotel-bookings")
public class HotelBookingController {

    @Autowired
    private HotelBookingService bookingService;

    @GetMapping
    public List<HotelBooking> getAll() {
        return bookingService.getAll();
    }

    @GetMapping("/user/{userId}")
    public List<HotelBooking> getByUser(@PathVariable Long userId) {
        return bookingService.getByUser(userId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody HotelBooking booking) {
        try {
            return ResponseEntity.ok(bookingService.createBooking(booking));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patch(@PathVariable Long id, @RequestBody Map<String, Object> fields) {
        try {
            return ResponseEntity.ok(bookingService.updateStatus(id, (String) fields.get("status")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return bookingService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}