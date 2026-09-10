# dashboard-NSNN

Prototype dashboard **Thu ngân sách nhà nước — Thành phố Hà Nội**: bốn workspace phân tích,
URL state đầy đủ, lớp provider API/MCP/Mock có runtime validation, và dữ liệu mô phỏng tất
định dựng từ một kho quan sát gốc duy nhất.

> **Dữ liệu trong ứng dụng là mô phỏng phục vụ prototype, không phải số liệu quyết toán.**

## Chạy

```bash
cd prototype-nsnn
npm install
npm run dev          # http://localhost:5173
```

Hướng dẫn đầy đủ, giả định của mock và giới hạn còn lại: [`prototype-nsnn/README.md`](prototype-nsnn/README.md).

## Nội dung repo

| Thư mục | Nội dung |
|---|---|
| [`prototype-nsnn/`](prototype-nsnn/) | **Ứng dụng.** React + TypeScript + Vite. Source, `DESIGN.md`, script nghiệm thu. |
| [`prototype-nsnn/archive/legacy-clone/`](prototype-nsnn/archive/legacy-clone/) | Bản clone nguyên trạng website ba tab của giai đoạn trước. Không còn trong build, giữ để tra cứu. |
| [`reference-nsnn/`](reference-nsnn/) | Bộ khảo sát website tham chiếu: 143 phản hồi API đã lưu, 40 trạng thái giao diện, CSS/bundle gốc, GeoJSON ranh giới 126 phường/xã và 30 quận/huyện trước 01/07/2025. |
| [`verification/`](verification/) | Ảnh và text đối chiếu của giai đoạn clone. |
| [`Attachment/`](Attachment/) | Ảnh đính kèm của tài liệu đặc tả. |

## Tài liệu

| File | Vai trò |
|---|---|
| [`THIET-KE-DASHBOARD-NSNN.md`](THIET-KE-DASHBOARD-NSNN.md) | **Đặc tả thiết kế đang triển khai** — UI/UX, URL state, API/MCP, mock data, 15 tiêu chí nghiệm thu. |
| [`dac-ta-v2.html`](dac-ta-v2.html) | Đặc tả nghiệp vụ v2. |
| [`update_dac-ta-89_tham-khaor.html`](update_dac-ta-89_tham-khaor.html) | Phản hồi bên thuế và đặc tả trước v2. |
| [`phan-tich.md`](phan-tich.md) | Mục tiêu phân tích và mô hình phân cấp nguồn thu. |
| [`PROMPT-CLAUDE-NSNN.md`](PROMPT-CLAUDE-NSNN.md) | Yêu cầu của giai đoạn clone nguyên trạng. |
| [`bao-cao-kiem-tra-tabs.md`](bao-cao-kiem-tra-tabs.md) | Báo cáo kiểm tra website tham chiếu. |
| [`prototype-nsnn/DESIGN.md`](prototype-nsnn/DESIGN.md) | Hệ thống thị giác: token, thang màu dữ liệu, quy tắc bố cục. |

## Kiến trúc

- **Một kho quan sát gốc.** KPI, xu hướng, cơ cấu, xếp hạng, bảng và waterfall đều tổng hợp
  từ cùng `RevenueObservation`; không widget nào sinh số riêng, nên các tổng khớp nhau ở
  mọi chiều.
- **Một nơi sở hữu URL state.** Bộ lọc chung giữ nguyên khi chuyển tab; drawer dùng
  `pushState` nên Back đóng drawer mà không mất bộ lọc.
- **Ranh giới tin cậy.** API và MCP chỉ được trả dữ liệu cùng navigation intent trong danh
  sách đóng; mọi payload đi qua runtime validation trước khi tới giao diện.
- **Quy tắc số liệu.** `0`, số âm và `null` là ba thứ khác nhau và không bị đánh đồng;
  `%YoY` trả “chưa đủ cơ sở” thay vì bịa `−100%`; waterfall luôn khớp tổng chênh lệch.
