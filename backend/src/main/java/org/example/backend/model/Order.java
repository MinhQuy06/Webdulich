package org.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Entity
@Table(name = "orders")
@Data
@EqualsAndHashCode(callSuper = true)
public class Order extends Booking {

    private String tourName;
    private String tourImage;
    private Long price;
    private Integer quantity;
    private LocalDate date;
}