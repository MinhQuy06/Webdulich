package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

// DTO dùng chung để trả lỗi, thay cho Map.of("error", "...") đang dùng tạm ở các Controller.
// Giúp mọi API trả lỗi theo ĐÚNG 1 cấu trúc JSON thống nhất: { "error": "..." }
@Data
@AllArgsConstructor
public class ApiErrorResponse {
    private String error;
}