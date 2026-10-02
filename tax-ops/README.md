# Web quản lý nghiệp vụ Thuế

Ứng dụng nội bộ dành cho cán bộ, trưởng phòng, lãnh đạo Thuế và quản trị dữ
liệu. Đây là sản phẩm tách biệt với Dashboard Thu NSNN dành cho lãnh đạo thành
phố; hai ứng dụng không dùng chung URL, state hoặc dữ liệu người nộp thuế.

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Mặc định Vite mở tại `http://localhost:5174`.

## Tài khoản trình diễn

Tài khoản chia theo **phòng × vai trò**, đúng ma trận ở mục 3 bản thiết kế.
Tất cả dùng mật khẩu `demo123`. Phiên chỉ được lưu trong tab trình duyệt hiện
tại bằng `sessionStorage`; đây không phải cơ chế xác thực production.

| Tài khoản | Phòng | Vai trò | Màn mở được |
|---|---|---|---|
| `cv.ql1` | QL1 | Chuyên viên | Công việc theo kỳ · Báo cáo công tác nợ · Tình trạng dữ liệu |
| `tp.ql1` | QL1 | Trưởng phòng | Như trên; duyệt, trả lại hoặc chốt số của kỳ |
| `cv.ql3` | QL3 | Chuyên viên | Công việc theo kỳ · Kiểm tra tại bàn · Tình trạng dữ liệu |
| `tp.ql3` | QL3 | Trưởng phòng | Như trên; duyệt, trả lại hoặc chốt số của kỳ |
| `vanhanh.dulieu` | — | Vận hành dữ liệu | Chỉ Giám sát dữ liệu |
| `lanhdao.nhanuoc` | — | Lãnh đạo nhà nước | Không vào Web quản lý; chuyển sang Dashboard NSNN |

Phân hệ của phòng khác bị **ẩn hẳn** khỏi điều hướng và không mở được bằng
deep link — mục bảo mật S1 ghi "ẩn hẳn menu, không chỉ làm mờ".

Luồng duyệt chạy ngay trên phân hệ của phòng, ba bước theo mục G10: **Nháp → Chờ duyệt → Đã chốt**.
Chuyên viên gửi duyệt; trưởng phòng chốt số hoặc trả lại bản nháp. Trạng thái
thứ tư "Chưa đủ dữ liệu" nằm ngoài chuỗi: nó nói dữ liệu chưa đạt nên chưa gửi được.
Một trạng thái có một nhãn và một màu với mọi vai; chỉ **phạm vi** khác nhau,
theo ma trận quyền của từng phòng. Hai tài khoản cùng phòng dùng chung báo
cáo mô phỏng trong cùng tab trình duyệt để trình diễn luồng bàn giao. Những
thao tác này chưa chạy dữ liệu nguồn và chưa phải quy trình phê duyệt thật.

Năm tài khoản đầu có quyền `TAX_OPS_VIEW`. Tài khoản `lanhdao.nhanuoc` chỉ có
`NSNN_VIEW` và được điều hướng sang Dashboard Thu NSNN. Production phải lấy
quyền từ dịch vụ xác thực thay vì suy ra từ nhãn vai trò trên giao diện.

Liên kết sang Dashboard thêm tham số kỹ thuật `from=tax-ops`. Dashboard chỉ dựa
vào tham số này để hiện nút quay lại; tham số không cấp quyền và không chứa MST,
mã hồ sơ hoặc bộ lọc nghiệp vụ.

Trong portal dùng chung cổng 5174, Dashboard ở `/nsnn/`. Khi chạy Web quản lý
độc lập, URL đích có thể cấu hình bằng `VITE_NSNN_URL`.

Từ thư mục gốc repository có thể dùng:

```bash
npm run dev:tax-ops
npm run build:tax-ops
npm run acceptance:tax-ops -- http://127.0.0.1:5174
```

## Các màn hình hiện hành

- `Công việc theo kỳ`: công việc và tình trạng nguồn dữ liệu.
- `Báo cáo công tác nợ` (QL1): tổng quan, so sánh nợ, cưỡng chế, tạm hoãn xuất cảnh, quy tắc và nguồn, dữ liệu gốc. Gửi duyệt và chốt số ngay tại báo cáo.
- `Kiểm tra tại bàn` (QL3): tổng quan, kết quả tổng hợp, dữ liệu gốc, đối chiếu báo cáo thủ công.
- `Tình trạng dữ liệu`: lịch sử thu thập, lô dữ liệu, xác định đơn vị quản lý NNT.
- `Giám sát dữ liệu`: dành cho vận hành dữ liệu.

Các đường dẫn: `/?view=workbench`, `/?view=debt`, `/?view=risk`, `/?view=tinhtrang`, `/?view=giamsat`.
Đường dẫn cũ `/?view=reports` mở báo cáo trong phân hệ tương ứng; không có màn tạo báo cáo riêng.

Căn cứ từng tab và danh mục tài liệu đã kiểm tra: [Đối chiếu giao diện với general_data](DOI-CHIEU-GENERAL-DATA.md).

## Trạng thái dữ liệu

Toàn bộ số liệu và danh tính trong bản đầu là mô phỏng tất định. Tên người nộp
thuế, MST và cán bộ không phải dữ liệu thật. Trước khi nối nguồn thật cần có
backend phân quyền, lưu lô nguồn, lịch sử ánh xạ, phiên bản quy tắc và nhật ký
duyệt báo cáo.

## Kiểm tra

`npm run dev` trong thư mục này chạy portal gồm cả tác nghiệp và Dashboard NSNN trên cùng cổng 5174. Chọn tài khoản Lãnh đạo nhà nước để mở dashboard. `npm run dev:standalone` chỉ dành cho phát triển riêng tác nghiệp và cần dashboard chạy riêng.

`npm run test:portal` kiểm tra đăng nhập, chuyển phân hệ, tải lại và đăng xuất cho cả sáu tài khoản.

`npm run build` chạy TypeScript strict và build production. `npm run acceptance`
kiểm tra cả sáu workspace ở desktop 1440px và mobile 390px, bao gồm tràn trang,
vùng chạm và lỗi JavaScript.

`npm run test:reports` kiểm tra tải báo cáo Excel/Word thực tế và quyền chuyên viên/trưởng phòng trên dev server. QL1 xuất cả bộ Excel 9 sheet, từng bảng/danh sách đang lọc và Word tổng hợp; QL3 xuất Excel 17 cột. Các tệp dùng dữ liệu mô phỏng, chưa phải văn bản chính thức đã phê duyệt.
