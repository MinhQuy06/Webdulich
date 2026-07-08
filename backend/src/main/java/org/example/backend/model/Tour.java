package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "tours")
@Data
@EqualsAndHashCode(callSuper = true)
public class Tour extends Product {

    private String category;
    private String duration;
    private Integer people;
    private Long price;
    private Integer discount;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String itineraryJson;
}