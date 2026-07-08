package org.example.backend.service;

import org.example.backend.model.HotelBooking;
import org.example.backend.repository.HotelBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class HotelBookingService {

    @Autowired
    private HotelBookingRepository bookingRepository;

    @Autowired
    private HotelService hotelService;

    public List<HotelBooking> getAll() {
        return bookingRepository.findAll();
    }

    public List<HotelBooking> getByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    // Nghiệp vụ chính: tính số đêm, tính tổng tiền, trừ phòng trống của khách sạn
    public HotelBooking createBooking(HotelBooking booking) {
        if (booking.getCheckInDate() == null || booking.getCheckOutDate() == null) {
            throw new IllegalArgumentException("Thiếu ngày nhận/trả phòng");
        }

        long nights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
        if (nights <= 0) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
        }

        int rooms = booking.getRooms() != null ? booking.getRooms() : 1;

        // Trừ số phòng trống của khách sạn (sẽ báo lỗi nếu không đủ phòng)
        hotelService.decreaseAvailableRooms(booking.getHotelId(), rooms);

        booking.setRooms(rooms);
        booking.setTotal(booking.getPricePerNight() * nights * rooms);

        return bookingRepository.save(booking);
    }

    public HotelBooking updateStatus(Long id, String status) {
        HotelBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng id=" + id));
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    public boolean delete(Long id) {
        if (!bookingRepository.existsById(id)) {
            return false;
        }
        bookingRepository.deleteById(id);
        return true;
    }
}