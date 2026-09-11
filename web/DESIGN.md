---
name: Tổng quan Thu ngân sách Nhà nước Hà Nội
description: Hệ thống giao diện vận hành số liệu ngân sách công, dày thông tin nhưng điềm tĩnh và dễ quét.
colors:
  institutional-navy: "#0e2a47"
  brand-blue: "#1657a8"
  data-secondary: "#3987e5"
  data-family: "#86b6ef"
  data-reference: "#8c9bae"
  data-track: "#e7edf5"
  blue-050: "#eef4fc"
  blue-250: "#86b6ef"
  blue-350: "#5598e7"
  blue-450: "#2a78d6"
  blue-550: "#1c5cab"
  blue-700: "#0d366b"
  canvas: "#f2f5f9"
  surface: "#ffffff"
  surface-sunken: "#f7f9fc"
  ink: "#16263c"
  ink-2: "#5a6b80"
  ink-3: "#8496aa"
  hairline: "#dbe3ed"
  divider: "#eaeff6"
  nodata: "#e5eaf1"
  positive: "#187044"
  negative: "#b3352f"
  note-ink: "#7a5a12"
  note-surface: "#fdf5dd"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "normal"
  metric:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
rounded:
  bar: "2px"
  chip: "4px"
  control: "6px"
  surface: "10px"
  circle: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  control: "12px"
  grid: "14px"
  surface: "16px"
  lg: "24px"
  xl: "32px"
components:
  action-primary:
    backgroundColor: "{colors.data-blue}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 13px"
    height: "36px"
  segmented-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.data-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.compact}"
    padding: "3px 10px"
    height: "30px"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 30px 6px 10px"
    height: "38px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "15px 16px"
  comparison-chip:
    backgroundColor: "{colors.data-blue-soft}"
    textColor: "{colors.data-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.compact}"
    padding: "6px 8px"
---

# Design System: Tổng quan Thu ngân sách Nhà nước Hà Nội

## Overview

**Creative North Star: “Bàn điều hành ngân sách”**

Đây là giao diện Operate dành cho người đọc và đối chiếu số liệu ngân sách công. Cảm giác chủ đạo là thể chế, chắc chắn và yên tĩnh: đầu trang xanh navy xác lập thẩm quyền; phần làm việc dùng nền trung tính sáng, bề mặt trắng có viền mảnh và một giọng xanh dữ liệu nhất quán. Mật độ thông tin cao nhưng mỗi lớp có trật tự rõ ràng, ưu tiên quét nhanh hơn biểu đạt trang trí.

Hệ thống dùng tiếng Việt làm ngôn ngữ sản phẩm, số theo định dạng `vi-VN`, đơn vị “tỷ đồng” và chữ số dạng tabular để các cột số ổn định khi thay đổi. Giao diện phải diễn đạt trung thực nguồn, kỳ, phạm vi, độ phủ và khoảng trống dữ liệu. API, MCP, fixture và mock đi qua cùng một hợp đồng dữ liệu có kiểu; trạng thái nguồn phải hiện rõ trong giao diện.

**Key Characteristics:**

- Đầu trang navy mang tính thể chế, nội dung phân tích nằm trên nền xám xanh rất nhạt.
- Tab chính bám dính phía trên; bộ lọc ngữ cảnh nằm ngay dưới tab trong luồng nội dung.
- KPI là một dải bốn ô gọn, còn widget dùng lưới 12 cột với bề mặt trắng và viền mảnh.
- Màu xanh dành cho điều hướng, thao tác và dữ liệu; xanh lá/đỏ chỉ biểu đạt chiều biến động.
- Khoảng trống, trạng thái thiếu dữ liệu và nguồn mô phỏng luôn được nói rõ, không được ngụy trang thành số 0.

## Colors

**Một tông xanh mang dữ liệu.** Toàn bộ đại lượng định lượng — thanh, đường, lát
donut, bậc bản đồ, cột so sánh — đều nằm trên **một** thang lam, phân biệt bằng
độ đậm nhạt chứ không bằng nhiều sắc. Xanh lá và đỏ chỉ mang **chiều biến động**
và luôn đi kèm mũi tên hoặc dấu. Trung tính mang cấu trúc. Không có màu trang trí
nào khác.

Thang lam đã qua kiểm định: độ sáng đơn điệu, khoảng cách ΔL ≥ 0,06 giữa các bậc
liền kề, đầu nhạt đạt 2,11:1 trên nền trắng, độ lệch sắc trong thang ≤ 4°.

### Vai trò

- **Navy thể chế** `#0e2a47` — chỉ dùng cho dải đầu trang.
- **Xanh thương hiệu** `#1657a8` — hành động chính, tab đang chọn, chuỗi dữ liệu
  chính, kỳ hiện tại, kỳ B trong tab So sánh.
- **Xanh phụ** `#3987e5` — thanh trong danh sách xếp hạng, lát thứ hai của donut.
- **Cùng họ** `#86b6ef` — chuỗi cùng nhóm số liệu: lũy kế YTD, NSĐP, kỳ A.
- **Mốc tham chiếu** `#8c9bae` — đường cùng kỳ năm trước trên biểu đồ Tổng quan.
  Cố ý phi sắc: đây là mốc nền, không phải một chuỗi ngang hàng, và luôn đi kèm
  nét đứt cùng nhãn trực tiếp.
- **Thang bản đồ** — 5 bậc `#86b6ef → #0d366b`, nhạt là thấp, đậm là cao. Bậc
  "chưa có số liệu" là xám trung tính `#e5eaf1`, tách khỏi thang.

**The One Data Hue Rule.** Đại lượng liên tục không bao giờ được mã hoá bằng
nhiều sắc. Thang cầu vồng đỏ→cam→vàng→lá cho một đại lượng magnitude là lỗi:
nó biến "thấp" thành cảnh báo và phá thứ tự đọc.

**The Semantic Color Rule.** Đỏ và xanh lá chỉ nói lên chiều tăng/giảm, không bao
giờ dùng làm màu chuỗi. Chúng luôn đi kèm tam giác chỉ hướng hoặc dấu +/−.

**The Encoding Match Rule.** Thanh phải mã hoá đúng đại lượng đang dùng để sắp
xếp. Danh sách sắp theo %YoY thì thanh vẽ theo %YoY, phân kỳ quanh mốc 0 — và
chỉ dành nửa rãnh cho phía âm khi tập đang xem thật sự có cả hai dấu.

**The Shared Scale Rule.** Không đặt hai đại lượng lệch bậc lên cùng một thang.
Biểu đồ đóng góp tách hai tổng thành một dòng cầu nối bằng chữ, còn các delta
được vẽ trên thang riêng của chúng.

## Typography

**Display Font:** Không dùng vai trò display trang trí.

**Body Font:** System UI, ưu tiên phông hệ điều hành và Segoe UI.

**Character:** Kiểu chữ trung tính, rõ ở kích thước nhỏ và phù hợp giao diện nghiệp vụ. Phân cấp đến từ trọng lượng, kích thước và độ tương phản, không đến từ nhiều họ chữ.

### Hierarchy

- **Headline** (650, 20px, line-height 1.5): tên sản phẩm trong đầu trang; xuống 16px ở mobile.
- **Title** (700, 15px, line-height 1.5): tiêu đề widget và nhóm phân tích.
- **Body** (400, 14px, line-height 1.55): văn bản giao diện và nội dung trạng thái.
- **Metric** (700, 23px, line-height 1.25): số KPI; xuống 19px ở mobile. Insight dùng biến thể 16px để giữ câu ngắn gọn.
- **Label** (650, 11px, line-height 1.5): nhãn bộ lọc, KPI, biến động và metadata. Tab dùng 14px/650 trên desktop và 12px trên mobile.

**The Numeric Alignment Rule.** Mọi số liệu dùng tabular numerals; căn phải khi nằm ở cuối hàng và giữ đơn vị gần giá trị.

**The Compact Label Rule.** Nhãn nhỏ phải dùng mực phụ và trọng lượng 650; không bù kích thước nhỏ bằng chữ hoa toàn bộ ngoài dữ liệu đã được định danh như NSNN, NSTW và NSĐP.

## Layout

Khung ứng dụng rộng tối đa 1600px, căn giữa, với lề ngang co giãn từ 14px đến 36px. Đầu trang dùng lề từ 16px đến 38px. Tab chính cao tối thiểu 52px, bám ở đỉnh viewport với nền canvas gần đặc và blur nhẹ; bộ lọc luôn xuất hiện dưới tab để giữ thứ tự “khu vực → ngữ cảnh → kết quả”. Nội dung Overview dùng nhịp dọc 14px; các widget nằm trên lưới 12 cột, gap 14px và tự căn ở đầu hàng.

Ở 1440px, bố cục giữ các tỷ lệ 8/4, 8/4, 6/6 và 12 cột theo ý nghĩa của từng widget. Dải KPI có bốn ô theo tỷ lệ `1 / 1 / 0.8 / 1.15`. Dưới 1280px, thẻ mặc định chiếm đủ 12 cột nhưng cặp thẻ 6 cột vẫn đứng cạnh nhau; chỉ tiêu trong bộ lọc xuống một hàng đầy đủ. Ở 1024px, quy tắc này tạo một cột cho widget lớn và hai cột cân đối cho các widget 6/6.

Dưới 768px, khung có lề 10px; tab cuộn ngang; bộ lọc thành hai cột và trường chỉ tiêu chiếm trọn hàng. KPI thành lưới 2×2, mọi widget chiếm 12 cột, phần điều khiển thẻ xuống hàng đầy đủ, biểu đồ cao 240px và waterfall chuyển mỗi mục thành hai hàng. 390px là kích thước mobile chuẩn để kiểm tra: không được có tràn ngang ngoài thanh tab chủ ý, nhãn dài phải rút gọn hoặc xuống dòng, và số liệu phải giữ khả năng đọc.

**The Twelve-Column Rule.** Widget chỉ dùng các nhịp 4, 6, 8 hoặc 12 cột đã có trong API component; chọn độ rộng theo lượng thông tin chứ không theo trang trí.

**The Context Before Metrics Rule.** Tab, bộ lọc, phạm vi/đơn vị và nguồn dữ liệu phải xuất hiện trước KPI và biểu đồ trong thứ tự đọc.

## Elevation & Depth

Hệ thống phẳng theo mặc định. Bề mặt được phân lớp bằng nền trắng, viền 1px và thay đổi tông nhẹ; thẻ thường không có bóng. Bóng nhỏ chỉ xuất hiện trong nút segmented đang chọn (`0 2px 7px #19334e16`), còn drawer chi tiết dùng bóng ngang rộng (`-15px 0 38px #07172922`) để tách khỏi lớp phủ navy trong suốt. Thanh tab dùng blur 9px vì bám dính và có thể che nội dung đang cuộn.

**The Flat Workspace Rule.** Không thêm bóng cho widget thường; viền và tông nền đã mang đủ cấu trúc.

**The Overlay Earns Depth Rule.** Bóng lớn chỉ dành cho bề mặt phủ lên luồng chính như drawer chi tiết.

## Shapes

Bề mặt lớn có góc cong vừa phải 12px và viền lạnh 1px. Control dùng bán kính 6–8px; thanh dữ liệu dùng 2–4px để gọn và chính xác. Chấm trạng thái, huy hiệu đầu trang và nút đóng drawer dùng hình tròn. Khối so sánh đang đóng dùng viền dashed để truyền đạt trạng thái chưa mở mà vẫn giữ cùng silhouette 12px.

**The Nested Radius Rule.** Bán kính giảm theo cấp độ: 12px cho surface, 7–8px cho control, 6px cho nút con/chip và 2–4px cho thanh dữ liệu.

## Components

### Header

- **Style:** dải navy toàn chiều rộng, cao theo nội dung với padding 14px; tên sản phẩm 20px/650 và dòng cơ quan 12px màu xanh trắng nhạt.
- **Mark:** huy hiệu “HN” 34px hình tròn, viền trắng trong suốt.
- **Status:** chấm xanh lá 7px và thông báo sẵn sàng; ẩn dòng phụ và trạng thái trên mobile để giữ đầu trang gọn.

### Navigation

- **Style:** tab văn bản trên nền canvas, khoảng cách 24px, đường đáy toàn hàng và trạng thái active bằng đường xanh 3px.
- **Behavior:** bám đỉnh viewport, z-index 30, blur nhẹ. Trên mobile, khoảng cách giảm còn 16px và hàng tab cuộn ngang.
- **Focus:** mọi button/select/input dùng outline xanh 3px, lệch 2px.

### Filters and segmented controls

- **Container:** surface trắng, viền 1px, radius 12px; dải ngữ cảnh nằm dưới với divider và nền trung tính nhạt.
- **Select:** cao tối thiểu 38px, viền xám xanh, radius 7px; nhãn 11px/650.
- **Segmented:** nền xám xanh nhạt, padding 3px, radius 8px. Mục chọn chuyển sang trắng, chữ xanh và bóng rất nhẹ.
- **Behavior:** thay đổi loại kỳ phải kẹp giá trị kỳ về phạm vi hợp lệ; ngữ cảnh luôn nêu phạm vi và đơn vị.

### KPI strip

- **Structure:** một surface duy nhất chia bốn ô bằng viền dọc, radius 12px và overflow hidden.
- **Typography:** nhãn 11px/650; giá trị 23px với tracking âm; dòng phụ 11px.
- **Insight:** ô cuối có nền phụ và câu insight xanh 16px. Trên mobile, dải chuyển thành 2×2 với đường chia tương ứng.

### Cards and data widgets

- **Container:** nền trắng, viền 1px, radius 12px, không bóng.
- **Header:** padding `15px 16px 8px`; tiêu đề 15px/700, mô tả 11px màu muted. Điều khiển nằm bên phải và xuống hàng trên mobile khi cần.
- **Content:** danh sách dùng divider rất nhạt; biểu đồ dùng xanh hiện tại, xám dashed cho năm trước và khoảng trống thật cho dữ liệu chưa có.
- **Interaction:** hàng có drill-down là button đầy đủ; hàng chỉ hiển thị bị disabled và không giả vờ có tương tác.

### Buttons and chips

- **Primary:** xanh dữ liệu, chữ trắng, cao tối thiểu 36px, radius 7px, padding 6px 13px.
- **Text action:** chữ xanh 12px/650, gạch chân có offset 3px.
- **Comparison chip:** nền xanh nhạt, chữ xanh đậm, radius 6px; dấu × nằm sau nhãn.
- **State:** focus-visible luôn dùng outline chuẩn. Không dùng animation trang trí; reduced-motion rút mọi animation/transition xuống gần như tức thời.

### Ranked bars and change indicators

- **Row:** ba vùng rank / nhãn-thanh / biến động, padding dọc 9px và divider nhẹ.
- **Bar:** track cao 4px, fill xanh trung, radius 2px; chiều dài tỷ lệ theo trị tuyệt đối lớn nhất trong tập đang hiển thị.
- **Change:** tăng dùng mũi tên lên và xanh lá; giảm dùng mũi tên xuống và đỏ; trung tính dùng dấu gạch và mực phụ. Khi không đủ cơ sở, viết rõ “Chưa đủ cơ sở”.

### Loading, empty, error, and partial data

- **Loading:** skeleton trắng có viền, ba khối cao 54px và pulse 1.4s; vùng có `aria-live`.
- **Empty:** surface trạng thái nêu không có số liệu và hướng người dùng đổi kỳ.
- **Error:** surface có `role="alert"`, thông báo ngắn và nút “Thử lại”.
- **Partial:** vẫn hiển thị dữ liệu thật, đồng thời nêu độ phủ và số địa bàn thiếu; không tạo dòng 0 thay cho quan sát thiếu.

### Detail drawer

- **Structure:** overlay navy trong suốt và drawer phải rộng tối đa 440px/94vw, cao toàn viewport, z-index 61.
- **Content:** giá trị chính 34px, metadata trong danh sách definition có divider; nguồn và ngữ cảnh bộ lọc hiện tại luôn có mặt.
- **Close:** nút tròn 36px ở góc trên phải, có nhãn truy cập “Đóng”.

### Data provider contract

- **Boundary:** UI chỉ nhận `OverviewData` đã kiểm tra runtime; không truyền payload API/MCP thô vào component.
- **Sources:** `api`, `mcp`, `fixture` và `mock` dùng cùng schema version `1.0` và cùng cấu trúc filter/data.
- **Resource states:** `loading`, `error`, `empty`, `ready` và `partial` là các trạng thái trình bày bắt buộc.
- **Cancellation:** mỗi lần đổi filter hủy request cũ bằng `AbortController`; thao tác thử lại tạo request mới.

## Do's and Don'ts

### Do:

- **Do** giữ thứ tự header → tab sticky → filter ngữ cảnh → nguồn → KPI → lưới widget.
- **Do** dùng surface trắng có viền trên canvas trung tính và nhịp 14–16px để duy trì mật độ hiện tại.
- **Do** dùng đúng lưới 12 cột và kiểm tra ở 390px, 1024px và 1440px.
- **Do** định dạng số theo `vi-VN`, dùng tabular numerals và ghi đơn vị “tỷ đồng” rõ ràng.
- **Do** hiển thị nguồn, phạm vi, kỳ, cấp ngân sách và độ phủ gần số liệu mà chúng mô tả.
- **Do** giữ mọi trạng thái tương tác có focus-visible rõ, nhãn ARIA phù hợp và hành vi reduced-motion.
- **Do** đưa nguồn API/MCP/mock qua hợp đồng typed và validation runtime trước khi render.

### Don't:

- **Don't** thêm gradient, glassmorphism, bóng thẻ đậm hoặc màu nhấn trang trí vào workspace phân tích.
- **Don't** dùng đỏ hoặc xanh lá cho điều hướng, selection hay trang trí; chúng chỉ mang nghĩa tăng/giảm.
- **Don't** biến dữ liệu thiếu thành 0, nối đường biểu đồ qua khoảng trống hoặc tính phần trăm khi mẫu so sánh không hợp lệ.
- **Don't** làm widget thành các tile nổi rời rạc; cấu trúc đến từ grid, viền và nhịp đều.
- **Don't** giấu nguồn mô phỏng, kỳ tổng hợp hoặc độ phủ chưa đầy đủ.
- **Don't** thêm tương tác vào hàng không có drill-down, hoặc dùng affordance button cho nội dung chỉ đọc.


## Số và đơn vị

Cả ba tab dùng **một** thang tiền rút gọn: `≥10¹²` → "nghìn tỷ" (2 số lẻ),
`≥10⁹` → "tỷ" (1 số lẻ), `≥10⁶` → "triệu" (1 số lẻ). Overview tính nội bộ bằng tỷ
đồng nhưng hiển thị qua đúng hàm đó, nên "45,64 nghìn tỷ" ở Tổng quan và
"3,04 nghìn tỷ" ở Chi tiết địa bàn đọc cùng một kiểu.

Mọi phần trăm dùng locale `vi-VN` với **dấu phẩy** thập phân và đúng một số lẻ.
Không có chỗ nào dùng `toFixed()` trực tiếp cho số hiển thị.

**The Single Money Scale Rule.** Đơn vị nằm trong chuỗi tiền, không lặp lại ở
dòng phụ. Nhãn trục ghi đơn vị một lần trong chú giải.

## Phạm vi và điều hướng

Địa bàn là một phép **đổi phạm vi**, không phải bộ lọc tinh chỉnh tại chỗ:

- Chọn một phường/xã → chuyển sang "Chi tiết địa bàn".
- Về toàn thành phố → quay lại "Tổng quan".
- Tab "So sánh hai kỳ" tự quản lý địa bàn nên không bị ép chuyển.
- **Không tab nào bị vô hiệu.** Người dùng vẫn mở được Tổng quan khi đang chọn
  một phường; thanh phạm vi nói rõ Tổng quan luôn tính cho toàn thành phố và mở
  lối tắt sang trang chi tiết.

**The Scope Bar Rule.** Thanh phạm vi có mặt trên cả ba tab, ở đúng một vị trí,
và luôn có lối quay lại. Một bộ lọc không được phép im lặng vô hiệu.
