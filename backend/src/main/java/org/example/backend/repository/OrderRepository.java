package org.example.backend.repository;

import org.example.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Lấy danh sách đơn hàng của 1 user cụ thể (dùng cho trang orders.html)
    List<Order> findByUserId(Long userId);

    // Thống kê doanh số theo từng tháng (dùng cho biểu đồ trong admin.html)
    // Trả về mỗi dòng: [năm, tháng, tổng doanh số]
    @Query("SELECT FUNCTION('YEAR', o.createdAt), FUNCTION('MONTH', o.createdAt), SUM(o.total) " +
           "FROM Order o " +
           "WHERE o.status <> 'cancelled' " +
           "GROUP BY FUNCTION('YEAR', o.createdAt), FUNCTION('MONTH', o.createdAt) " +
           "ORDER BY FUNCTION('YEAR', o.createdAt), FUNCTION('MONTH', o.createdAt)")
    List<Object[]> sumRevenueByMonth();
}
