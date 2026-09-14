# Báo cáo tích hợp Dashboard NSNN trên Web và Mobile

| Thông tin | Nội dung |
|---|---|
| Trạng thái | Prototype đã triển khai, chờ tích hợp với ứng dụng Mobile |
| Ngày cập nhật | 14/09/2026 |
| Phạm vi | Giao diện Mobile, nhận diện host và trao đổi dữ liệu qua `postMessage` |
| Tài liệu kỹ thuật | [HOST-INTEGRATION.md](HOST-INTEGRATION.md) |

## 1. Bối cảnh

Dashboard Thu NSNN hiện được dùng trên Web và có nhu cầu nhúng vào ứng dụng Mobile bằng
WebView. Hai môi trường dùng chung số liệu, bộ lọc, tab và biểu đồ. Điểm khác nhau nằm ở cách
trình bày và cách dashboard gọi chức năng của ứng dụng chứa nó.

Nếu dashboard chỉ dựa vào độ rộng màn hình, hệ thống không biết người dùng đang xem trong
trình duyệt Web hay trong Mobile app. Host cần gửi ngữ cảnh rõ ràng để dashboard chọn đúng
giao diện và hành vi.

## 2. Mục tiêu

- Dùng chung một dashboard và một nguồn dữ liệu cho Web và Mobile.
- Có giao diện báo cáo phù hợp với màn hình Mobile.
- Cho phép host điều khiển tab và bộ lọc.
- Cho phép dashboard yêu cầu Mobile app mở chức năng native, trước mắt là bộ lọc.
- Giữ nguyên hoạt động của bản Web hiện tại.

## 3. Phạm vi đã triển khai

| Chế độ | Cách hiển thị |
|---|---|
| Web host | Header đầy đủ; filter trực tiếp ở desktop và filter thu gọn khi web hẹp |
| iframe Web | Thanh tóm tắt hai nhóm, panel lọc responsive và nút reset toàn chiều rộng |
| Mobile host | Header gọn, tab cuộn ngang, filter thu gọn và widget tự xếp theo chiều rộng |

Dashboard nhận biết host bằng message `NSNN_HOST_CONTEXT`. Tham số
`?host=mobile&platform=android` được dùng để xem thử khi chưa có Mobile bridge.

Mobile app có thể gửi lệnh đổi tab hoặc cập nhật bộ lọc. Dashboard phát lại trạng thái và
chiều cao nội dung để host đồng bộ giao diện. Nếu app đã có modal lọc native, nút "Bộ lọc"
gửi yêu cầu cho app. Nếu chưa có, dashboard mở bộ lọc HTML có sẵn.

Bộ lọc HTML đặt `Cấp ngân sách` cạnh `Chỉ tiêu`, dành nhiều chiều rộng hơn cho tên chỉ tiêu
và có nút `Đặt lại bộ lọc`. Preview Mobile mô phỏng 11 thiết bị iOS/Android; người dùng có
thể kéo thanh tab bằng chuột như vuốt trên màn cảm ứng mà không kích hoạt nhầm tab.

## 4. Luồng nghiệp vụ

1. Mobile app mở dashboard trong WebView.
2. Dashboard phát `NSNN_DASHBOARD_READY`.
3. Mobile app gửi `NSNN_HOST_CONTEXT`, trong đó có loại host, nền tảng và khả năng app hỗ trợ.
4. Dashboard chuyển sang giao diện Mobile.
5. Người dùng xem báo cáo, chuyển tab hoặc thay đổi bộ lọc.
6. Dashboard phát `NSNN_STATE_CHANGE` và `NSNN_RESIZE` khi trạng thái hoặc kích thước thay đổi.
7. Khi người dùng bấm bộ lọc native, dashboard phát `NSNN_OPEN_FILTER` để app xử lý.

## 5. Danh sách message

| Chiều | Message | Ý nghĩa nghiệp vụ |
|---|---|---|
| Dashboard sang host | `NSNN_DASHBOARD_READY` | Dashboard đã sẵn sàng nhận ngữ cảnh và lệnh |
| Host sang dashboard | `NSNN_HOST_CONTEXT` | Xác định Web host hoặc Mobile host |
| Host sang dashboard | `NSNN_SET_FILTERS` | Cập nhật một phần bộ lọc báo cáo |
| Host sang dashboard | `NSNN_NAVIGATE` | Chuyển đến tab được yêu cầu |
| Dashboard sang host | `NSNN_OPEN_FILTER` | Yêu cầu Mobile app mở modal lọc native |
| Dashboard sang host | `NSNN_STATE_CHANGE` | Thông báo tab hoặc bộ lọc đã thay đổi |
| Dashboard sang host | `NSNN_RESIZE` | Thông báo lại kích thước nội dung |

Các lệnh được xử lý theo thứ tự. Hai lệnh gửi sát nhau không ghi đè lẫn nhau. Dashboard kiểm
tra dữ liệu đầu vào và bỏ qua giá trị không hợp lệ.

## 6. Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-01 | Web và Mobile dùng chung dữ liệu, công thức và trạng thái bộ lọc |
| BR-02 | Host được xác định bằng message hoặc URL fallback, không xác định chỉ bằng độ rộng màn hình |
| BR-03 | Responsive CSS quyết định cách xếp nội dung theo chiều rộng thực tế |
| BR-04 | Mobile app có modal lọc native thì dashboard không mở panel lọc HTML |
| BR-05 | Khi không có modal native, người dùng vẫn lọc được ngay trong dashboard |
| BR-06 | Tham số `host` và `platform` được giữ khi URL dashboard thay đổi |
| BR-07 | Message không đúng nguồn hoặc sai cấu trúc không được cập nhật dashboard state |

## 7. Tiêu chí nghiệm thu

| Mã | Điều kiện | Kết quả prototype |
|---|---|---|
| AC-01 | Web host vẫn hiển thị header và layout Web | Đạt |
| AC-02 | Mobile host hiển thị giao diện Mobile | Đạt |
| AC-03 | Host đổi được tab bằng `NSNN_NAVIGATE` | Đạt |
| AC-04 | Host đổi được bộ lọc bằng `NSNN_SET_FILTERS` | Đạt |
| AC-05 | Nút lọc phát `NSNN_OPEN_FILTER` khi app có modal native | Đạt |
| AC-06 | Thanh tóm tắt filter không xuống dòng hoặc tràn trang ở 320, 390, 500 và 720 px | Đạt |
| AC-07 | Dashboard phát state và kích thước về host | Đạt |
| AC-08 | Production build và kiểm tra hồi quy dashboard thành công | Đạt, 17/17 tiêu chí |
| AC-09 | Preview Mobile kéo ngang thanh tab bằng chuột mà không đổi tab ngoài ý muốn | Đạt |
| AC-10 | Filter fallback có reset và không tràn ở Web hẹp/iframe/Mobile | Đạt |

## 8. Phần Mobile app cần thực hiện

| Bên thực hiện | Công việc |
|---|---|
| Mobile | Nhúng URL dashboard trong WebView |
| Mobile | Gửi `NSNN_HOST_CONTEXT` sau khi nhận `NSNN_DASHBOARD_READY` |
| Mobile | Mở modal native khi nhận `NSNN_OPEN_FILTER` |
| Mobile | Gửi kết quả lọc bằng `NSNN_SET_FILTERS` |
| Mobile | Cập nhật chiều cao WebView theo `NSNN_RESIZE` nếu màn hình cần tự co giãn |
| Web và Mobile | Thống nhất domain được phép gửi và nhận message trên môi trường production |

## 9. Ngoài phạm vi

- Thiết kế và lập trình modal lọc native của iOS hoặc Android.
- Đăng nhập một lần, phân quyền và truyền access token giữa app với dashboard.
- Kiểm thử trên bản Mobile app production.
- Thay đổi API hoặc công thức số liệu NSNN.

## 10. Điểm cần xác nhận

1. Mobile app có header native riêng hay dùng header gọn trong dashboard.
2. iOS và Android dùng cùng một cấu trúc filter payload hay cần adapter riêng.
3. WebView dùng chiều cao cố định hay cập nhật theo `NSNN_RESIZE`.
4. Danh sách origin chính thức của Web host và Mobile host.
5. Khi bấm Back trên app, ưu tiên đóng drawer trong dashboard hay quay lại màn hình trước của app.

Sau khi thống nhất năm điểm trên, đội Mobile có thể tích hợp theo
[HOST-INTEGRATION.md](HOST-INTEGRATION.md) mà không cần thay đổi nghiệp vụ của dashboard.
