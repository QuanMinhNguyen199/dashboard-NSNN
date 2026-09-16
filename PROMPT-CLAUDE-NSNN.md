# Prompt giao cho Claude Code — tái tạo nguyên trạng dashboard NSNN

> **Tài liệu lịch sử của giai đoạn clone website ba tab.** Không dùng prompt này để sửa
> prototype bốn workspace hiện tại. Yêu cầu đang triển khai nằm trong
> [`THIET-KE-DASHBOARD-NSNN.md`](tai-lieu-luu-tru/nsnn/THIET-KE-DASHBOARD-NSNN.md), còn nghiệp vụ nằm trong
> [`BA-NSNN.md`](tai-lieu-luu-tru/nsnn/BA-NSNN.md).

Sao chép toàn bộ nội dung bên dưới vào Claude Code. Đặt thư mục `reference-nsnn/` cạnh prompt, hoặc cho Claude quyền đọc workspace hiện tại. Bản bổ sung này đã đối chiếu HTML và Markdown, với `dac-ta-v2.html` là đặc tả nghiệp vụ mới nhất.

---

Bạn là frontend engineer. Hãy CODE VÀ CHẠY một prototype của website này, giống giao diện và tương tác hiện tại:

https://dev-nsnn.thehegeo.com/?year=2026&acc=PERIOD&item=tong-so&tab=overview

## 0. Đọc tài liệu và xác định đúng vai trò nguồn

Trước khi code, đọc cả HTML lẫn Markdown, không chỉ xem ảnh website:

1. `dac-ta-v2.html`: bản đặc tả **mới nhất**. Đọc nội dung tài liệu, bảng, sơ đồ và ghi chú; CSS của bản xuất tài liệu không phải CSS dashboard.
2. `update_dac-ta-89_tham-khaor.html`: phản hồi bên thuế và đặc tả trước v2; chỉ dùng phần không bị v2 thay thế.
3. `phan-tich.md`: mục tiêu và phân cấp nguồn thu/khoản thu/sắc thuế/địa bàn/doanh nghiệp.
4. `index.html`: đọc cả HTML/CSS và JavaScript để hiểu prototype một trang, bộ lọc phụ thuộc, drill-down và dữ liệu mô phỏng. Không bỏ qua file này chỉ vì UI khác website.
5. `reference-nsnn/DOI-CHIEU-DAC-TA-V2.md`: tổng hợp chi tiết, mapping mã, khác biệt và các điểm v2 chưa đủ rõ.

Trong gói di chuyển sang máy khác, bản sao bốn tài liệu nằm ở `reference-nsnn/documents/`. Trong workspace gốc, ưu tiên bản mới nhất ở thư mục gốc nếu đã được người dùng cập nhật; không sửa các file nguồn này.

**Hai nguyên tắc phải đồng thời rõ ràng:**

- Để hiểu nghiệp vụ mục tiêu: v2 ưu tiên hơn bản 8/9, tài liệu phân tích và logic mô phỏng của `index.html`.
- Để thực hiện yêu cầu hiện tại “prototype y hệt, không thay đổi UI”: giữ giao diện/hành vi website theo các mục 1–10. Đặc tả v2 có 4 tab, trong khi web có 3 tab; không tự thêm tab/filter/KPI để trộn hai phiên bản. Những khác biệt làm thay đổi kết quả hiển thị hoặc tương tác phải ghi trong `SPEC-GAPS.md`, không âm thầm áp dụng vào bản clone.

Không kết luận “web hiện tại đã đúng v2” khi thấy cùng tên một widget. Nếu sau này người dùng yêu cầu triển khai đủ v2 thì thay phạm vi và viết lại những mục mâu thuẫn; ở lượt này không tạo app v2 thứ hai, không thêm switch legacy/v2.

## 1. Yêu cầu quan trọng nhất: giữ nguyên UI

Đây là công việc tái tạo nguyên trạng, không phải redesign. Tôi yêu cầu KHÔNG THAY ĐỔI GÌ Ở UI.

- Giữ chính xác layout, thứ tự các khối, kích thước, khoảng cách, font, màu, border, radius, đường biểu đồ, bản đồ, copy, dropdown native, tooltip, popup và trạng thái active/loading/empty/error.
- Giữ tên tab `Overview`, `Chi tiết địa bàn`, `So sánh hai kỳ`. Không dịch Overview, Reset zoom hay Waterfall.
- Không thêm sidebar, logo, menu, dark mode, trang đăng nhập, icon trang trí, gradient, shadow cho card thường, bộ lọc dạng chip, bảng dữ liệu mới, nút export hoặc chức năng sản phẩm khác.
- Không đổi biểu đồ thành loại khác. Các danh sách thanh ngang mảnh vẫn là danh sách thanh ngang mảnh; không thay bằng pie/treemap/table theo tên API.
- Không áp dụng một design system có style mặc định làm lệch bản gốc. Không “beautify”, “polish”, tự sửa responsive hoặc các bất nhất nghiệp vụ đã thấy.
- Tạo thư mục `prototype-nsnn/` riêng. Không ghi đè `index.html` đang có ở workspace. Dùng file đó và đặc tả để hiểu nghiệp vụ/luồng dữ liệu theo mục 0 và 11; nguồn hình thức giao diện của bản clone vẫn là website đã khảo sát.
- Không dùng ảnh chụp cả trang làm giao diện và không nhúng nguyên website bằng iframe. Prototype phải có các phần tử và thao tác thật.
- Chủ động làm đến khi chạy được, không dừng ở kế hoạch hay hỏi lại các chi tiết đã có trong bộ tham chiếu. Không deploy.

## 2. Nguồn sự thật và cách đọc

Tôi đã khảo sát trực tiếp website và cung cấp `reference-nsnn/`:

1. `assets/index-C1Ij_FY5.css`: CSS thật của website; dùng lại được. Đây là nguồn chính xác cho style, bao gồm breakpoint và reset CSS.
2. `assets/index-BaEmXFk_.js`: bundle công khai của bản được khảo sát, để đối chiếu hành vi/hiển thị.
3. `assets/app-readable.js`: cùng bundle đã format, KHÔNG phải source TypeScript gốc.
4. `app-excerpts.txt`: các đoạn code ứng dụng được trích ra, gồm filter, URL, bản đồ, KPI, các tab, chart và modal. Các tên hàm bị minify nhưng logic/className vẫn đọc được.
5. `screenshots/`: ảnh các trạng thái desktop; các ảnh có tiền tố mobile/tablet nếu có dùng để đối chiếu kích thước tương ứng.
6. `states/`: URL, toàn bộ text, các option/value/label/disabled của select, danh sách nút, tiêu đề và token màu đã đọc từ DOM. `states/index.json` là mục lục các trạng thái khảo sát.
7. `api/manifest.json`: ánh xạ URL API → file JSON phản hồi thật. Không đoán ý nghĩa filename hash. Các file API là mẫu cho những request đã khảo sát, không phải toàn bộ cơ sở dữ liệu.
8. `data/hanoi_126_wards.geojson` và `data/hanoi_30_districts_pre_2025.geojson`: ranh giới thật, bắt buộc dùng cho bản đồ.
9. `live.html`: HTML entry của website tham chiếu.
10. `DOI-CHIEU-DAC-TA-V2.md` và `documents/`: tài liệu nghiệp vụ mới nhất, bản cũ, prototype HTML và bản trích nội dung dễ đọc. Dùng để hiểu nguồn dữ liệu và ghi nhận khác biệt, không coi ảnh website là tài liệu thay thế v2.

Sau khi đọc tài liệu ở mục 0, đọc mục lục, CSS và các đoạn ứng dụng; mở ảnh desktop Overview, Detail, Compare, modal và địa bàn lịch sử rồi mới code. Với hình thức/hành vi của bản clone, ưu tiên CSS/DOM/bundle và ảnh cùng trạng thái. Với định nghĩa nghiệp vụ mục tiêu, ưu tiên v2; ghi khác biệt thay vì sửa UI hoặc fixture. Không tự suy diễn thêm hành vi.

Website có thể thay đổi dữ liệu sau thời điểm lưu mẫu. Khi so ảnh, dùng phản hồi API đã lưu của đúng URL để cố định dữ liệu. Nếu có một nhóm phường cùng giá trị 0, giữ thứ tự từ fixture; không tự thêm sắp xếp phụ khiến ảnh khác.

## 3. Công nghệ và dữ liệu

- Dùng React + TypeScript + Vite, Recharts cho biểu đồ, D3 geo/zoom cho bản đồ SVG và Radix Tabs/Dialog hoặc tương đương giữ đúng behavior. Website tham chiếu dùng các cấu trúc này; không thay thư viện chart tùy tiện.
- Có thể tái sử dụng trực tiếp CSS và tài nguyên công khai đã cung cấp để đạt độ giống cao. Viết các component ứng dụng có thể đọc/chỉnh sửa; bundle đã lưu là tài liệu đối chiếu hành vi, không được coi là source gốc có sẵn.
- Chạy local bằng `npm install`, `npm run dev`; build được bằng `npm run build`.
- Dữ liệu: ưu tiên replay fixture theo đường dẫn + query được chuẩn hóa. Bỏ query rỗng, sort key; giữ chính xác giá trị UTF-8, `ward` là mã 5 chữ số trong request API. Dùng manifest để tìm payload.
- Với request chưa có fixture, dùng proxy phía dev server tới `https://dev-nsnn.thehegeo.com/api/...`, có thể cache lại. Không gọi cross-origin trực tiếp từ browser nếu CORS chặn. Không tự chế số liệu hoặc trả cùng một fixture cho mọi filter.
- Những trạng thái đã có fixture phải chạy được khi API gốc tạm thời không truy cập được. Nếu tổ hợp chưa có fixture và không lấy được API, thể hiện đúng trạng thái lỗi của bản gốc; nói rõ giới hạn trong README, không thêm thông báo kỹ thuật mới vào UI.
- Dùng dữ liệu có sẵn trong `/api/periods`, `/api/wards` để dựng danh mục, không hardcode vài địa bàn mẫu.

Các API đã xác định: `/api/wards`, `/api/periods`, `/api/kpi-compare`, `/api/by-ward`, `/api/by-item`, `/api/by-scope`, `/api/trend`, `/api/heatmap`, `/api/waterfall`, `/api/treemap`, `/api/by-ward-scope`, `/api/by-ward-item`, `/api/corrections`.

Tham số thường gặp: `year`, `quarter`, `month`, `acc`, `item`, `ward`. Không giả định mọi endpoint phản ứng với filter giống nhau; làm theo request và logic trong `app-excerpts.txt`.

## 4. Style chính xác

Font body: `system-ui, -apple-system, "Segoe UI", sans-serif`. Không tải Be Vietnam Pro, Inter, IBM Plex hay font khác để thay thế.

```css
:root {
  --bg: #F2F4F7;
  --card: #fff;
  --ink: #1a2233;
  --muted: #6b7488;
  --line: #dfe3ee;
  --accent: #2b5cd9;
  --nodata: #e7e9ef;
  --data-main: #1d4fa3;
  --data-sub: #7fb0e6;
  --data-sub-bg: #e8f0fb;
  --data-cmp: #d9770b;
  --up: #187a3c;
  --down: #c0392b;
  --m1: #dc2626;
  --m2: #f97316;
  --m3: #eab308;
  --m4: #84cc16;
  --m5: #16a34a;
}
```

- Header trắng, border dưới 1px, padding ngang 20px/dọc 14px. H1: `Thu NSNN Hà Nội theo phường/xã`, 20px, semibold, không icon.
- Vùng dưới header: `grid gap-4 p-4 md:p-5`, full width, không giới hạn max-width toàn trang.
- Card thường: nền trắng, border `--line` 1px, radius 8px, padding 16px, không shadow.
- Tiêu đề card: 13.6px, uppercase, tracking-wide, màu muted; hàng title cách nội dung 10px.
- Hàng filter: `flex flex-wrap items-end gap-3`, padding 12px, nền trắng, border, radius 8px.
- Label filter 12.48px, màu muted, `grid gap-1`. Select native: font 14px, padding 8px ngang/6px dọc, border 1px, radius 5.6px. Chiều rộng theo nội dung như ảnh, không chia đều sáu cột.
- Tab: flex gap 6px, margin-bottom 16px; padding 16px ngang/8px dọc; font 13.6px semibold; border 1px, border-bottom 2px, radius trên 8px. Active: text và border-bottom màu data-main, nền bg; inactive nền trắng/text muted.
- KPI: grid 2 cột, từ 768px là 4 cột; gap 12px; padding card 14px; số chính 24px semibold; label 12px uppercase; dòng phụ 12.16px.
- Breakpoint theo CSS gốc: sm 640px, md 768px, lg 1024px, xl 1280px. Riêng số dòng Top dùng breakpoint 1100px: trên 1100px tối đa 10 dòng, còn lại 5 dòng.
- Giữ đúng text truncation, wrap, overflow và chiều cao card hiện tại. Không sửa lỗi tràn ngang đã có nếu mục tiêu là giống nguyên trạng.

## 5. Filter chung và URL

### Hai tab Overview / Chi tiết địa bàn

Thứ tự: Năm → Quý → Tháng → Loại kỳ → Chỉ tiêu → Địa bàn → Tải lại dữ liệu → Reset zoom.

- Năm: các năm của danh mục, giảm dần; snapshot hiện có 2026, 2025, 2024. Nếu không có năm trên URL, chọn năm lớn nhất.
- Quý: `Tất cả quý`, `Quý 1`…`Quý 4`, lấy theo danh mục năm. Đây là kỳ quý từ nguồn, không tự cộng ba tháng.
- Tháng: `Tất cả tháng` và các tháng hợp lệ của năm/quý. Nếu chọn quý 2 chỉ có tháng 4, 5, 6.
- Đổi quý luôn xóa tháng đang chọn. Chọn tháng trong quý giữ cả hai query `quarter` và `month`.
- Đổi năm giữ quý/tháng nếu hợp lệ ở năm mới, nếu không thì xóa. Qua ranh giới lịch sử/hiện tại sẽ xóa địa bàn được chọn.
- Loại kỳ: `Thực hiện trong kỳ` → `PERIOD`; `Luỹ kế từ đầu năm` → `YTD`.
- Chỉ tiêu gồm đúng 3 lựa chọn:
  - `TỔNG SỐ` → URL `tong-so`, API `TỔNG SỐ`.
  - `THU NGÂN SÁCH NHÀ NƯỚC` → URL `thu-nsnn`, API cùng chuỗi tiếng Việt.
  - `TỔNG SỐ (trừ hoàn thuế GTGT)` → URL `tong-so-tru-hoan-thue`, API `TỔNG SỐ (Đã loại trừ hoàn thuế GTGT)`.
- Địa bàn hiện tại: option đầu `— Tổng quan toàn thành phố —`, sau đó đủ 126 phường/xã, sort tên bằng locale Việt Nam. Không thêm ô search vào native select.
- Chọn phường bằng dropdown giữ tab hiện tại; không tự chuyển Detail. Riêng click dòng Top địa bàn ở Overview chuyển sang Detail và chọn phường.
- Tải lại dữ liệu xóa cache phản hồi đã hoàn thành và refetch; giữ filter/tab. Reset zoom chỉ đưa bản đồ về transform ban đầu, không reset filter hay địa bàn.

### Nhánh địa giới lịch sử

- Năm 2024: historical; năm 2026: current.
- Năm 2025 tháng 1–6 hoặc quý 1–2: historical; tháng 7–12 hoặc quý 3–4: current.
- Cả năm 2025: mixed. Bản đồ hiện ranh giới 126 phường/xã dạng preview, không tô thu theo dữ liệu và không hiện legend màu thu.
- Historical: dropdown đổi sang 30 quận/huyện cũ có tiền tố Quận/Huyện/Thị xã, sắp theo tên; dùng danh mục `zf` trong bundle và GeoJSON lịch sử.
- Chọn một quận/huyện chuyển sang Detail. Bên trái chỉ có card tên quận/huyện và câu `Đang xem ranh giới quận/huyện. Chưa có dữ liệu thu theo đơn vị lịch sử này.`; bên phải bản đồ lịch sử; không tự tạo KPI quận/huyện.
- Tab Compare luôn dùng danh mục phường/xã hiện tại, không đổi thành so sánh quận/huyện cũ.

### Đồng bộ đường dẫn

- Query: `year`, `quarter`, `month`, `acc`, `item`, `ward`, `district`, `tab`, `cmpa`, `cmpb`.
- Tab nhận `overview|detail|compare`; URL không truyền tab thì bản gốc mặc định `detail`. URL mục tiêu của nhiệm vụ truyền `overview`, phải mở đúng Overview.
- `ward` xuất ra slug nối bằng dấu `-`, ví dụ `hoan-kiem`; API nhận `00070`. `district=hoan-kiem` là đơn vị lịch sử, khác với ward.
- Dùng `history.replaceState` như bản gốc, không thêm một history entry cho mỗi filter. Reload/đường dẫn chia sẻ phải khôi phục trạng thái.
- `cmpa/cmpb`: `2025m8`, `2026q3`, `2024y`.
- Parser hỗ trợ ward bằng mã 5 chữ số hoặc slug; `location` là alias khi không có ward. Nếu cùng có cả hai thì ward thắng và cảnh báo location bị bỏ qua.
- URL sai tạo banner amber với `Đã bỏ qua ... tham số trên đường dẫn`, lý do và dòng `Đang hiển thị: ...`, nút × có aria-label `Đóng cảnh báo`. Có thể đóng banner.
- Chấp nhận quarter `1` hoặc `q1`, month `08` hoặc `8`, acc không phân biệt hoa thường. Quarter và month xung đột thì giữ month/bỏ quarter và cảnh báo. Tên tham số sai hoặc lặp phải xử lý như parser trong bundle, không dùng browser alert.

## 6. Tab Overview — đúng thứ tự và phạm vi

Overview hiển thị toàn thành phố dù dropdown giữ một ward. Những API scope overview bỏ ward. Đừng biến Overview thành bản Detail khi chọn phường.

1. Bốn KPI: `TỔNG SỐ`; `THU NSNN (THU THUẦN)`; `TỶ TRỌNG THU THUẦN`; `LUỸ KẾ TỪ ĐẦU NĂM (YTD)`.
2. Card `XU HƯỚNG THEO THÁNG` rộng toàn hàng.
3. Grid 2 cột từ sm: `TOP ĐỊA BÀN` | `TOP CHỈ TIÊU (TOÀN TP)`.
4. Trong cùng grid: `THEO CẤP NGÂN SÁCH` | `CƠ CẤU THU NSNN`.
5. Grid tiếp: `WATERFALL — BIẾN ĐỘNG THU NSNN SO KỲ TRƯỚC` | `XẾP HẠNG 126 PHƯỜNG/XÃ THEO THÁNG`.
6. Card full width `SO SÁNH CƠ CẤU GIỮA CÁC ĐỊA BÀN`.
7. Card full width `ĐÍNH CHÍNH SỐ LIỆU`.

KPI không phải bốn ô cùng đổi tên theo chỉ tiêu: bản gốc lấy Tổng số/Thu NSNN ở PERIOD và Tổng số YTD theo code riêng. Giữ đúng logic trong hàm `aR`, không sửa thành cách tính mới.

Biểu đồ xu hướng:
- Recharts LineChart, đường monotone; PERIOD xanh liền, YTD cam nét `5 4`; stroke 2.5px, dot radius 3.5; grid nét `3 3`; trục tháng `01/2026`…`12/2026`.
- Chiều cao chart trong card 240px, trong modal 460px; trục Y rộng 70px; legend bên dưới là chấm tròn và text như ảnh.
- Hover có tooltip số tiền. Click chart mở modal phóng to. Modal ở giữa màn hình, rộng min(92vw,64rem), max-height 90vh, nền trắng, border/radius 8px, padding 20px, backdrop đen 40%, shadow-xl; nút ✕ góc phải. Đóng bằng ✕, Escape hoặc backdrop.
- Thiếu đủ điểm thì hiện `Cần ≥ 2 kỳ để vẽ xu hướng -- kỳ hiện có: ...`.

Top địa bàn/chỉ tiêu và cơ cấu thu:
- Tên trái, số tiền phải; thanh nền xanh rất nhạt cao 4px, phần giá trị xanh nhạt; khoảng cách dòng 8px. Tên dài truncate, hover title có tên đầy đủ.
- Cơ cấu thu NSNN có dòng `Cha: THU NGÂN SÁCH NHÀ NƯỚC — tổng ...`; liệt kê con và tỷ trọng, gồm `Khác (chênh lệch nhỏ, chưa phân loại)` khi dữ liệu trả về. Dù endpoint tên treemap, không vẽ treemap.
- Theo cấp ngân sách: giữ nguyên empty state theo fixture. Nếu payload đủ điều kiện như code gốc thì hiện donut NSTW/NSĐP có thể phóng to và danh sách `Trong đó ngân sách địa phương`.
- Waterfall là các thanh ngang tăng/giảm, đường mốc 0 và `Tổng biến động: ...`; chưa có kỳ trước thì dùng đúng câu `Cần ≥ 2 kỳ liên tiếp để so sánh -- kỳ đang chọn chưa có kỳ liền trước.`

Xếp hạng 126 phường/xã theo tháng:
- 3 nút `Theo tổng số`, `Theo tăng trưởng %`, `Theo độ ổn định`; active nền xanh/chữ trắng.
- Dòng thông tin số phường và số tháng đã nạp. Mỗi dòng có #hạng, tên, sparkline 220×52, tăng trưởng hoặc ±độ ổn định, số tiền và tỷ trọng.
- Mặc định 5 dòng; `Xem thêm N phường/xã ▾` mở toàn bộ, `Thu gọn ▴` thu lại. Đổi mode hoặc dữ liệu sẽ thu gọn.
- Sort total theo giá trị cuối chuỗi, growth theo delta, stability theo hệ số biến thiên, đúng hàm `zie`/`Lie`; không âm thầm thay bằng logic mới.
- Click dòng mở modal `[Tên địa bàn] — xu hướng theo tháng`, rộng min(92vw,50rem), chart 380px; nút Đóng/Escape/backdrop. Dữ liệu thiếu có câu về đường bị ngắt.

So sánh cơ cấu:
- 2 mode `Cấp ngân sách` / `Sắc thuế`.
- Cấp ngân sách: tên, thanh stacked NSTW xanh/NSĐP cam, phần trăm ở bên phải; ban đầu 5 địa bàn, xem thêm/thu gọn.
- Sắc thuế: grid 1/2/3 cột theo breakpoint, mỗi địa bàn là nhóm tên + thanh cơ cấu con như code; không thay bằng một bảng mới.
- Đính chính có danh sách địa bàn/chỉ tiêu, số cũ → số mới, version; empty copy đúng fixture.

## 7. Tab Chi tiết địa bàn

- Không chọn ward: cùng 4 KPI; phía dưới grid `lg:grid-cols-[1.25fr_1fr]`.
- Cột trái là grid `sm:grid-cols-2`: Xếp hạng, Xu hướng theo tháng, Theo cấp ngân sách, Top chỉ tiêu (toàn TP).
- Cột phải là card bản đồ; sticky từ lg, top 16px. Không chuyển bản đồ lên header hoặc làm full background.
- Có ward: Xếp hạng hiển thị số hạng lớn 3.4rem, `/ N phường/xã`, số tiền màu xanh. Thêm card `Chi tiết địa bàn` với Địa bàn, Mã, chỉ tiêu đang chọn, Chính xác và Cơ cấu thu. Card này max-height 22rem, scroll-y.
- Thứ tự cột trái khi có ward: Xếp hạng | Chi tiết địa bàn; Theo cấp ngân sách | Xu hướng theo tháng; Top chỉ tiêu của ward.
- Chọn một địa bàn chưa có dữ liệu vẫn giữ selection, card chi tiết ghi `Địa bàn này chưa có số liệu trong kỳ đã chọn.`

Bản đồ:
- SVG từ đúng 2 GeoJSON, viewBox 800×800, projection fitSize, không Leaflet/Google tiles, không dùng ảnh giả hoặc polygon tự vẽ gần giống.
- Năm hiện tại: tô 5 bậc từ đỏ → cam → vàng → xanh lá nhạt → xanh lá; chia theo tỷ lệ trên max như hàm k6, không đổi thành quantile.
- Không dữ liệu màu #e7e9ef; stroke trắng 0.7. Selected ward đưa lên trên và viền ink.
- Hover tooltip tối, tên và số tiền; selection tự zoom vào bounds, scale tối đa 12, transition khoảng 500ms. Tooltip của selection giữ lại sau mouseleave.
- Click vùng có dữ liệu chọn ward tương ứng. Kéo để pan; Ctrl+wheel để zoom; wheel thường tiếp tục cuộn trang. Reset zoom về identity khoảng 400ms và giữ ward.
- Legend đúng thứ tự/nhãn `Thấp`, `Trung bình`, `Cao`, một bậc không có chữ, `Rất cao`, `chưa có số liệu`. Không tự bổ sung nhãn còn trống.
- Hiện `© OpenStreetMap contributors (ODbL).` với bản đồ phường/xã. Historical/mixed ẩn legend thu và dùng tooltip ranh giới như bundle.

## 8. Tab So sánh hai kỳ

Filter đầu trang khác:
- Ẩn Năm/Quý/Tháng và Reset zoom.
- Giữ Loại kỳ, Chỉ tiêu, Tải lại dữ liệu.
- Chưa có ward: ẩn Địa bàn trên hàng filter, bên dưới tabs hiện card max-width 42rem: `Chọn một phường/xã để bắt đầu so sánh`, câu giải thích cùng một địa bàn và dropdown `— Chọn phường/xã —`.
- Có ward: Địa bàn trở lại trên hàng filter. So sánh luôn CÙNG MỘT phường/xã qua hai kỳ, không hai phường cạnh nhau.

Sau khi chọn ward:
1. Heading `[TÊN ĐỊA BÀN IN HOA] — [Kỳ A] vs [Kỳ B]`.
2. Card chọn Kỳ A, Kỳ B và nút xanh `So sánh`.
3. Thông báo độ phủ nếu hai kỳ khác số phường báo cáo.
4. Card KPI A → B và Chênh lệch/thứ hạng.
5. Grid 2 cột chỉ từ xl 1280px: `Theo chỉ tiêu` và `Theo cấp ngân sách`.
6. Card `Diễn biến 12 tháng — [năm A] và [năm B]`.

Kỳ A và B mỗi bên có hai select: năm giảm dần và kỳ trong năm. Kỳ có Cả năm nếu danh mục có YEAR, optgroup Theo quý (4→1), Theo tháng (12→1). Năm 2026 trong snapshot không có option Cả năm ở dropdown so sánh, không tự thêm.

- Bộ chọn A/B là draft; đổi select chưa đổi heading, biểu đồ hoặc URL. Bấm So sánh mới commit `cmpa/cmpb` và request.
- Đổi năm cố giữ loại kỳ nếu tồn tại, nếu không fallback lần lượt cả năm/quý đầu danh sách/tháng đầu danh sách theo code.
- Đổi loại kỳ hoặc chỉ tiêu toàn cục cập nhật dữ liệu của hai kỳ đã commit ngay.
- Giá trị mặc định tham khảo hàm `kz`: chọn kỳ theo danh mục/độ phủ và ngày hiện tại, ưu tiên cùng kỳ năm trước. Ở snapshot 10/09/2026, UI đã chọn tháng 9/2025 và tháng 9/2026. Các ca kiểm thử cần URL cmpa/cmpb tường minh để không lệch theo ngày máy.
- Cùng năm chỉ hiện một đường xu hướng và legend `Năm ... (cả hai kỳ)`.
- Chart ngang hai chuỗi: xanh A/cam B, chiều cao max(220, số dòng×44), trục label rộng 210px, tên biểu đồ dài rút gọn 40 ký tự; các dòng bên dưới có delta, %, tỷ trọng và điểm phần trăm. Giữ nguyên hai đoạn giải thích dài bên dưới chart.
- Chart 12 tháng cao 280px, trục T1…T12, vùng tô cho khoảng tháng/quý/năm đã chọn; cùng khoảng chỉ một vùng. Giữ legend nét liền/nét đứt và câu giải thích loại kỳ.
- Giữ warning số địa bàn khác nhau và cảnh báo tham khảo thứ hạng như bản gốc. Các nhãn `chưa có số liệu`, `—`, `chưa so được thứ hạng` lấy đúng trạng thái.

## 9. Trạng thái và những điểm phải giữ nguyên

- Loading từng card: khung trắng border, min-height 112px, padding 16px, `Đang tải dữ liệu…`. Có spinner tài nguyên cố định góc trên phải khi tải danh mục/bản đồ như bản gốc.
- Lỗi card: `Không tải được dữ liệu. Thử lại` với nút underline. Lỗi danh mục có banner và `Tải lại danh mục`. Lỗi bản đồ dùng đúng câu trong bundle.
- Không dữ liệu/độ phủ thiếu: giữ banner amber, cả vị trí trước tabs và copy theo trạng thái. Danh mục vẫn đầy đủ dù kỳ chưa có số liệu.
- Tiền: ≥10^12 dùng `nghìn tỷ` tối đa 2 số lẻ; ≥10^9 dùng `tỷ` tối đa 1 số lẻ; ≥10^6 dùng `triệu` tối đa 1 số lẻ; locale vi-VN. Số chính xác dùng số nguyên phân nhóm `.` và hậu tố ` đ`.
- Không đồng nhất cách viết phần trăm nếu bản gốc khác nhau: một số vị trí `.toFixed(1)` có dấu chấm, KPI compare có định dạng riêng.
- Giữ các bất nhất đã quan sát: bảng 126 phường đếm 127/mã Kho bạc; một số dòng 0; YTD thẻ và đường biểu đồ khác nhau; khối cấp ngân sách trống; thiếu số liệu nhưng bảng so sánh còn -100%. Không sửa chúng trong nhiệm vụ clone, không thêm banner “đã sửa lỗi”. Ghi nhận trong README nếu cần.

## 10. Kiểm chứng trước khi giao

Chạy prototype, thao tác và chụp ảnh đối chiếu ở cùng viewport 1440×1000. Thêm 1024×900 và 390×844 để xác nhận breakpoint gốc. Chờ dữ liệu/animation ổn định; đừng so một trang đang loading với trang đã tải.

Tối thiểu phải đi qua:

1. URL Overview ban đầu, 4 KPI và tất cả card đúng thứ tự.
2. Quý 2 → chỉ có tháng 4/5/6 → tháng 5; chuyển YTD; thử đủ 3 chỉ tiêu.
3. Đổi quý xóa tháng; đổi năm; chuyển qua tháng 6/2025 và 7/2025 đổi danh mục địa bàn.
4. Cả năm 2025 mixed; năm 2024; chọn Quận Hoàn Kiếm lịch sử.
5. Overview tháng 8/2026; click Top địa bàn sang Detail; chọn bằng dropdown, bản đồ; Reset zoom và Tải lại dữ liệu.
6. Popup xu hướng lớn; popup sparkline; 3 mode xếp hạng, Xem thêm/Thu gọn; 2 mode cơ cấu và mở rộng.
7. Compare chưa chọn ward; chọn Hoàn Kiếm; draft A/B không cập nhật trước khi bấm So sánh.
8. Tháng 8/2025 vs 8/2026; tháng 9 thiếu dữ liệu; quý 3; YTD; hai kỳ cùng năm; kỳ cả năm hợp lệ.
9. Query sai → banner → đóng banner; reload giữ URL/state.
10. Trạng thái mobile của cả ba tab, chart/modal và bản đồ như reference; không tự thay layout để “đẹp hơn”.

So ảnh và sửa sai lệch so với bản gốc, không sửa bản gốc theo ý bạn. Mỗi filter/nút phải hoạt động thật; không chỉ thay label. Kiểm tra build và console. Nếu còn chức năng chưa xác minh hoặc query chưa có fixture, ghi rõ thay vì tuyên bố đã giống 100%.

## 11. Kiến thức nghiệp vụ bổ sung bắt buộc khi đọc/code

### 11.1. Danh mục và đơn vị

- Phân cấp: Thu NSNN → nguồn I–VIII → khoản thu → sắc thuế/loại thu. Khoản thu, sắc thuế và doanh nghiệp là các khái niệm khác nhau, không dùng tên chung `tax` cho mọi cấp.
- Nguồn: I Nội địa; II Dầu thô; III XNK; IV Viện trợ; V Huy động/đóng góp; VI Thu hồi cho vay/quỹ dự trữ; VII Tạm thu; VIII Các khoản thu NSNN không có trong công thức.
- Theo v2, `Thu khác = IV + V + VI + VII + VIII`, đủ **5** nguồn. Câu “sum 4 mục” ở bản cũ không còn là định nghĩa đúng.
- V2 có đúng **21 khoản nội địa**: `1.1, 1.2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20`. Không cộng thêm chỉ tiêu cha `1` bên cạnh hai con `1.1`/`1.2`.
- Ba nhóm: SXKD = `1.1+1.2+2+3`; Nhà đất = `8+9+10+11+12`; Phí/lệ phí/khác = `4+5+6+7+13+14+15+16+17+18+19+20`. Chi tiết tên từng mã có trong tài liệu đối chiếu.
- SXKD có 4 khối: DN trung ương, DN địa phương, FDI, ngoài quốc doanh. Mỗi khối phân rã 5 sắc thuế gốc và phần dư `Thu khác` dẫn xuất. Đừng sao chép mô hình DNNN gộp hoặc tỷ lệ sắc thuế giả của `index.html` làm chuẩn v2.
- Mã chỉ tiêu phải có đường dẫn cha, ví dụ `I.1.1` khác `III.1.1`. Không dùng một map toàn cục chỉ khóa bằng `1.1`.
- Số tiền của API web tính bằng **đồng**; `val`, `dt`, `m`, `mp` trong `index.html` tính bằng **tỷ đồng**. Khai báo đơn vị tại ranh giới adapter, không trộn rồi format chung. Mốc sai lệch 1.000 đồng trong v2 không phải 1.000 tỷ đồng.
- Mã `w0` trong HTML mô phỏng không phải mã hành chính `00070` của API; chỉ ánh xạ qua danh mục có nguồn gốc rõ ràng, không theo vị trí index.

### 11.2. Phép tính mục tiêu theo v2 — không tự ghi đè phép tính của clone

- Một hàm chung xác định cùng kỳ N−1 cho tháng/quý và PERIOD/YTD. YoY là mặc định theo phản hồi bên thuế và v2, còn MoM là tùy chọn phụ Tab 4. Với clone vẫn render delta gốc, không đổi một con số MoM thành YoY mà giữ nhãn cũ.
- Phân biệt `0 = đã nạp, không phát sinh` và `null = chưa có dữ liệu`. Không đổi dữ liệu thiếu thành 0, không tạo năm trước bằng một phần trăm giả. Nếu replay phải giữ lỗi hiển thị hiện có, đặt cách render tương thích riêng và ghi gap, không sửa payload nguồn thành nghiệp vụ sai.
- Quý v2 ưu tiên file báo cáo quý; nếu thiếu file dùng tổng ba tháng kèm nhãn dẫn xuất. Không cộng các số YTD tháng với nhau; không coi tổng thiếu tháng là quý đủ dữ liệu. Clone vẫn giữ cách gọi kỳ quý của web như mục 5.
- XNK ròng = tổng gộp 7 dòng − hoàn GTGT − hoàn XNK ưu đãi ô tô/CNHT − hoàn TTĐB xăng khoáng. Kiểm tra payload lưu hoàn thuế là số dương hay âm trước khi trừ, tránh trừ hai lần. Cơ cấu tổng thể v2 dùng ròng trên Thu NSNN đã loại trừ hoàn GTGT.
- Tổng số gồm vay/chuyển giao, Thu NSNN, Tổng số trừ hoàn GTGT và Thu NSNN trừ hoàn GTGT không được nhập thành một field. Mapping workbook `Biểu báo cáo!C17/I17` là yêu cầu trong tài liệu, chưa được xác minh trên workbook gốc tại workspace này.
- Waterfall v2 chỉ dùng 21 khoản: tổng đầu + Σdelta = tổng cuối; lấy 10 delta lớn nhất theo trị tuyệt đối, gộp mọi phần dư thành Khác. Ghi log nếu lệch >1.000 đồng. Không cộng cả cha và con. UI waterfall của clone không đổi theo thiết kế mới này.
- Cấp ngân sách là một chiều phân tích khác nguồn/khoản/sắc thuế; không cộng các tổng cha NSNN/NSĐP thêm một lần vào các cấp con. V2 có F5 Tổng NSNN/NSTW/NSĐP, không được đổi filter “Chỉ tiêu” hiện tại thành F5 vì chúng khác nghĩa.

### 11.3. Những yêu cầu v2 chưa có trên web phải ghi rõ trong gap report

| Nhóm | Nghiệp vụ mới nhất v2 |
|---|---|
| Điều hướng | 4 tab; Tab 1–2 chỉ toàn TP, chọn ward tự sang Tab 3/disable 1–2; Tab 4 không bị ép chuyển |
| Filter | Sticky F1 năm, F2 segment tháng/quý + kỳ, F3 trong kỳ/lũy kế, F4 địa bàn có search, F5 cấp ngân sách |
| Tổng quan | 2 KPI tổng trong kỳ/YTD; chỉ dẫn gộp card 3–4 làm cảnh báo; line N/N−1; cơ cấu 4 nguồn; Top 5 khoản; Top 5 cao/thấp và tăng/giảm |
| Phân tích thu | Nội địa/XNK/Thu khác; 3 KPI nội địa; grouped bar 3 nhóm; drill chi tiết SXKD/nhà đất/khác; BXH 21 khoản |
| Chi tiết ward | Reuse widget; thêm card hạng, đóng góp, so bình quân; bỏ Top địa bàn, XNK và dầu thô; nhãn 100% nội địa nếu thu khác bằng 0 |
| So sánh | 2–5 kỳ hoặc 2–5 ward; disable F2/F4 theo mode; chart nhiều đường/cột, bảng 21 khoản sort/export, waterfall, AL-1…6, scatter |
| Tùy chọn | CAGR khi so ≥3 năm chỉ là COULD; không tự biến thành bắt buộc |

Các luật bất thường mục tiêu: AL-1 giảm YoY ≤−30% và |delta|≥1% tổng thu phạm vi; AL-2 15%≤|YoY|<30% và cùng điều kiện quy mô; AL-3 chênh lệch YoY địa bàn so TP ≤−20 điểm phần trăm; AL-4 thấp hơn trung bình 3 kỳ từ 2 kỳ liên tiếp; AL-5 âm ngoài nhóm hoàn thuế/điều chỉnh; AL-6 chưa nạp dữ liệu. Không dùng cảnh báo dự toán/−10% của HTML mô phỏng thay thế bộ luật này.

### 11.4. Phần nào có thể học từ `index.html`

- Cách tổ chức hàm `activeKhoan`, `sum`, `monthly`, `buildFilters`, `drillLevel`, `renderDrill`, `wardTable`, `renderAll`; nguồn → khoản → sắc thuế phụ thuộc và xóa lựa chọn con mất hiệu lực.
- Luồng breadcrumb quay lên, chọn ward đổi scope, đóng hồ sơ doanh nghiệp, hiện bảng chi tiết; chỉ là ví dụ để hiểu tương tác. Không thêm các control này vào UI web nếu web chưa có.
- `YEAR=2026`, `PREV=2025`, `LAST_MONTH=8`, seeded random, 25 khoản tổng cộng/12 nhóm nội địa, 15 DN ẩn danh, chia tỷ trọng địa bàn, dự toán `dt` là dữ liệu mô phỏng. Không lấy làm báo cáo thật hoặc lấy thay fixture chỉ vì tổng tự cộng được.
- HTML có font riêng, dark mode, header xanh, filter chip và KPI dự toán. Các phần này không được coi là yêu cầu v2 hoặc mang sang clone nguyên trạng.

### 11.5. Khoảng trống phải công khai, không đoán thành yêu cầu

- V2 còn khung “4 KPI” nhưng §3.1 ghi gộp card 3–4 thành cảnh báo; không khôi phục KPI nội địa/SXKD từ bản 8/9 để tự lấp.
- KPI 2 ở §3.1 là YTD cột I dòng 17, nhưng §3.3 lại nhắc mục A/nhãn trừ hoàn GTGT; chưa đủ cơ sở tự thay mapping của clone.
- Một số mục v2 chỉ có heading/sơ đồ: chi tiết cơ cấu cấp NS, nhà đất, BXH, công thức card hạng; scatter §6.6 chưa có trục/tương tác. Phải ghi chưa chốt, không sáng tác chart rồi nói là đúng đặc tả.
- AL-4 chưa nói rõ cửa sổ trung bình; mẫu số YoY bằng 0/âm chưa đủ quy ước; file quý thiếu tháng cũng chưa có quy tắc đầy đủ.
- Một số ảnh đính kèm trong HTML xuất tài liệu đang thiếu hoặc đường dẫn không khớp `Attachment/`. Không thay ảnh minh họa khác và coi là bản được duyệt.

## 12. Kết quả giao và kiểm tra tài liệu

Ngoài các kiểm tra UI ở mục 10, tạo `SPEC-GAPS.md` với từng yêu cầu v2, mục tài liệu, hiện trạng web, cách giữ nguyên trong clone, dữ liệu/mapping còn thiếu. Không chỉ ghi một dòng chung “chưa làm v2”. Tách rõ lỗi đã quan sát, nghiệp vụ mới đã mô tả, và chi tiết chưa chốt; không coi việc cố tình giữ UI clone là đã hoàn thành v2.

Tạo `DATA-MAPPING.md` ghi rõ đơn vị, mã nguồn/khoản, mã địa bàn, scope, nguồn API/fixture và phần mô phỏng nếu có. Kiểm tra không lẫn đồng/tỷ đồng, không dùng ID `w*` làm mã API và không cộng trùng tổng cha/con trong mapping mới. Không thêm bài test nghiệp vụ v2 rồi sửa snapshot clone chỉ để ép chúng cùng pass.

Kết quả giao: source trong `prototype-nsnn/`, README ngắn hướng dẫn chạy và chế độ dữ liệu, `SPEC-GAPS.md`, `DATA-MAPPING.md`, build thành công, ảnh kiểm chứng và danh sách trường hợp đã thử. Trả lại địa chỉ local và các giới hạn còn lại. Bắt đầu thực hiện ngay.
