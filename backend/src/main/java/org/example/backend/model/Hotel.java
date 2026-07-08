package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "hotels")
@Data
@EqualsAndHashCode(callSuper = true)
public class Hotel extends Product {

    private Long pricePerNight;
    private Integer availableRooms;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String amenities;
}