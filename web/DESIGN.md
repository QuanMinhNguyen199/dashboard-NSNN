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
  ink-2: "#485666"
  ink-3: "#63707f"
  hairline: "#dbe3ed"
  divider: "#eaeff6"
  nodata: "#e5eaf1"
  positive: "#187044"
  negative: "#b3352f"
  note-ink: "#7a5a12"
  note-surface: "#fdf5dd"
  note-line: "#eeddad"
  control-border: "#c6d2e0"
  scrollbar-thumb: "#c3cedd"
  ink-on-dark: "#ffffff"
  on-dark-fill: "#ffffff14"
  on-dark-fill-hover: "#ffffff26"
  on-dark-line: "#ffffff3d"
  on-dark-line-hover: "#ffffff66"
  on-dark-hairline: "#ffffff12"
  scrim: "#0e2a4780"
  frame-stage: "#888ca3"
  tooltip-surface: "#111c2ce6"
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
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "normal"
  metric:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  metric-compact:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  caption:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  insight:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
rounded:
  bar: "2px"
  chip: "4px"
  control: "6px"
  surface: "10px"
  pill: "99px"
  circle: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  control: "12px"
  surface: "16px"
  lg: "24px"
  xl: "32px"
components:
  action-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 13px"
    height: "36px"
  segmented-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "3px 10px"
    height: "30px"
  action-text:
    textColor: "{colors.brand-blue}"
    typography: "{typography.label}"
    padding: "4px 2px"
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
    backgroundColor: "{colors.blue-050}"
    textColor: "{colors.brand-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "6px 8px"
---

# Design System: Tổng quan Thu ngân sách Nhà nước Hà Nội

## Overview

**Creative North Star: “Bàn điều hành ngân sách”**

Đây là giao diện Operate dành cho người đọc và đối chiếu số liệu ngân sách công. Cảm giác chủ đạo là thể chế, chắc chắn và yên tĩnh: đầu trang xanh navy xác lập thẩm quyền; phần làm việc dùng nền trung tính sáng, bề mặt trắng có viền mảnh và một giọng xanh dữ liệu nhất quán. Mật độ thông tin cao nhưng mỗi lớp có trật tự rõ ràng, ưu tiên quét nhanh hơn biểu đạt trang trí.

Hệ thống dùng tiếng Việt làm ngôn ngữ sản phẩm, số theo định dạng `vi-VN`, **một** đơn vị tiền duy nhất là “tỷ đồng” và chữ số dạng tabular để các cột số ổn định khi thay đổi. Giao diện phải diễn đạt trung thực nguồn, kỳ, phạm vi, độ phủ và khoảng trống dữ liệu. API, MCP, fixture và mock đi qua cùng một hợp đồng dữ liệu có kiểu; trạng thái nguồn phải hiện rõ trong giao diện.

**Key Characteristics:**

- Đầu trang navy mang tính thể chế, nội dung phân tích nằm trên nền xám xanh rất nhạt.
- Tab chính bám dính phía trên; bộ lọc ngữ cảnh nằm ngay dưới tab trong luồng nội dung.
- KPI là một dải bốn ô gọn, còn widget dùng lưới 12 cột với bề mặt trắng và viền mảnh.
- Màu xanh dành cho điều hướng, thao tác và dữ liệu; xanh lá/đỏ chỉ biểu đạt chiều biến động.
- Khoảng trống, trạng thái thiếu dữ liệu và nguồn mô phỏng luôn được nói rõ, không được ngụy trang thành số 0.
- Một đơn vị tiền cho cả ứng dụng; đơn vị ghi ở đầu cột chứ không bám từng giá trị.
- Chuyển động chỉ phục vụ phản hồi và tính liên tục; giảm chuyển động vẫn giữ phản hồi.

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
- **Mực phụ** — hai bậc chữ phụ chốt theo **độ tương phản đo được trên nền
  trắng**, không chốt theo cảm giác "nhạt vừa đủ": `ink-2` đạt 7,50:1 (AAA) và
  `ink-3` đạt 5,05:1 (AA). Bản cũ dùng `#8496aa` cho `ink-3` chỉ đạt 3,03:1 —
  trượt chuẩn AA cho chữ thường, mà nó lại đang mang số thứ hạng và tỷ trọng.
- **Viền điều khiển** `#c6d2e0` — riêng cho `select` và `input`. Đậm hơn
  `hairline` vì viền của thứ bấm được phải nói lên là bấm được. Dùng 7 chỗ trước
  khi có tên.
- **Mực trên nền tối** `#ffffff` — chữ nằm trên navy hoặc trên nền xanh thương
  hiệu. Không phải `surface`: hai thứ cùng là trắng nhưng khác vai trò, một cái
  là bề mặt còn một cái là chữ đặt lên bề mặt khác.
- **Bốn bậc phủ trên nền tối** — `on-dark-fill`, `on-dark-fill-hover`,
  `on-dark-line`, `on-dark-line-hover`, cộng `on-dark-hairline` cho đường kẻ.
  Trước khi đặt tên, cùng năm vai trò này dùng **tám** giá trị alpha khác nhau —
  riêng vai trò "viền lúc nghỉ" đã có ba.

**The Named Overlay Rule.** Độ mờ trên một nền cụ thể vẫn là một quyết định
thiết kế và vẫn phải có tên. Alpha viết thẳng trong quy tắc là chỗ mà ba giá trị
gần giống nhau sinh ra cho cùng một việc.

**The Measured Ink Rule.** Bậc mực phụ chỉ được đổi khi đã tính lại tỷ lệ tương
phản trên nền nó sẽ nằm lên. "Nhạt hơn một chút" không phải một quyết định.

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

- **Display** (700, 32px, tracking −0.03em): giá trị chính trong drawer xem nhanh. Vai trò duy nhất dùng cỡ này.
- **Metric** (700, 23px, line-height 1.25, tracking −0.025em): số KPI; xuống 19px ở mobile. Insight dùng biến thể 16px để giữ câu ngắn gọn.
- **Headline** (650, 20px, line-height 1.5): tên sản phẩm trong đầu trang; xuống 16px ở mobile.
- **Title** (700, 15px, line-height 1.5): tiêu đề widget và nhóm phân tích.
- **Metric compact** (700, 19px, tracking −0.02em): số KPI ở mobile, và giá trị hai đầu cầu nối waterfall.
- **Insight** (700, 16px, tracking −0.01em): câu cảnh báo trong ô KPI cuối. Ngắn, một dòng.
- **Body** (400, 14px, line-height 1.55): văn bản giao diện và nội dung trạng thái.
- **Caption** (400, 13px, line-height 1.5): câu trạng thái rỗng, ghi chú độ phủ, chú thích bảng.
- **Label** (650, 12px, line-height 1.5): nhãn bộ lọc, KPI, biến động và metadata. Tab dùng 14px/650.

**The Two-Step Secondary Rule.** Tầng chữ phụ chỉ có **hai** bậc: 12px cho nhãn
và metadata, 13px cho câu trạng thái. Trước đây có năm cỡ trong khoảng 2px
(11 / 11,5 / 12 / 12,5 / 13) — mắt không phân biệt được nên chúng không tạo phân
cấp nào, chỉ tạo lệch. Năm bậc cách nhau nửa pixel là trôi dạt, không phải thang.

**The Compact Label Rule.** Nhãn nhỏ phải dùng mực phụ và trọng lượng 650; không bù kích thước nhỏ bằng chữ hoa toàn bộ ngoài dữ liệu đã được định danh như NSNN, NSTW và NSĐP.

### Số và đơn vị

**Thang tiền dừng ở "tỷ đồng".** Không có bậc "nghìn tỷ".

Bậc 10¹² trong tiếng Việt là một từ ghép: "nghìn tỷ" bắt người đọc nhân nhẩm hai
lần, còn dạng viết tắt CLDR "NT" thì không ai đọc ra. Dừng ở "tỷ" cho cả ứng dụng
đúng **một** đơn vị tiền duy nhất — mọi con số trên mọi tab so được với nhau mà
không phải đổi bậc lần nào, kể cả nhãn trục biểu đồ. Số lớn dùng dấu chấm phân
cách nghìn: "434.710" đọc nhanh hơn "434,71 nghìn tỷ" vì không có phép nhân nào
trong đầu. Đây cũng là đơn vị của báo cáo ngân sách giấy — "Đơn vị tính: tỷ đồng".

Không dùng mã ISO `VND`: "đồng" đã là tên đơn vị tiền, và màn hình không có loại
tiền thứ hai nào để phân biệt.

| Việc | Cách làm |
|---|---|
| Thang | `tỷ` → `triệu` → `nghìn` → `đồng`. Không có bậc nào trên `tỷ` |
| Chọn đơn vị | Một lần cho cả tập giá trị, lấy theo giá trị lớn nhất |
| Số lẻ | Cố định trong cả cột: `≥1000` → 0 lẻ, `≥100` → 1 lẻ, còn lại 2 lẻ |
| Ghi đơn vị | **Một** lần ở phụ đề thẻ hoặc đầu cột, không lặp ở từng dòng |
| Dưới ngưỡng hiển thị | `<0,01`, **không** phải `0,00` |
| Số 0 thật | `0` |

Những số so sánh được với nhau dùng chung một thang kể cả khi không nằm trong một
cột: "Thu trong kỳ" và "Lũy kế từ đầu năm" trên cùng dải KPI, hay vế A và vế B
của tab so sánh.

Số đứng một mình tách chữ số khỏi đơn vị: chữ số giữ cỡ và trọng lượng đầy đủ,
đơn vị nhỏ hơn (0,7em) và nhạt hơn. Con số là thông tin, đơn vị là chú thích.

Mọi phần trăm dùng locale `vi-VN` với **dấu phẩy** thập phân và đúng một số lẻ.
Không có chỗ nào dùng `toFixed()` trực tiếp cho số hiển thị.

**The Column Unit Rule.** Một cột, một đơn vị, một số lẻ, ghi đơn vị đúng một lần
ở đầu. Không hậu tố nào lặp lại ở từng dòng, và không bậc nào trên "tỷ".

**The Numeric Alignment Rule.** Mọi số liệu dùng tabular numerals nên chiều rộng
chữ số bằng nhau, dấu phẩy thẳng hàng giữa các dòng và cột không nhảy khi giá trị
đổi. Căn phải khi nằm ở cuối hàng.

## Layout

Khung ứng dụng rộng tối đa 1600px, căn giữa, lề ngang co giãn `clamp(14px, 2.5vw, 36px)`.
Tab chính cao tối thiểu 52px và bám đỉnh viewport; bộ lọc luôn nằm dưới tab để giữ
thứ tự "khu vực → ngữ cảnh → kết quả". Widget nằm trên lưới 12 cột, gap 16px.
Dải KPI chia bốn ô theo tỷ lệ `1fr 1fr 0.8fr 1.3fr`.

### Thang breakpoint

Năm ngưỡng, mỗi ngưỡng giải đúng một việc. Đây là breakpoint **theo nội dung**:
mỗi mốc là chỗ một thứ cụ thể vỡ, không phải kích thước thiết bị.

| Ngưỡng | Việc nó giải |
|---|---|
| 1279px | Cặp 8+4 nới thành **7+5 và vẫn đứng cạnh nhau**. Ép mỗi thẻ chiếm trọn hàng làm trang dài gấp đôi mà vẫn thừa chiều ngang |
| 1179px | Dải KPI xuống 2×2, trước khi mỗi ô hẹp hơn chính con số nó phải in |
| 1023px | Nội dung trong thẻ chuyển bố cục hẹp; bảng nhiều cột chiếm trọn hàng thay vì cuộn ngang trong thẻ; bản đồ rời bố cục hai cột |
| 767px | Chrome mobile; thanh lọc thu gọn thành một dòng phạm vi |
| 699px | Hết chỗ cho hai cột, xếp chồng toàn bộ |

**The Pairs Before Stacking Rule.** Dưới 1280px, cặp widget **nới tỷ lệ** trước,
xếp chồng sau. Xếp chồng sớm cho thẻ rộng 912px chứa danh sách năm dòng — thừa
chiều ngang mà trang dài gấp đôi.

**The Scope Costs Height Rule.** Dưới 768px, sáu ô lọc chiếm 326px — gần một phần
ba khung iframe cao 1100px. Thanh lọc thu về một dòng nêu phạm vi bằng chữ; mở ra
khi người dùng cần. Bộ lọc là phương tiện, không phải nội dung.

**The Equal Row Height Rule.** Thẻ cùng một hàng luôn cao bằng nhau. Biểu đồ nở
hết phần dư; danh sách thanh nở **có trần** để dòng không bị kéo méo; bảng dài
cuộn trong thẻ thay vì nong thẻ cao gấp đôi thẻ bên cạnh.

**The Head Floor Rule.** Trong vùng đặt nhiều thẻ cạnh nhau, đầu thẻ có sàn
86px. Chiều cao đầu thẻ vốn phụ thuộc nội dung — phụ đề một hay hai dòng, chỗ
điều khiển là liên kết chữ hay nhóm nút — nên hai thẻ cạnh nhau có thân bắt đầu
lệch nhau và mọi dòng bên dưới lệch theo. Sàn này là hệ quả của
*The Equal Row Height Rule* áp cho mép trên. Sàn được gỡ đúng tại 699px — mốc thẻ thật sự xếp chồng, không phải 767px: lúc đó nó chỉ còn là khoảng trống phải cuộn qua. Ngoại lệ còn lại là thẻ
có nhóm điều khiển rộng hơn 150px — nó buộc phải xuống dòng ở thẻ hẹp, và mọi
cách ép nó thẳng hàng đều tốn nhiều chiều cao hơn phần lệch nó gây ra.

**The Restate Specificity Rule.** Luật ở breakpoint phải nhắc lại mọi biến thể có
độ đặc hiệu cao hơn. `.dstack-row.is-chart-pair` (0-2-0) thắng `.dstack-row`
(0-1-0) bất kể thứ tự, nên luật xếp chồng ở 699px viết thiếu biến thể sẽ im lặng
không áp dụng — cặp biểu đồ từng nằm cạnh nhau ở 390px với bề rộng 148px.

**The Twelve-Column Rule.** Widget chỉ dùng các nhịp 4, 6, 8 hoặc 12 cột đã có trong API component; chọn độ rộng theo lượng thông tin chứ không theo trang trí.

**The Context Before Metrics Rule.** Tab, bộ lọc, phạm vi/đơn vị và nguồn dữ liệu phải xuất hiện trước KPI và biểu đồ trong thứ tự đọc.

## Elevation & Depth

Hệ thống phẳng theo mặc định. Bề mặt phân lớp bằng nền trắng, viền 1px và thay
đổi tông nhẹ; thẻ thường **không có bóng**.

### Shadow Vocabulary

Bốn vai trò, bốn token, không có bậc thứ năm: `--shadow-control`,
`--shadow-overlay`, `--shadow-frame`, `--shadow-tip`.

- **Control nổi** (`--shadow-control`, `0 1px 2px #19334e18`): nút segmented đang chọn và nút phóng bản đồ. Đủ để tách khỏi rãnh chứa nó, không hơn.
- **Overlay** (`--shadow-overlay`, `-18px 0 42px #0e2a4722`): drawer chi tiết, bóng ngang rộng vì nó đến từ cạnh phải.
- **Khung xem thử** (`--shadow-frame`): iframe trên nền tối — vòng 1px thay viền, bóng đổ tạo khoảng cách với nền.
- **Sticky header bảng** (`inset 0 -1px 0 var(--hairline)`): đường kẻ dưới `thead` phải là inset shadow, **không** phải `border-bottom` — ở chế độ `border-collapse` thì viền của ô sticky không dính theo ô và dòng phía sau lộ ra một vệt.

**The Flat Workspace Rule.** Không thêm bóng cho widget thường; viền và tông nền đã mang đủ cấu trúc.

**The Overlay Earns Depth Rule.** Bóng lớn chỉ dành cho bề mặt phủ lên luồng chính như drawer chi tiết.

## Shapes

Bán kính giảm dần theo cấp độ: **surface 10px** → **control 6px** → **chip 4px**
→ **thanh dữ liệu 2px**. Viền lạnh 1px mang cấu trúc thay cho bóng. Chấm trạng
thái, huy hiệu đầu trang và nút đóng drawer dùng hình tròn; thanh cuộn dùng bán
kính viên thuốc 99px.

**The Nested Radius Rule.** Bán kính giảm theo cấp độ, không bao giờ tăng: một
phần tử con không được cong hơn khung chứa nó.

## Components

### Header

- **Style:** dải navy toàn chiều rộng, cao theo nội dung với padding 14px; tên sản phẩm 20px/650 và dòng cơ quan 12px màu xanh trắng nhạt.
- **Mark:** huy hiệu “HN” 34px hình tròn, viền trắng trong suốt.
- **Status:** chấm xanh lá 7px và thông báo sẵn sàng; ẩn dòng phụ và trạng thái trên mobile để giữ đầu trang gọn.

### Navigation

- **Style:** tab văn bản trên nền canvas, khoảng cách 24px, đường đáy toàn hàng và trạng thái active bằng đường xanh 3px.
- **Behavior:** bám đỉnh viewport, z-index 30, blur nhẹ. Trên mobile, khoảng cách giảm còn 16px và hàng tab cuộn ngang.
- **Focus:** `:where(button, select, input, a, [tabindex]):focus-visible` cho outline xanh **2px**, lệch 2px. Một quy tắc phủ hết, không vá từng chỗ.

### Filters and segmented controls

- **Container:** surface trắng, viền 1px, radius 12px; dải ngữ cảnh nằm dưới với divider và nền trung tính nhạt.
- **Select:** cao tối thiểu 38px, viền `control-border`, radius 6px; nhãn 12px/650.
- **Segmented:** nền `divider`, padding 3px, radius 6px. Mục chọn chuyển sang trắng, chữ xanh và bóng `0 1px 2px #19334e18`.
- **Behavior:** thay đổi loại kỳ phải kẹp giá trị kỳ về phạm vi hợp lệ; ngữ cảnh luôn nêu phạm vi và đơn vị.

### KPI strip

Dựng bằng `KpiStrip` + `Kpi` + `KpiInsight` ([src/components/Kpi.tsx](src/components/Kpi.tsx)).
Cùng hình dạng này lặp 16 lần trên bốn tab; ô nhận `children` đã dựng sẵn thay vì
một `value: number`, vì có ô in tiền, có ô in phần trăm, có ô in mã địa bàn.

- **Structure:** một surface duy nhất chia **bốn ô đều nhau** bằng viền dọc, radius 10px, overflow hidden. Đệm `12px 16px`.
- **Ba tầng chữ:** nhãn 12px/650 `ink-2` · giá trị 23px/700 `ink` · dòng phụ 12px/400 **`ink-3`**. Nhãn và dòng phụ từng dùng chung cả cỡ lẫn màu, chỉ khác trọng lượng — squint test cho thấy chúng nhập thành một tầng. Tách bằng **màu** chứ không thêm bậc cỡ, để thang chữ phụ vẫn đúng hai bậc.
- **Nhịp:** khe nhãn→giá trị `1px`, khe giá trị→dòng phụ `5px`. Nhãn và giá trị là **một** đơn vị — tên của số và chính con số; dòng phụ là lời chú nên tách xa hơn.
- **Insight:** ô cuối có nền phụ, câu 16px/1.35 màu theo mức độ. Dưới 1180px dải chuyển thành 2×2.

**The Three Tier Rule.** Ô chỉ số có đúng ba vai trò và phải đọc ra đủ ba khi làm
mờ: nhãn, giá trị, lời chú. Hai vai trò dùng chung cả cỡ lẫn màu là hai vai trò
đã nhập làm một.

**The Even Cell Rule.** Bốn ô rộng bằng nhau. Tỷ lệ `1 1 0.8 1.3` trước đây được
chỉnh theo nội dung tab Tổng quan, nên ở tab Phân tích nó cho ô "Số khoản trong
nhóm" (giá trị: "21") rộng 433px còn ô "Đóng góp vào biến động" chỉ 267px. Một
tỷ lệ cố định áp lên bốn tập nội dung khác nhau thì đúng được một tập.

### Cards and data widgets

- **Container:** nền trắng, viền 1px, radius 12px, không bóng.
- **Header:** padding `15px 16px 8px`; tiêu đề 15px/700, mô tả 12px màu muted kèm nhãn đơn vị. Header **phải** `flex-wrap: wrap` và `.dcard-actions` phải co được — tiêu đề cộng ô tìm kiếm rộng hơn thẻ 317px ở 1024px.
- **Content:** danh sách dùng divider rất nhạt; biểu đồ dùng xanh hiện tại, xám dashed cho năm trước và khoảng trống thật cho dữ liệu chưa có.
- **Interaction:** hàng có drill-down là button đầy đủ; hàng chỉ hiển thị bị disabled và không giả vờ có tương tác.

### Buttons and chips

- **Primary:** xanh dữ liệu, chữ trắng, cao tối thiểu 36px, radius 7px, padding 6px 13px.
- **Text action:** chữ xanh 12px/650, gạch chân có offset 3px.
- **Comparison chip:** nền xanh nhạt, chữ xanh đậm, radius 6px; dấu × nằm sau nhãn.
- **State:** focus-visible luôn dùng outline chuẩn. Chuyển màu nền/chữ/viền trong 120ms để thao tác có xác nhận; không animation trang trí.

### Ranked bars and change indicators

- **Row:** ba vùng rank / nhãn-thanh / biến động, padding dọc 9px và divider nhẹ.
- **Bar:** track cao 4px, fill xanh trung, radius 2px; chiều dài tỷ lệ theo trị tuyệt đối lớn nhất trong tập đang hiển thị.
- **Change:** tăng dùng mũi tên lên và xanh lá; giảm dùng mũi tên xuống và đỏ; trung tính dùng dấu gạch và mực phụ. Khi mẫu số không hợp lệ, viết rõ “Chưa có kỳ trước”.

### Loading, empty, error, and partial data

- **Loading:** skeleton trắng có viền, ba khối cao 54px và pulse 1.4s; vùng có `aria-live`.
- **Empty:** surface trạng thái nêu không có số liệu và hướng người dùng đổi kỳ.
- **Error:** surface có `role="alert"`, thông báo ngắn và nút “Thử lại”.
- **Partial:** vẫn hiển thị dữ liệu thật, đồng thời nêu độ phủ và số địa bàn thiếu; không tạo dòng 0 thay cho quan sát thiếu.

### Detail drawer

- **Structure:** overlay navy trong suốt và drawer phải rộng `min(600px, 42vw)`, cao toàn viewport, z-index 61. Toàn màn hình dưới 768px.
- **Content:** giá trị chính 32px, metadata trong danh sách definition có divider; nguồn và ngữ cảnh bộ lọc hiện tại luôn có mặt.
- **Close:** nút 34px ở góc trên phải, có nhãn truy cập “Đóng bảng xem nhanh”.

### Scope and navigation


Địa bàn là một phép **đổi phạm vi**, không phải bộ lọc tinh chỉnh tại chỗ:

- Chọn một phường/xã → chuyển sang "Chi tiết địa bàn".
- Về toàn thành phố → quay lại "Tổng quan".
- Tab "So sánh hai kỳ" tự quản lý địa bàn nên không bị ép chuyển.
- **Không tab nào bị vô hiệu.** Người dùng vẫn mở được Tổng quan khi đang chọn
  một phường; thanh phạm vi nói rõ Tổng quan luôn tính cho toàn thành phố và mở
  lối tắt sang trang chi tiết.

**The Scope Bar Rule.** Thanh phạm vi có mặt trên cả ba tab, ở đúng một vị trí,
và luôn có lối quay lại. Một bộ lọc không được phép im lặng vô hiệu.

### Vùng chạm

Điều kiện là **`pointer: coarse`, không phải bề rộng màn hình**. Bề rộng không nói
được thiết bị nhập liệu là gì: laptop cảm ứng ở 1440px vẫn chạm bằng ngón tay,
còn người dùng chuột thu cửa sổ còn 500px thì không cần vùng chạm to.

Chọn theo **vai trò**, không theo tên class: `button`, `[role="button"]`,
`[role="tab"]`, `a[href]`, `select`, `input`, `summary`. Danh sách class cụ thể là
thứ đã để nút sắp xếp cột bảng cao 21px lọt lưới — nó không nằm trong danh sách,
thế là xong.

- Ô trong bảng dùng `table-layout: fixed` nên `min-height` không nâng được chiều cao hàng; nới bằng đệm dọc và cho nút chiếm trọn ô.
- `.dseg` cao 48px để nút bên trong đủ 44px sau lớp đệm.
- Nút đè lên bản đồ cần cả `min-width`.
- Đích chạm liền kề phải có khoảng hở: ngón tay không nhắm chính xác bằng con trỏ.

Dưới `hover: none`, affordance dựa vào nền `:hover` là vô hình — hàng bấm được
mang một mũi chevron thường trực thay thế.

**The Pointer Not Width Rule.** Kích thước đích chạm chốt theo loại con trỏ. Mọi
quy tắc chạm gắn vào `max-width` đều sai ở cả hai chiều.

**The Role Not Class Rule.** Quy tắc hệ thống chọn theo vai trò ngữ nghĩa. Danh
sách tên class là thứ sẽ lọt phần tử tiếp theo ai đó thêm vào.

### Chuyển động

Ngôn ngữ chuyển động cố ý gần như trống — đây là giao diện Operate, chuyển động
phục vụ phản hồi và tính liên tục, không phải biểu diễn.

- **Phản hồi** (120ms): chuyển nền/chữ/viền trên bề mặt bấm được. Trong dải phản hồi tức thì — đủ để mắt bắt được là có gì đó đáp lại, chưa đủ để cảm thấy chậm.
- **Tính liên tục** (260ms, `cubic-bezier(0.16, 1, 0.3, 1)`): drawer trượt 16px từ đúng cạnh nó neo vào. Chỗ **duy nhất** chuyển động làm việc giải thích quan hệ không gian. Scrim mờ dần 200ms.
- **Bản đồ** (250–450ms, d3): đổi màu bậc và phóng tới địa bàn đang chọn.
- **Biểu đồ** (420ms, Recharts): vẽ đường khi vào.

**The Reduced Motion Keeps Feedback Rule.** Giảm chuyển động nghĩa là **bớt**
chuyển động, không phải **tắt** phản hồi. Chặn theo *thuộc tính*: các thuộc tính
di chuyển trong không gian bị loại khỏi danh sách được phép chuyển tiếp, còn màu,
độ mờ và viền vẫn chuyển tiếp ở 120ms. Đặt mọi thứ về `0.01ms` là giết luôn tín
hiệu xác nhận thao tác — đúng thứ người bật cờ cần giữ nhất.

**The JS Motion Reads The Flag Rule.** Media query trong CSS **không** với tới
hoạt ảnh do JavaScript điều khiển. d3 và Recharts là vòng lặp `requestAnimationFrame`
thuần; chúng nhận cờ qua `useReducedMotion()` phía TypeScript. Mọi hoạt ảnh JS
thêm mới đều phải đi qua hook đó.

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
- **Do** định dạng số theo `vi-VN`, dùng tabular numerals và chọn **một** đơn vị cho cả cột, ghi ở đầu cột.
- **Do** chốt kích thước đích chạm theo `pointer: coarse` và chọn theo vai trò ngữ nghĩa, không theo tên class.
- **Do** cho mọi hoạt ảnh JavaScript đọc `useReducedMotion()`; media query CSS không với tới chúng.
- **Do** tính lại tỷ lệ tương phản khi đổi bất kỳ bậc mực nào.
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
- **Don't** dùng bậc "nghìn tỷ" hay mã ISO `VND`; thang tiền dừng ở "tỷ đồng".
- **Don't** để hai đơn vị tiền khác nhau trong cùng một cột số.
- **Don't** đặt `transition-duration: 0.01ms` cho toàn bộ dưới reduced-motion; chặn theo thuộc tính di chuyển và giữ phản hồi màu.
- **Don't** gắn quy tắc vùng chạm vào `max-width`; bề rộng màn hình không nói được thiết bị nhập liệu.
