package org.example.backend.service;

import org.example.backend.model.Hotel;
import org.example.backend.repository.HotelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HotelService {

    @Autowired
    private HotelRepository hotelRepository;

    public List<Hotel> getAll() {
        return hotelRepository.findAll();
    }

    public Optional<Hotel> getById(Long id) {
        return hotelRepository.findById(id);
    }

    public Hotel create(Hotel hotel) {
        validateRooms(hotel);
        return hotelRepository.save(hotel);
    }

    public Optional<Hotel> update(Long id, Hotel data) {
        if (!hotelRepository.existsById(id)) {
            return Optional.empty();
        }
        validateRooms(data);
        data.setId(id);
        return Optional.of(hotelRepository.save(data));
    }

    public boolean delete(Long id) {
        if (!hotelRepository.existsById(id)) {
            return false;
        }
        hotelRepository.deleteById(id);
        return true;
    }

    // Nghiệp vụ: trừ số phòng trống khi có người đặt thành công
    public void decreaseAvailableRooms(Long hotelId, int roomsBooked) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khách sạn id=" + hotelId));

        if (hotel.getAvailableRooms() < roomsBooked) {
            throw new IllegalStateException("Khách sạn không đủ phòng trống");
        }
        hotel.setAvailableRooms(hotel.getAvailableRooms() - roomsBooked);
        hotelRepository.save(hotel);
    }

    private void validateRooms(Hotel hotel) {
        if (hotel.getAvailableRooms() != null && hotel.getAvailableRooms() < 0) {
            throw new IllegalArgumentException("Số phòng trống không được âm");
        }
    }
}