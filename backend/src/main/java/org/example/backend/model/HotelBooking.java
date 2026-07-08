package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Entity
@Table(name = "hotel_bookings")
@Data
@EqualsAndHashCode(callSuper = true)
public class HotelBooking extends Booking {

    private Long hotelId;
    private String hotelName;
    private String hotelImage;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer guests;
    private Integer rooms;
    private Long pricePerNight;
}