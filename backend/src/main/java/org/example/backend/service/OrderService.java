package org.example.backend.service;

import org.example.backend.model.Order;
import org.example.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    public List<Order> getAll() {
        return orderRepository.findAll();
    }

    public List<Order> getByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    // Nghiệp vụ: tự tính lại "total" từ price * quantity,
    // không tin tưởng số total mà frontend tự gửi lên (tránh gian lận giá).
    public Order create(Order order) {
        if (order.getQuantity() == null || order.getQuantity() <= 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn 0");
        }
        order.setTotal(order.getPrice() * order.getQuantity());
        return orderRepository.save(order);
    }

    public Order updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng id=" + id));
        order.setStatus(status);
        return orderRepository.save(order);
    }

    public boolean delete(Long id) {
        if (!orderRepository.existsById(id)) {
            return false;
        }
        orderRepository.deleteById(id);
        return true;
    }

    // Nghiệp vụ: thống kê doanh số theo tháng
    public List<Map<String, Object>> getMonthlyRevenue() {
        List<Object[]> rows = orderRepository.sumRevenueByMonth();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("year", row[0]);
            item.put("month", row[1]);
            item.put("revenue", row[2]);
            result.add(item);
        }
        return result;
    }
}