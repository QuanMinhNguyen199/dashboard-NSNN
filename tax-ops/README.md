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

Màn đăng nhập cung cấp bốn tài khoản mẫu cho Cán bộ xử lý, Trưởng phòng, Lãnh
đạo Thuế và Quản trị dữ liệu. Tất cả dùng mật khẩu `demo123`. Phiên chỉ được lưu
trong tab trình duyệt hiện tại bằng `sessionStorage`; đây không phải cơ chế xác
thực production.

Tài khoản `lanhdao.thue` có quyền demo `NSNN_VIEW`, vì vậy có thể thấy lối
chuyển sang Dashboard Thu NSNN khi `VITE_ENABLE_NSNN_LINK=true`. Ba tài khoản
còn lại chỉ có quyền `TAX_OPS_VIEW`. Production phải lấy các quyền này từ dịch
vụ xác thực thay vì suy ra trực tiếp từ nhãn vai trò trên giao diện.

Liên kết sang Dashboard thêm tham số kỹ thuật `from=tax-ops`. Dashboard chỉ dựa
vào tham số này để hiện nút quay lại; tham số không cấp quyền và không chứa MST,
mã hồ sơ hoặc bộ lọc nghiệp vụ.

Liên kết quay về Dashboard Thu NSNN mặc định bị ẩn. Đặt
`VITE_ENABLE_NSNN_LINK=true` để bật cho vai trò **Lãnh đạo Thuế**; URL đích đọc
từ `VITE_NSNN_URL` và mặc định là `http://localhost:5173/` khi chạy local.

Từ thư mục gốc repository có thể dùng:

```bash
npm run dev:tax-ops
npm run build:tax-ops
npm run acceptance:tax-ops -- http://127.0.0.1:5174
```

## Workspace

- `Trang công việc`: việc đến hạn, báo cáo chờ duyệt và tình trạng nguồn.
- `Nợ và cưỡng chế`: tuổi nợ và danh sách cần xử lý.
- `Kiểm tra và rủi ro`: kiểm tra tại bàn, tờ khai–hóa đơn và xác minh hóa đơn.
- `Hoàn thuế và hỗ trợ`: đối chiếu hồ sơ hoàn và báo cáo tổng đài.
- `Báo cáo`: tạo, duyệt, phát hành và quản lý phiên bản.
- `Dữ liệu và danh mục`: lô dữ liệu, ngoại lệ ánh xạ và quy tắc nghiệp vụ.

Deep link dùng tham số `view`, ví dụ:

```text
/?view=workbench
/?view=debt
/?view=risk
/?view=refund
/?view=reports
/?view=data
```

## Trạng thái dữ liệu

Toàn bộ số liệu và danh tính trong bản đầu là mô phỏng tất định. Tên người nộp
thuế, MST và cán bộ không phải dữ liệu thật. Trước khi nối nguồn thật cần có
backend phân quyền, lưu lô nguồn, lịch sử ánh xạ, phiên bản quy tắc và nhật ký
duyệt báo cáo.

## Kiểm tra

`npm run build` chạy TypeScript strict và build production. `npm run acceptance`
kiểm tra cả sáu workspace ở desktop 1440px và mobile 390px, bao gồm tràn trang,
vùng chạm và lỗi JavaScript.
