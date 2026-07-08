package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@MappedSuperclass
@Data
public abstract class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String location;
    private String image;
    private Double rating;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;
}