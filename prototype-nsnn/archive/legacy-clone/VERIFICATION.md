# VERIFICATION — kết quả kiểm chứng

Đối chiếu bản clone với 40 trạng thái đã khảo sát trong `../reference-nsnn/`.
Môi trường: Chrome (puppeteer-core, headless), Windows, `--force-device-scale-factor=1`.
Chạy lại: `npm run dev` ở một terminal, rồi `npm run verify` và `npm run interactions`.

Ảnh và text của bản clone ghi vào `../verification/`.

---

## 1. Tổng kết

| Phép đo | Kết quả |
|---|---|
| Kích thước ảnh full-page trùng khớp | **40 / 40** |
| Lệch pixel trung vị | **0,13 %** |
| Lệch pixel trung bình | 0,51 % |
| Số ảnh lệch dưới 1 % | 37 / 40 |
| Ảnh trùng khít tuyệt đối (0,00 %) | 4 (`14`, `19`, `22`, `24`, `tablet-compare`) |
| Text (`innerText` của `#root`) khớp trung bình | 96,7 % |
| Kiểm thử hành vi đạt | **30 / 30** |
| Ngoại lệ JavaScript | **0** |

"Lệch pixel" = tỷ lệ điểm ảnh có chênh lệch độ sáng > 32/255 sau khi hai ảnh cùng kích thước.

## 2. Bảng chi tiết 40 trạng thái

| Trạng thái | Kích thước | Lệch pixel | Text khớp |
|---|---|---|---|
| `01-overview` | 1440×2373 | 0.04% | 99.8% |
| `02-quarter2` | 1440×2300 | 0.11% | 98.0% |
| `03-quarter2-month5` | 1440×2263 | 0.11% | 98.0% |
| `04-month5-ytd` | 1440×2336 | 0.11% | 98.0% |
| `05-item-thu-nsnn` | 1440×2336 | 0.17% | 98.4% |
| `06-item-net-total` | 1440×2336 | 0.11% | 99.8% |
| `07-aug-overview` | 1440×2227 | 0.18% | 97.3% |
| `08-trend-modal` | 1440×2227 | 1.02% | 92.3% |
| `09-ranking-growth` | 1440×2227 | 0.42% | 95.8% |
| `10-ranking-stability` | 1440×2227 | 0.06% | 99.8% |
| `11-ranking-modal` | 1440×2227 | 0.82% | 95.0% |
| `12-tax-composition` | 1440×2366 | 0.60% | 95.1% |
| `13-historical-2024` | 1440×1013 | 0.10% | 99.6% |
| `14-historical-district` | 1440×1000 | 0.00% | 99.3% |
| `15-mixed-2025` | 1440×1037 | 0.08% | 98.9% |
| `16-june2025` | 1440×1013 | 0.03% | 98.0% |
| `17-july2025` | 1440×1128 | 0.16% | 98.9% |
| `18-detail-ward` | 1440×1208 | 0.05% | 99.8% |
| `19-no-data` | 1440×1672 | 0.00% | 99.8% |
| `20-invalid-url` | 1440×1174 | 0.18% | 99.8% |
| `21-dismiss-notice` | 1440×1066 | 0.10% | 99.8% |
| `22-compare-empty` | 1440×1000 | 0.00% | 100.0% |
| `23-compare-default` | 1440×1387 | 0.21% | 99.4% |
| `24-compare-draft` | 1440×1387 | 0.00% | 99.8% |
| `25-compare-aug` | 1440×1425 | 0.18% | 98.6% |
| `26-compare-ytd` | 1440×1471 | 0.12% | 99.0% |
| `27-compare-q3` | 1440×1390 | 0.13% | 99.0% |
| `28-detail-hoankiem` | 1440×1146 | 0.40% | 98.0% |
| `29-reset-zoom` | 1440×1146 | 0.40% | 98.0% |
| `30-refresh` | 1440×1146 | 0.48% | 98.0% |
| `31-ranking-expanded` | 1440×1000 | 1.61% | 51.6% |
| `32-composition-expanded` | 1440×1000 | 10.79% | 68.1% |
| `33-compare-same-year` | 1440×1390 | 0.16% | 99.0% |
| `34-compare-annual` | 1440×1409 | 0.09% | 99.4% |
| `mobile-compare` | 390×2414 | 0.25% | 99.4% |
| `mobile-detail` | 390×2432 | 0.13% | 99.8% |
| `mobile-overview` | 512×3704 | 0.32% | 99.0% |
| `tablet-compare` | 1024×1833 | 0.00% | 99.8% |
| `tablet-detail` | 1024×1236 | 0.11% | 99.8% |
| `tablet-overview` | 1024×2339 | 0.48% | 95.7% |

## 3. Giải thích ba trạng thái lệch trên 1 %

**`32-composition-expanded` — 10,79 %.** Bản khảo sát gốc **không thực sự mở rộng** card
`So sánh cơ cấu giữa các địa bàn`: file `states/32-composition-expanded.json` chỉ có 277
dòng, 0 nút `Thu gọn`, 2 nút `Xem thêm` và 5 dòng NSTW — tức đúng bằng trạng thái chưa mở
rộng. Bản clone bấm `Xem thêm 121 phường/xã ▾` và hiện đủ 126 dòng (519 dòng text, 1 nút
`Xem thêm` còn lại, 2 nút `Thu gọn`). Hành vi mở rộng đã được kiểm chứng riêng và đúng;
chênh lệch ở đây là do ảnh tham chiếu, không phải do clone.

**`31-ranking-expanded` — 1,61 % ảnh, 51,6 % text.** Cấu trúc trùng khớp: cả hai đều có
**127 dòng `#`**, 1 nút `Xem thêm`, 2 nút `Thu gọn`, 522 và 521 dòng text. Khác biệt nằm ở
**thứ tự của 122 phường có giá trị 0**. API không bảo đảm tie-break; bản clone giữ đúng thứ
tự trong fixture và không thêm sắp xếp phụ (`Array.prototype.sort` của V8 ổn định), còn ảnh
gốc được chụp từ một lần gọi live khác. `reference-nsnn/README.md` đã cảnh báo trước điểm
này. Cùng nguyên nhân với các chênh lệch nhỏ ở `07`, `09`, `12`.

**`08-trend-modal` — 1,02 %.** Modal dùng `position: fixed` nên không thể nới viewport
trước khi chụp; ảnh phải chụp bằng `fullPage`, mà thao tác này khiến Recharts vẽ lại và
chụp trúng một khung giữa animation. Nội dung modal (tiêu đề, trục, legend, số liệu) trùng
khớp.

## 4. Ba khác biệt nhỏ đã truy nguyên xong

1. **Thứ tự hai dòng bằng nhau trong `/api/by-item`.** Ở `28-detail-hoankiem`, hai dòng
   `Thu NSNN (Đã loại trừ hoàn thuế GTGT)` và `Thu nội địa không kể dầu thô` có **cùng số
   tiền chính xác** `3.040.927.371.668 đ`. Fixture xếp dòng đầu trước; ảnh khảo sát live xếp
   ngược lại. Bản clone render đúng thứ tự fixture, không sắp xếp thêm — theo đúng yêu cầu
   "giữ thứ tự từ fixture".

2. **Điểm ngắt dòng của nhãn trục SVG.** Một số nhãn dài trên trục Y ngắt dòng ở vị trí khác
   ảnh gốc (`Thu nội địa không kể dầu thô` → `Thu nội địa không kể / dầu thô`). Recharts đo
   bề rộng chữ bằng font thực tế; `system-ui` phân giải khác nhau giữa hai máy nên điểm ngắt
   lệch một từ. Không phải khác biệt về mã.

3. **Một dòng thừa ở cuối text của bản gốc.** Hầu hết file `states/*.json` kết thúc bằng một
   token lẻ (`0`, một nhãn trục, một tên chỉ tiêu) không có trong bản clone. Đây là tooltip
   biểu đồ còn hiện lúc chụp — chính `reference-nsnn/README.md` đã lưu ý. Trạng thái duy
   nhất **không có** biểu đồ nào là `22-compare-empty`, và đó cũng là trạng thái khớp text
   **100,0 %**.

## 5. Một lỗi thật đã tìm ra và sửa trong quá trình đối chiếu

Nút `Reset zoom` trong hàng bộ lọc được bọc bởi `<label class="grid gap-1 …">` mà phần tử
con đầu tiên là **U+00A0 (non-breaking space)**, không phải khoảng trắng thường. Khoảng
trắng thường bị bỏ qua khi làm grid item, còn NBSP tạo một dòng lưới thật phía trên nút,
khiến hàng bộ lọc **cao thêm đúng 24px**. Bản dựng đầu tiên dùng khoảng trắng thường nên hai
ảnh mobile lệch 23–24px chiều cao. Sau khi đọc lại byte gốc trong bundle
(`children:[" ", …]`) và sửa thành `{" "}`, toàn bộ 40 ảnh trùng kích thước.

## 6. Danh sách trường hợp đã thử

### 6.1. Ảnh (`npm run verify`) — 40 trạng thái

Overview mặc định · quý 2 · quý 2 + tháng 5 · YTD · cả ba chỉ tiêu · tháng 8/2026 ·
modal xu hướng phóng to · ba mode xếp hạng · modal sparkline một địa bàn · mode Sắc thuế ·
năm 2024 lịch sử · chọn Quận Hoàn Kiếm lịch sử · năm 2025 mixed · tháng 6/2025 · tháng
7/2025 · Chi tiết có ward · kỳ không có số liệu (12/2026) · URL sai · đóng cảnh báo ·
Compare chưa chọn ward · Compare mặc định · Compare draft · tháng 8 · YTD · quý 3 · hai kỳ
cùng năm · kỳ cả năm · Chi tiết Hoàn Kiếm · Reset zoom · Tải lại dữ liệu · mở rộng xếp hạng ·
mở rộng cơ cấu · và cả ba tab ở 1024×900 và 390×844.

### 6.2. Hành vi (`npm run interactions`) — 30 phép kiểm

Tất cả đều đạt:

- `tab=overview` mở đúng tab Overview; 9 card đúng thứ tự.
- Chọn Quý 2 → Tháng chỉ còn 4/5/6; đổi quý xoá tháng đang chọn.
- Chọn tháng trong quý giữ **cả** `quarter` lẫn `month` trên URL.
- `Loại kỳ` ghi `acc`; cả ba `Chỉ tiêu` ghi đúng slug `tong-so` / `thu-nsnn` /
  `tong-so-tru-hoan-thue`.
- Tháng 6/2025 đổi danh mục sang **31 option** (30 quận/huyện + tổng quan); tháng 7/2025 quay
  về **127 option** (126 phường/xã + tổng quan).
- Click dòng Top địa bàn → chuyển sang tab `Chi tiết địa bàn` và ghi đúng slug ward lên URL.
- Chọn ward bằng dropdown **không** tự chuyển tab; Overview vẫn hiện số toàn thành phố
  (532,48 nghìn tỷ) dù đã chọn ward.
- Reload giữ nguyên URL và tab.
- Đổi ba filter liên tiếp **không** tạo thêm history entry (`history.replaceState`).
- URL sai tạo banner `Đã bỏ qua 6 tham số`, URL được dọn về
  `?year=2026&month=8&acc=PERIOD&item=tong-so&tab=detail`, và đóng được banner.
- Compare: đổi select Kỳ A **không** đổi heading và **không** đổi `cmpa` cho tới khi bấm
  `So sánh`; bấm rồi mới commit `cmpa=2025m5`.
- Compare chưa chọn ward: ẩn `Địa bàn` khỏi hàng filter, ẩn Năm/Quý/Tháng và Reset zoom.
- Click một vùng trên bản đồ chọn được ward; `Reset zoom` **không** xoá ward đang chọn.
- `Tải lại dữ liệu` giữ nguyên URL.
- Không có ngoại lệ JavaScript trong toàn bộ luồng.

## 7. Chưa xác minh / giới hạn

- **Chưa kiểm toán tính đúng nghiệp vụ của số tiền.** Đây là replay fixture; không đối chiếu
  với sổ sách gốc.
- **Chưa thử mọi tổ hợp** của 126 địa bàn × 3 năm × quý/tháng × 3 chỉ tiêu. 41 tổ hợp gặp
  trong lúc chạy kiểm thử chưa có fixture và trả 502 — UI hiện đúng trạng thái lỗi của bản
  gốc. Bật `NSNN_PROXY=1` nếu cần chạy thật.
- **Thao tác chuột trên bản đồ** mới kiểm chứng phần click chọn vùng và Reset zoom bằng
  script. Kéo để pan và Ctrl+wheel để zoom dùng đúng cấu hình `d3-zoom` của bản gốc
  (`scaleExtent([1,12])`, filter chỉ nhận wheel khi có Ctrl) nhưng chưa mô phỏng bằng thao
  tác chuột thật.
- **Chưa kiểm thử tải, ghi dữ liệu hay bảo mật.**
- Ảnh so sánh có thể lệch nhẹ theo phiên bản Chrome và cách phân giải font `system-ui`.
