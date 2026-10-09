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

`npm run dev` trong thư mục này chạy hai URL trên cùng cổng 5174: web quản lý tại `/quan-ly/`, Dashboard NSNN tại `/nsnn/`. Mỗi hệ có màn đăng nhập riêng và chỉ hiện tài khoản phù hợp. Dashboard chưa đăng nhập sẽ mở `/nsnn/dang-nhap/`; đăng xuất trở về màn đăng nhập của hệ đang dùng. URL gốc chuyển về web quản lý. `npm run dev:standalone` chỉ dành cho phát triển riêng tác nghiệp và cần dashboard chạy riêng.

`npm run test:portal` kiểm tra đăng nhập, chuyển phân hệ, tải lại và đăng xuất cho cả sáu tài khoản.

Bản GitHub Pages phải dựng bằng `npm run build:portal` ở thư mục gốc, với `VITE_BASE=/dashboard-NSNN/` (hoặc tên repository tương ứng). Bước build tạo `quan-ly/index.html` và `nsnn/dang-nhap/index.html`; không phụ thuộc vào định tuyến của Vite. Sau build, chạy `npm --prefix tax-ops run test:portal:static` từ thư mục gốc với cùng `VITE_BASE` để kiểm tra trên máy chủ tĩnh không có SPA fallback. Workflow Pages chạy kiểm tra này trước khi phát hành.

`npm run build` chạy TypeScript strict và build production. `npm run acceptance`
kiểm tra cả sáu workspace ở desktop 1440px và mobile 390px, bao gồm tràn trang,
vùng chạm và lỗi JavaScript.

`npm run test:reports` kiểm tra tải báo cáo Excel/Word thực tế và quyền chuyên viên/trưởng phòng trên dev server. QL1 xuất cả bộ Excel 9 sheet, từng bảng/danh sách đang lọc và Word tổng hợp; QL3 xuất Excel 17 cột. Các tệp dùng dữ liệu mô phỏng, chưa phải văn bản chính thức đã phê duyệt.


### Danh sách NNT chênh lệch QL2 — đối chiếu §4.2, §4.4, Q-96

- Mặc định đọc kết quả r31, lọc theo kỳ, đơn vị, cờ, loại tờ khai và kết quả; xuất Excel theo danh sách đã lọc (mọi trang).
- Ô số (9)–(31) của bảng tổng hợp mở danh sách theo đơn vị/khối, loại tờ khai và cờ/kết quả tương ứng.
- PRS-03 là nhánh dự phòng. Chỉ CV thấy thao tác giao và mở phần phiếu khi metadata báo thiếu r31; các bảng phiếu giới hạn trong đơn vị thiếu nguồn.
- Dữ liệu hiện vẫn mô phỏng. Fixture tháng 09/2026 có đủ r31; tháng 08/2026 thiếu T1. `donViThieuR31` trong `src/data/ql2.ts` là điểm thay bằng metadata tiếp nhận thật, không suy việc thiếu nguồn từ trạng thái “Chưa có kết quả”.
- Chưa nối hddtbaocao thật; ánh xạ trạng thái r31 vẫn chờ Q-100. Dữ liệu tổng hợp và chi tiết là các fixture riêng, chưa dùng để nghiệm thu đối soát số. Giao/nhắc phiếu vẫn là demo, phản hồi chưa cập nhật báo cáo.
- Kiểm tra: `node scripts/check-ql2-list.mjs http://127.0.0.1:5174/quan-ly/`.


### QL2: hệ số K, XMHD, TPR, cảnh báo và gói Công an

- Hệ số K mặc định tuần thứ Sáu–thứ Năm; có ngày, tháng và khoảng ngày/ngày chốt tùy chọn. Mỗi khoảng ngày có khóa báo cáo riêng. Danh sách chỉ lấy “Chưa xử lý”; đánh dấu/gỡ QLRR theo kỳ cập nhật tồn và Excel từ cùng nguồn dòng. Dữ liệu và ngưỡng ngành hiện mô phỏng; chưa phân loại các trạng thái còn chờ Q-98.
- XMHD dùng thứ tự trạng thái 10, 14, 6, 7, 8; tồn = 6+7+8+10. Bảng và Excel đếm từ cùng dòng hóa đơn. Danh sách mặc định mọi dòng còn tồn; lọc quá hạn/sắp đến hạn chỉ là tiện ích tra cứu. Kỳ tuần chốt thứ Sáu.
- QL2-05 vẫn là khung; tên trưởng đoàn/số tiền là các trường cần lấy theo Q-12/Q-13, không bị cấm hiển thị bởi S6 của QL4.
- TPR dựng được cơ cấu 8501/Văn phòng, 25 TCS, phần “Trong đó” và lựa chọn lũy kế. Chưa có nguồn nên để trống; không tự tạo đủ 16 tên cột.
- Gói Công an nhập được các tổng DN/HĐ phải/đã xử lý; tính còn lại và tỷ lệ DN, lưu nguồn/người/thời điểm trong phiên, CV sửa/TP xem. Bản xuất chỉ chứa số đã lưu. Đây chưa phải báo cáo đầy đủ bốn hình thức xử lý.
- **Còn thiếu tệp để hoàn thiện đúng mẫu**: `Báo cáo TPR 01.10.xlsx`, `BC gói hđ CA 3007.xls`, `2.3. BC_QLTT3…(he so k).xlsx`. Thiết kế ghi đã nhận các mẫu ngày 06/10 nhưng chúng chưa có trong workspace; QLTT3 còn chờ Q-102. Các màn này thông báo đúng phần thiếu và chặn phát hành bản chưa đủ cột. Không xuất nhầm XMHD cho mã báo cáo khác.
- Kiểm tra dev: `node scripts/check-ql2-tabs.mjs` (đối soát, kỳ, xuất dữ liệu, quyền, lưu dữ liệu và ảnh desktop/mobile); `node scripts/check-ql2-list.mjs` (hồi quy danh sách chênh lệch).
