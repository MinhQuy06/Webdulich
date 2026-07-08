package org.example.backend.service;

import org.example.backend.model.Tour;
import org.example.backend.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TourService {

    @Autowired
    private TourRepository tourRepository;

    public List<Tour> getAll() {
        return tourRepository.findAll();
    }

    public Optional<Tour> getById(Long id) {
        return tourRepository.findById(id);
    }

    public Tour create(Tour tour) {
        // Nghiệp vụ: giá sau giảm giá không được âm
        validateDiscount(tour);
        return tourRepository.save(tour);
    }

    public Optional<Tour> update(Long id, Tour data) {
        if (!tourRepository.existsById(id)) {
            return Optional.empty();
        }
        validateDiscount(data);
        data.setId(id);
        return Optional.of(tourRepository.save(data));
    }

    public boolean delete(Long id) {
        if (!tourRepository.existsById(id)) {
            return false;
        }
        tourRepository.deleteById(id);
        return true;
    }

    // Nghiệp vụ: tính giá sau khi giảm giá (dùng khi cần hiển thị hoặc validate)
    public long calculateFinalPrice(Tour tour) {
        long discount = tour.getDiscount() != null ? tour.getDiscount() : 0;
        return tour.getPrice() - (tour.getPrice() * discount / 100);
    }

    private void validateDiscount(Tour tour) {
        if (tour.getDiscount() != null && (tour.getDiscount() < 0 || tour.getDiscount() > 100)) {
            throw new IllegalArgumentException("Phần trăm giảm giá phải từ 0 đến 100");
        }
    }
}