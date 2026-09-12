# Tích hợp Web host và Mobile app host

Dashboard dùng chung dữ liệu và widget. Host chỉ gửi ngữ cảnh để dashboard chọn
chrome, bố cục và cách mở bộ lọc phù hợp.

## Khởi tạo

Khi iframe/WebView sẵn sàng, dashboard phát `NSNN_DASHBOARD_READY`. Host phản hồi:

```ts
iframe.contentWindow?.postMessage({
  type: "NSNN_HOST_CONTEXT",
  payload: {
    source: "mobile",                 // "web" | "mobile"
    platform: "android",              // "desktop" | "ios" | "android"
    displayMode: "report",            // "dashboard" | "report"
    capabilities: {
      openFilterModal: true,           // host có modal lọc native
      navigation: true,
    },
  },
}, DASHBOARD_ORIGIN);
```

Nếu chưa có bridge, có thể xem thử bằng `?host=mobile&platform=android`. Trong
chế độ này dashboard dùng panel lọc HTML làm fallback.

## Lệnh host gửi vào dashboard

```ts
// Chuyển tab
{ type: "NSNN_NAVIGATE", payload: { tab: "location-detail" } }

// Cập nhật một phần bộ lọc
{
  type: "NSNN_SET_FILTERS",
  payload: { filters: { year: 2025, periodType: "MONTH", period: 6 } },
}
```

Dashboard kiểm tra schema và bỏ qua trường hoặc giá trị không hợp lệ.

## Event dashboard gửi ra host

- `NSNN_OPEN_FILTER`: yêu cầu Mobile host mở modal lọc native; payload chứa
  `currentFilters`.
- `NSNN_STATE_CHANGE`: tab và bộ lọc hiện tại đã thay đổi.
- `NSNN_RESIZE`: kích thước nội dung thay đổi để host cập nhật iframe/WebView.

Production nên cấu hình danh sách origin được phép:

```env
VITE_HOST_ORIGINS=https://web.example.gov.vn,https://mobile.example.gov.vn
```
