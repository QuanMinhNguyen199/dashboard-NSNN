---
name: Quản lý nghiệp vụ Thuế TP Hà Nội
description: Bàn làm việc nghiệp vụ trên giấy ấm — khối có viền và bóng nhẹ, đỏ son và vàng lấy từ dấu nhận diện ngành Thuế.
colors:
  canvas: "#f5f4f3"
  surface: "#ffffff"
  surface-soft: "#f8f7f6"
  line: "#dfdcda"
  line-soft: "#eeebe9"
  control-line: "#cec7c9"
  control-line-hover: "#a99b9f"
  ink: "#292526"
  ink-2: "#565052"
  ink-3: "#71686b"
  brand: "#c92332"
  brand-strong: "#a71927"
  brand-soft: "#fff0f1"
  brand-edge: "#efc2c7"
  brand-gold: "#ffd348"
  focus: "#c92332"
  navy: "#302629"
  positive: "#28704b"
  positive-bg: "#eef7f1"
  warning: "#815b1c"
  warning-bg: "#faf4e8"
  critical: "#b13b37"
  critical-bg: "#fcf0ef"
  info: "#565052"
  info-bg: "#f2efef"
  state-edge: "#7d8a99"
  selection-bg: "#f7d9dd"
  scroll-thumb: "#cfc7ca"
  scroll-thumb-hover: "#afa2a7"
  on-navy-1: "#d8e5f2"
  positive-on-navy: "#7fd0a4"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(22px, 2vw, 26px)"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  subtitle:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  metric:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  section:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.005em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  row:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  micro:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.01em"
  nav:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  hairline: "2px"
  chip: "4px"
  control: "6px"
  panel: "10px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  row: "10px"
  gutter: "12px"
  panel: "14px"
  cell: "16px"
  stack: "18px"
  page: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-strong}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  button-quiet-hover:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  button-touch:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "44px"
    width: "44px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "32px"
  field-touch:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "0 14px 12px"
  panel-head:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.section}"
    padding: "13px 16px"
    height: "54px"
  summary-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
    padding: "9px 16px"
    height: "56px"
  summary-cell-with-note:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
    padding: "9px 16px"
    height: "72px"
  detail-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "9px 16px"
    height: "56px"
  table-header-cell:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink-2}"
    typography: "{typography.micro}"
    padding: "6px 12px"
    height: "34px"
  table-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "7px 12px"
    height: "38px"
  table-row-selected:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "7px 12px"
    height: "38px"
  row-select:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.chip}"
    padding: "7px 12px"
    height: "32px"
  badge-critical:
    backgroundColor: "{colors.critical-bg}"
    textColor: "{colors.critical}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 7px"
  badge-mock:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 7px"
  segmented-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-strong}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "40px"
  nav-group-label:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.micro}"
    padding: "12px 10px 4px"
  mobile-nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.nav}"
    padding: "5px 2px"
    height: "62px"
  brand-mark:
    backgroundColor: "{colors.brand-strong}"
    textColor: "{colors.brand-gold}"
    rounded: "{rounded.panel}"
    height: "30px"
    width: "30px"
  topbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "8px 20px"
    height: "60px"
  toast:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
    typography: "{typography.row}"
    rounded: "{rounded.panel}"
    padding: "9px 9px 9px 13px"
    height: "46px"
---

# Design System: Quản lý nghiệp vụ Thuế TP Hà Nội

## Overview

**Creative North Star: "Hồ sơ giấy ấm, đóng dấu đỏ"**

Đây là chuẩn mực của loại sản phẩm được thực thi đầy đủ, theo đúng thước đo thủ công đã chọn: dày thông tin mà vẫn tĩnh, bảng dài đọc được, số có trọng lượng, trạng thái rõ mà không ồn ào. Vị trí của điều hướng, bộ lọc và nút không đổi vì người dùng đã quen tay; thứ đổi là chất liệu.

Nền là một lớp giấy **ấm** (`canvas` xám ngả hồng rất nhạt), không phải xám xanh. Trên đó, mỗi khối nội dung là một tấm trắng **có viền 1px và một bóng hai tầng rất nhẹ**, bo 10px — khối được đóng khung rõ ràng, và độ sâu do viền cộng bóng gánh chứ không chỉ do bậc nền. Đỏ son và vàng lấy từ dấu nhận diện ngành Thuế: đỏ là màu thao tác duy nhất, vàng chỉ xuất hiện đúng một chỗ là con dấu "HN".

Điều hướng là một sidebar **trắng** viền phải, không phải một khối màu đặc. Mục đang mở nhận nền hồng nhạt, viền hồng và chữ đỏ đậm — một tín hiệu ba lớp thay cho vạch màu bên trái, vốn đã được gỡ hẳn. Con số tổng hợp giữ màu mực trung tính; màu trạng thái sống ở nhãn và ở thông báo, không tô cả khối số. Chuyển động được dàn dựng một lần khi vào trang, và hiệu ứng nhô chỉ dành cho thứ thật sự bấm được.

Palette được dựng theo ảnh tham chiếu logo do người dùng cung cấp, **không phải mã màu thương hiệu chính thức**. Khi có bộ màu chính thức, đây là chỗ đối chiếu lại.

**Key Characteristics:**

- Giấy ấm, không xám xanh: mọi bậc trung tính đều ngả đỏ.
- Khối có viền 1px cộng bóng hai tầng, bo 10px; khung là một phần của hệ.
- Đỏ son là màu thao tác duy nhất; vàng chỉ dành cho con dấu nhận diện.
- Trạng thái = chấm 6px + nhãn chữ; chip chỉ dành cho hai ngoại lệ đã ghi.
- Số tổng hợp mang màu mực trung tính, không mang màu trạng thái.
- Bảng là công dân hạng nhất: đầu bảng dính, hàng 38px, mỗi hàng bấm được có một đích bàn phím thật.
- Chỉ thứ bấm được mới nhô lên khi rê chuột.
- Từ 900px trở xuống: shell cảm ứng và cam kết 44px bắt đầu ở cùng một mốc.

## Colors

Bảng màu giấy ấm: năm bậc trung tính ngả đỏ, một đỏ son thao tác, một vàng nhận diện, và bốn cặp trạng thái đã được kéo về cùng độ ấm với nền.

### Primary

- **Đỏ son thao tác** (`brand`): nút chính, liên kết, caret và accent-color của ô nhập, bước duyệt hiện tại, mục bottom nav đang chọn, dải chỉ dẫn cuộn bảng, mũi tên hàng việc khi rê chuột.
- **Đỏ son đậm** (`brand-strong`): hover của nút chính, chữ của mục điều hướng đang mở, và nền của con dấu nhận diện.
- **Hồng giấy** (`brand-soft`): nền của mục điều hướng đang mở, hàng bảng đang chọn, hover của nút quiet, hover của mọi hàng bấm được, dải chỉ dẫn cuộn.
- **Viền hồng** (`brand-edge`): viền của mục điều hướng đang mở và của con dấu nhận diện.

### Secondary

- **Vàng dấu** (`brand-gold`): **chỉ một vai trò** — chữ và viền của con dấu "HN" trên nền đỏ đậm, ở sidebar và ở màn đăng nhập. Không dùng cho trạng thái, không dùng cho nhấn mạnh, và không bao giờ làm chữ trên nền trắng.
- **Xanh xác nhận** (`positive` / `positive-bg`): đã xong, dấu checklist, chấm timeline đã chạy, bước duyệt đã qua, icon empty state.
- **Nâu vàng cảnh báo** (`warning` / `warning-bg`): sắp đến hạn, cần kiểm tra.
- **Đỏ gạch can thiệp** (`critical` / `critical-bg`): quá hạn, thiếu dữ liệu, đang vướng, dải lỗi đăng nhập. Nhạt hơn và ngả gạch so với đỏ son thao tác, để hai vai trò không lẫn nhau.
- **Xám thông tin** (`info` / `info-bg`): đang xử lý, trạng thái trung tính có chủ đích. Đây là một cặp **trung tính**, không phải một màu — trạng thái "đang chạy" không cần một màu riêng.

### Neutral

- **Giấy nền** (`canvas`): nền toàn workspace, ấm và ngả hồng rất nhẹ.
- **Bề mặt** (`surface`): panel, dải tổng hợp, măng sét, sidebar, drawer, control.
- **Bề mặt chìm** (`surface-soft`): hover mục điều hướng, nền đầu bảng, ô nhập disabled, cột trái màn đăng nhập, nền nhãn "Mô phỏng" ở măng sét.
- **Viền khối** (`line`): mép của panel, dải tổng hợp, măng sét, sidebar và drawer.
- **Đường chia hàng** (`line-soft`): chia hàng và chia ô bên trong một khối.
- **Ba bậc mực** (`ink` / `ink-2` / `ink-3`): kết quả, mô tả, metadata — cả ba đều ấm, không bậc nào ngả xanh.
- **Hai bậc viền control** (`control-line` mặc định, `control-line-hover` khi rê chuột) — chỉ dùng cho control, không dùng cho nội dung.
- **Mực gần đen** (`navy`): nền của toast và của skip link. Tên token là di sản của hệ trước; giá trị hiện tại là một nâu gần đen thuộc họ ấm, không phải navy.
- **Bề mặt trình duyệt** (`selection-bg`, `scroll-thumb`, `scroll-thumb-hover`): vùng bôi đen hồng nhạt và thanh cuộn ấm — cũng là token, không để mặc định.

**The Warm Neutral Rule.** Mọi bậc trung tính trong hệ đều ngả đỏ. Một xám trung hoà hoặc xám xanh đặt cạnh `canvas` sẽ đọc ra màu lạ ngay, kể cả khi độ sáng khớp. Thêm một bậc trung tính thì lấy sắc độ từ `ink`, đừng lấy từ một bảng xám chung.

**The One Operational Red Rule.** Đỏ son là màu thao tác duy nhất: hành động, liên kết, điều hướng đang mở, tiến độ. Không có đỏ trang trí, và không có màu thao tác thứ hai.

**The Gold Is a Seal Rule.** Vàng chỉ sống trên con dấu nhận diện, luôn trên nền đỏ đậm. Nó không phải một bậc nhấn tự do, và nó không đủ tương phản để làm chữ trên nền trắng. Dùng vàng ở chỗ thứ hai là biến một dấu triện thành màu trang trí và mất luôn lý do nó có mặt.

**The Two Reds Don't Blur Rule.** Đỏ son thao tác và đỏ gạch can thiệp là hai vai trò tách bạch: một cái mời bấm, một cái báo hỏng. Chúng không được mượn giá trị của nhau, và đỏ can thiệp luôn đi kèm nhãn chữ đọc được.

**The Numbers Stay Neutral Rule.** Con số tổng hợp mang màu `ink`, kể cả khi hàng đó đang cảnh báo. Màu trạng thái nằm ở nhãn, ở badge và ở dải thông báo. Tô cả khối số theo trạng thái làm bốn ô tổng hợp biến thành một bảng đèn, và con số thôi là con số.

**The Two Hairlines Rule.** Đường kẻ có hai trọng số và chúng không thay nhau: `line` dựng mép khối, chân măng sét và viền sidebar; `line-soft` chia hàng và chia ô bên trong. Khi mọi đường trong một bảng nặng ngang nhau, mắt không còn biết đâu là mép khối.

## Typography

**Display Font:** không có. Hệ này không có vai trò display trang trí.

**Body Font:** stack hệ thống (`system-ui`, `-apple-system`, Segoe UI).

**Label/Mono Font:** `ui-monospace` / SFMono-Regular / Consolas cho mã lô và tên tài khoản mẫu.

**Character:** trung tính, chặt, đọc nhanh ở 10–14px. Phân cấp đến từ trọng lượng (400 / 500 / 550 / 600 / 650) và bậc mực, không từ kích thước lớn. Trọng số 650 là giọng "đậm" của hệ; 700 chỉ còn ở nhãn nhóm điều hướng và con dấu nhận diện.

### Hierarchy

Thang có **chín bậc**: 10 / 11 / 12 / 13 / 14 / 18 / 20 / 22 / clamp(22–26).

- **Headline** (650, `clamp(22px, 2vw, 26px)`, 1.25, -.02em): chỉ tiêu đề cột trái màn đăng nhập. Chữ lớn nhất tồn tại trong sản phẩm.
- **Title** (650, 22px, 1.25, -.02em): tiêu đề trang trong `page-intro`; 18px dưới 720px.
- **Subtitle** (650, 20px, 1.25, -.02em): tiêu đề form đăng nhập và tiêu đề màn từ chối quyền; 18px dưới 720px.
- **Metric** (650, 18px, 1.25, -.015em): mọi con số tổng hợp — dải KPI, dòng cộng, luồng xử lý. Không dùng ở đâu khác.
- **Section** (650, 14px, -.005em): tiêu đề panel.
- **Body** (400–500, 14px, 1.5): nội dung, ô nhập, ô bảng, giá trị trong lưới chi tiết.
- **Row** (600, 13px): nhãn nút, mục điều hướng, tên hàng việc / hàng nguồn / danh mục, mô tả trang, nội dung notice.
- **Label** (600, 12px): nhãn của mọi ô tổng hợp và ô chi tiết, nhãn badge, mã monospace trong bảng, ngữ cảnh măng sét.
- **Micro** (600–700, 11px): dòng phụ, metadata, đầu bảng (tracking `.01em`), nhãn control, nhãn nhóm điều hướng (700).
- **Nav** (600, 10px): **chỉ một vai trò** — nhãn mục bottom nav trên mobile.

**The Panel Title Sits Above the Row Rule.** Tiêu đề panel là 14px, cao hơn một bậc so với nội dung hàng (13px). Đầu khối phải thắng được hàng đầu tiên bên dưới nó; nếu không, cái viền quanh khối là thứ duy nhất nói rằng khối đã bắt đầu.

**The Documented Floor Rule.** 10px là sàn của thang và nó được ghi nhận chứ không giấu: nó chỉ mang nhãn mục bottom nav — chuỗi ngắn, cố định, đứng ngay dưới một icon 20px và luôn đi kèm `aria-label` đầy đủ. Đừng mở bậc này cho nội dung.

**The Metadata Doesn't Borrow Weight Rule.** Cỡ 18px thuộc về số tổng hợp. Giá trị trong lưới chi tiết là metadata nên dùng 14px, dù nó cũng là "một con số đứng dưới một cái nhãn". Cho metadata mượn cỡ metric là cho nó mượn trọng lượng nó không có.

**The One Ramp Through the Door Rule.** Màn đăng nhập chạy cùng thang chữ với các view bên trong; trần là 26px. Cửa vào không được hứa một giọng mà sản phẩm không giữ sau khi đăng nhập.

**The Tabular Number Rule.** `font-variant-numeric: tabular-nums` bật ở `body` cho toàn ứng dụng. Số trong bảng căn phải; định dạng `vi-VN`.

**The System Stack Rule.** Chữ dùng stack hệ thống và không tự host. Đây là cam kết thương hiệu đã ghi trong PRODUCT.md với ba căn cứ (bề mặt Operate, dấu tiếng Việt chồng tầng, mạng nội bộ). Không đề xuất webfont.

## Layout

Desktop: sidebar trắng cố định 252px với viền phải `line`; măng sét và workspace đều bù trái đúng 252px. Măng sét sticky, cao 60px (`--topbar-h`, dùng chung làm mốc cho đầu bảng dính), nền trắng, chân là một đường `line` cộng một bóng 1px rất mờ. Workspace padding `18px 20px 32px`, nội dung rộng tối đa 1540px, nhịp dọc giữa các khối là **18px** — rộng hơn khoảng cách bên trong khối (14px), vì khối đã có viền riêng nên hai khối cạnh nhau cần thở hơn.

Trang công việc dùng lưới `1.1fr / .9fr`; các cặp khác chia đôi. Dải tổng hợp và lưới chi tiết chia bốn cột bằng nhau; luồng phát hành bốn cột; luồng xử lý năm cột.

Có ba mốc và mỗi mốc có một việc:

- **1180px** — lưới hai cột thành một cột; luồng xử lý còn ba cột.
- **900px** — mốc **shell cảm ứng**: sidebar biến mất, bỏ bù trái, bottom nav xuất hiện với mỗi mục ≥62px, mục "Thêm" mở drawer trắng ≤320px. Cùng lúc và cùng mốc: mọi control lên 44px, và dải chỉ dẫn cuộn ngang hiện ra.
- **720px** — mốc **khổ hẹp**: măng sét thôi sticky và rút còn 56px, workspace lề 10px và chừa 82px cho bottom nav, nhịp dọc rút còn 12px, dải tổng hợp và lưới chi tiết thành 2×2, segmented đổi thành select có nhãn hiển thị, hàng bảng nở lên 44px, hai cột màn đăng nhập xếp dọc.

**The Square 44 Rule.** Cam kết 44px bắt đầu ở **900px, đúng cùng mốc với shell cảm ứng**, và áp theo **cả hai chiều** — `min-height` và `min-width`. Hai mốc này phải trùng nhau: khi shell đã nói "đây là thiết bị chạm" thì mọi thứ trong shell phải chạm được, nếu không iPad dọc ở 768px sẽ chạy bottom nav và drawer mà control vẫn cỡ chuột.

**The Fixed Furniture Rule.** Điều hướng, bộ lọc và nút giữ nguyên vị trí đã có. Cải thiện đi vào chất liệu và mức hoàn thiện, không đi vào việc xếp lại đồ đạc.

**The Structured Overflow Rule.** Không ép bảng nghiệp vụ thành card rời trên mobile. Bảng giữ `min-width: 780px`, nằm trong vùng cuộn có `tabIndex=0` **và có tên** (`role="region"` + `aria-label`), và dải "Vuốt ngang để xem thêm" hiện từ 900px — cùng mốc bảng bắt đầu cuộn ngang. Chỉ dẫn xuất hiện muộn hơn hiện tượng nó chỉ dẫn là một lời hứa lỡ.

## Elevation & Depth

Hệ này **có khung và có bóng**, và đó là quyết định định nghĩa chất liệu. Panel, dải tổng hợp và dải KPI đều mang viền 1px `line` cộng `--shadow-panel` — một bóng **hai tầng**: một tầng 1px sát mép để khối có chân, một tầng 5px/16px rất loãng để khối tách khỏi giấy. Không tầng nào đủ đậm để đọc ra "thẻ nổi"; cộng lại chúng đọc ra "một tờ đặt trên một tờ".

Độ sâu vì thế đến từ ba nguồn cùng lúc: viền, bóng hai tầng, và bậc giá trị trắng-trên-giấy-ấm.

### Shadow Vocabulary

- **Panel** (`box-shadow: 0 1px 2px rgb(41 37 38 / 5%), 0 5px 16px rgb(41 37 38 / 4%)`): mọi khối nội dung — panel, dải KPI, dòng cộng. Đây là bóng mặc định của hệ.
- **Overlay** (`box-shadow: 0 18px 48px #29252633`): drawer điều hướng và toast. Không dùng cho nội dung.
- **Masthead** (`box-shadow: 0 1px 3px rgb(41 37 38 / 3%)`): măng sét sticky, chỉ đủ để nội dung cuộn qua không dính vào nó.
- **Bottom nav** (`box-shadow: 0 -6px 20px #29252612`): thanh điều hướng dưới, nơi nội dung thật sự trôi bên dưới.
- **Control lift** (`0 1px 1px #29252614` primary, `0 1px 1px #2925260f` secondary): nút ở trạng thái nghỉ; mất khi `:active`.
- **Nav active** (`0 1px 2px rgb(41 37 38 / 4%)`): mục điều hướng đang mở, cùng bậc với tầng sát mép của bóng panel.
- **Segmented active** (`0 1px 2px #2925261f`): ô đang chọn trong segmented.
- **Interactive hover** (`0 3px 8px rgb(41 37 38 / 10%)` cộng `translateY(-2px)`): xem The Lift Means Clickable Rule.

### Named Rules

**The Framed Surface Rule.** Khối nội dung có mép được vẽ: viền 1px cộng bóng panel, bo 10px. Viền và bóng đi cùng nhau — bỏ viền để lại một khối trôi, bỏ bóng để lại một ô kẻ phẳng. Muốn tách nhóm bên trong một khối thì dùng `line-soft` hoặc khoảng trắng; đừng lồng một khối có viền vào trong một khối có viền.

**The Lift Means Clickable Rule.** Hiệu ứng nhô 2px cộng bóng chỉ dành cho thứ **thật sự bấm được**: hàng bảng có `row-select`, hàng việc dạng nút, và ô tổng hợp có hành động. Selector trong build nêu đích danh ba loại đó và loại trừ `:disabled`. Ô tổng hợp chỉ đọc, hàng nguồn chỉ đọc và khối lớn không nhô. Một khối nhô lên mà bấm vào không có gì xảy ra là một lời hứa hỏng, và người ngồi cả ca phải thử lại nó nhiều lần mỗi ngày.

**The Hover Is Not for Touch Rule.** Toàn bộ hành vi hover được bọc trong `(any-hover: hover) and (any-pointer: fine)`, và riêng phần dịch chuyển còn bọc thêm `prefers-reduced-motion: no-preference`. Trên thiết bị chạm, hiệu ứng nhô không tồn tại — nó chỉ kẹt lại sau một lần chạm.

**The Overlay Earns the Big Shadow Rule.** Chỉ thứ thật sự phủ lên nội dung mới được bóng lớn: drawer và toast. Panel giữ bóng panel và không bao giờ mượn bóng overlay.

**The One Rise Rule.** Đúng một khoảnh khắc chuyển động khi vào trang: cả `page-stack` nhô 4px trong 240ms với `--ease-out`, xuất phát từ opacity .55 chứ không phải 0, và chỉ khi `prefers-reduced-motion: no-preference`. Không có hiệu ứng vào theo từng khối. Ngoài nó, chỉ toast có entrance; phần còn lại chỉ có transition trạng thái 100–180ms, và không transition nào làm đổi kích thước bố cục. Cuộn lên đầu khi đổi view cũng đi qua cùng một cổng `prefers-reduced-motion`.

## Shapes

Góc bo có năm bậc: khối và toast 10px, control 6px, chip cùng đích bấm trong ô bảng 4px, nét mảnh nhất 2px, hình tròn thật 50% (ô checklist, chấm timeline, vòng bước duyệt, chấm badge). Không có pill.

Con dấu nhận diện là hình **vuông bo**, không phải hình tròn: 30px bo 8px trong sidebar, 38px bo 10px ở màn đăng nhập, chữ và viền vàng trên nền đỏ đậm. Đây là hình duy nhất trong hệ mang hai màu nhận diện cùng lúc.

Viền, nơi tồn tại, luôn là 1px: viền khối, viền control, viền thẻ tài khoản mẫu, viền mục điều hướng đang mở, viền vòng tiến trình. Ngoại lệ duy nhất là chấm timeline 11px với viền 2px, vì ở kích thước đó 1px không còn đọc ra hình tròn.

**The Dot Not Pill Rule.** Trạng thái thường trực là một chấm 6px `currentColor` cộng nhãn chữ, không nền, không viền. Hai ngoại lệ được ghi nhận và **chỉ hai**: `tone-critical` (việc cần can thiệp được phép to tiếng hơn) và cờ `mock` (cảnh báo thường trực, không phải trạng thái nghiệp vụ; nó bỏ luôn cái chấm vì nó không phải một trạng thái). Cả hai dùng chip 4px, padding `2px 7px`.

**The Quiet Mock Chip Rule.** Nhãn "Mô phỏng" ở măng sét mang bộ trung tính — chữ `ink-2` trên `surface-soft` với viền `line` — chứ không mang màu cảnh báo. Nó phải hiện thường trực ở mọi khổ màn và ở cả màn từ chối quyền; nhưng chính vì thường trực, cho nó màu cảnh báo là đặt một cảnh báo không bao giờ tắt cạnh tiêu đề, và người dùng học cách nhìn xuyên qua nó trong một ngày.

**The Selected State Is a Fill Rule.** Trạng thái "đang chọn" và "đang mở" nói bằng **nền** hồng giấy, cộng viền hồng ở nơi khối vốn đã có viền. Không có vạch màu dày quá 1px ở cạnh một khối nội dung, hàng danh sách, notice, dải lỗi hay thẻ đang chọn — kể cả khi dựng bằng `inset box-shadow`, vì đổi cách vẽ không đổi bản chất. Vạch 3px bên trái mục điều hướng của hệ trước đã được gỡ hẳn (`content: none`); đừng dựng lại nó.

## Components

### Buttons

- **Shape:** bo 6px, cao 32px, padding ngang 11px, chữ 13px/600, icon 17px đứng trước nhãn.
- **Primary:** nền đỏ son, chữ trắng, viền cùng màu, bóng 1px; hover sang đỏ đậm; `:active` mất bóng và lún `.5px`.
- **Secondary:** nền trắng, chữ mực chính, viền `control-line`, bóng 1px; hover đổi sang `control-line-hover` và nền `surface-soft`.
- **Quiet:** không nền, chữ đỏ son, padding ngang 8px; hover nền hồng giấy.
- **Disabled:** opacity `.45`, không bóng, không lún, `cursor: not-allowed`.
- **Cảm ứng (≤900px):** mọi nút nở lên 44×44 tối thiểu. Dưới 720px nút trong `page-actions`, `notice` và `table-footer` rộng hết dòng.

### Badges

- **Style:** không nền, không viền, không padding. Một chấm tròn 6px `currentColor` rồi đến nhãn chữ 12px/600, gap 6px.
- **Tones:** neutral (`ink-2`), positive, warning, info, critical — chỉ đổi màu chữ và chấm.
- **Exceptions:** `tone-critical` giữ chip nền `critical-bg`; cờ `mock` giữ chip trung tính (xem The Quiet Mock Chip Rule). `mock` là một prop của chính `Badge`, không phải một component riêng — mọi nhu cầu "chip" mới phải đi qua đây trước khi được phép thành một họ mới.
- **Meaning:** nhãn luôn là tiếng Việt nghiệp vụ ("Quá hạn", "Thiếu dữ liệu", "Chờ duyệt"). Màu là tầng tín hiệu thứ ba, sau chữ và hình.

### Cards / Containers

- **Corner Style:** 10px.
- **Background:** trắng trên giấy ấm.
- **Border:** 1px `line`. Đây là đặc điểm định nghĩa của hệ.
- **Shadow Strategy:** `--shadow-panel`, bóng hai tầng (xem Elevation & Depth).
- **Internal Padding:** đầu panel `13px 16px` cao 54px với chân đường `line`; thân `0 14px 12px`. Danh sách, bảng và lưới chi tiết bên trong tràn ra mép bằng `margin-inline: -14px` để hàng chạy hết chiều rộng khối (-12px dưới 720px).

### Summary rows (dải tổng hợp)

Một vai trò, một cách thể hiện: `KpiStrip` và `FigureLine` dùng **chung một khối luật**. Bốn ô chia bằng `line-soft` dọc trong một khối có viền và bóng panel, nhãn 12px nằm trên số 18px. Ô cao **56px**; khi có dòng phụ, `:has(small)` nâng cả hàng lên **72px** — độ cao do nội dung quyết định, không do một class modifier.

Con số giữ màu `ink` bất kể tone (xem The Numbers Stay Neutral Rule). Ô có `onSelect` là `<button>`, và chỉ ô đó mới nhận hover và hiệu ứng nhô. Mobile: 2×2, đường chia chuyển sang ngang.

### Detail grid (lưới chi tiết)

Khối chi tiết của bản ghi đang chọn, đặt ngay dưới bảng — nơi một hàng bảng dẫn tới, thay vì dẫn tới hư không.

- **Shape:** bốn cột chia bằng `line-soft` dọc, ô tối thiểu 56px, padding `9px 16px`, tràn ra mép khối như bảng. Hai cột dưới 720px, đường chia chuyển sang ngang.
- **Type:** nhãn 12px/600 `ink-3` nằm trên giá trị **14px/500** `ink` — cỡ body, không phải cỡ metric. Dòng phụ trong giá trị là 11px/400.
- **Nội dung:** chỉ trình bày dữ liệu đã có và quy tắc đang chi phối bản ghi. Không dựng nút hành động cho một nghiệp vụ chưa được mô tả.

### Tables

- **Structure:** `min-width: 780px`; vùng cuộn `table-wrap` có trần `min(62vh, 560px)` — chính trần này là điều kiện để `th` dính được, vì `panel` đã `overflow: hidden`.
- **Naming:** mỗi vùng cuộn là một `role="region"` có `aria-label` lấy từ prop `label` của `TableWrap`. Vùng cuộn đã là điểm dừng Tab thì phải có tên.
- **Header:** dính đỉnh vùng cuộn, cao 34px, nền `surface-soft`, chữ 11px/650 `ink-2`, chân đường `line`, mọi `th` mang `scope="col"`.
- **Rows:** 38px, chia bằng `line-soft`, hàng cuối bỏ đường; 44px dưới 720px. Hàng đang chọn nhận nền hồng giấy và `font-weight: 500`. Chỉ hàng có `row-select` mới đổi con trỏ, đổi nền và nhô khi rê chuột.
- **Alignment:** nhãn trái, số phải (`.num`), boolean và dấu nguồn căn giữa (`.center`). Dòng phụ 11px muted nằm dưới nội dung chính.
- **Footer:** một hàng kết quả cộng hành động, chân là đường `line-soft` phía trên; xếp dọc dưới 720px.

### Row select (đích bàn phím của hàng bảng)

Nút nằm trong ô đầu tiên của mỗi hàng bấm được. Nó trông y hệt nội dung ô mà nó thay thế: nền trong suốt, `font: inherit`, bo 4px, vòng focus vẽ vào trong (`outline-offset: -2px`).

- **Cách nó không làm hàng cao thêm:** margin âm `-7px -12px` cộng padding bù `7px 12px` đúng bằng padding của ô, nên nút phủ trọn ô mà chiều cao hàng không đổi một pixel. Đặt `min-height` thẳng lên nút mà không bù margin thì hàng nở ra, và đổi mật độ bảng là thứ không được phép làm.
- **Kích thước:** 32px trên desktop — đúng chiều cao control của hệ — và 44px từ 900px xuống.
- **Vì sao là nút chứ không phải `role="button"` trên `<tr>`:** cả hàng vẫn bấm được bằng chuột theo quy ước của người dùng, và chính `tr:has(.row-select)` là thứ cấp con trỏ, nền hover và hiệu ứng nhô cho cả hàng. Nhưng gắn role lên `<tr>` phá ngữ nghĩa bảng và làm trình đọc màn hình mất cả lưới. Hai yêu cầu này không xung đột khi đích bàn phím là một control thật bên trong ô.

### Inputs / Fields

- **Style:** cao 32px, nền trắng, viền `control-line` 1px, bo 6px; select `min-width: 150px` và padding phải 28px chừa mũi tên. 44px từ 900px xuống; ô nhập màn đăng nhập luôn 44px.
- **Hover / Focus:** viền sang `control-line-hover`; focus dùng outline 2px, offset 2px, bo theo radius control. Ô tìm kiếm chuyển outline lên wrapper bằng `:focus-within` và làm viền trong suốt để không có hai vòng chồng nhau.
- **Disabled:** nền `surface-soft`, chữ `ink-2`, `opacity: 1` — ô cố định vẫn phải đọc được.
- **Browser surfaces:** `caret-color` và `accent-color` theo đỏ son; `::placeholder` dùng `ink-3` với opacity 1; `::selection` là chữ mực gần đen trên hồng nhạt; thanh cuộn 10px, thumb ấm cắt viền 3px trong suốt và có bậc hover riêng.

### Segmented

Track `line` bo 10px, pill trong bo 6px cao 32px (44px từ 900px xuống). Ô đang chọn nhận nền trắng, viền `state-edge` và bóng 1px — nền trắng trên track xám nhạt không tự đủ ranh giới, nên viền là phần bắt buộc chứ không phải trang trí. Dưới 720px cả nhóm đổi thành một `<select>` có nhãn **hiển thị**, không phải một nhãn ẩn.

### Navigation

- **Desktop:** sidebar trắng 252px với viền phải `line`. Nhãn nhóm 11px/700 `ink-3`, không viết hoa. Mục cao 40px bo 6px, chữ `ink-2` weight 550, viền trong suốt giữ sẵn chỗ để trạng thái chọn không làm xê dịch. Mục đang mở nhận **ba lớp cùng lúc**: nền hồng giấy, viền hồng, chữ đỏ đậm — cộng icon đỏ son và một bóng 1px. Không có vạch trái.
- **Mobile:** bottom nav tối đa sáu cột, mỗi mục ≥62px, nhãn 10px, `aria-current="page"` ở mục đang mở; mục đang chọn đổi chữ đỏ và `border-top: 2px` đỏ. Đây là bề mặt duy nhất trong hệ dùng blur, vì nội dung thật sự cuộn bên dưới nó.
- **Drawer là dialog thật:** drawer trắng viền phải, `role="dialog"`, `aria-modal`, khoá cuộn body, đưa focus vào nút đóng, bẫy Tab/Shift+Tab, Escape hoặc scrim để đóng, trả focus về đúng trigger. Cả hai trigger mang `aria-expanded` và `aria-haspopup="dialog"`. Khi drawer mở, sidebar, măng sét, workspace và bottom nav đều nhận `inert` — bẫy Tab bằng JS không chặn được tìm-trong-trang hay rotor của trình đọc màn hình.
- **Skip link:** liên kết tới `#workspace`, chỉ hiện khi nhận focus, cao 44px, nền mực gần đen. Điều hướng có tám mục cộng nút đăng xuất; không có lối tắt thì mỗi lần đổi màn là chín lần Tab.
- **Icons:** bộ icon là SVG nội tuyến một nét, `stroke-width 1.7`, viewBox 24, đầu nét tròn, mặc định 20px (17px trong nút, 15px trong ô nhỏ), `aria-hidden`. Chỉ dùng ở điều hướng và ở thao tác cần nhận diện — trang công việc đã bỏ icon cảnh báo cạnh từng hàng vì trạng thái đã có nhãn chữ. Không dùng font icon hay ký tự glyph.

### Approval flow (luồng phát hành)

Bốn bước chia đều, mỗi bước một vòng tròn 26px viền `state-edge` nối bằng đường `line` 1px. Bước hiện tại: vòng đặc màu đỏ son. Bước đã qua: vòng đặc và đường nối màu xác nhận. Sơ đồ đọc trạng thái của báo cáo **đang chọn** — thao tác Duyệt và Phát hành đổi trạng thái thật trong phiên, ghi thêm một phiên bản có tên người và thời điểm, rồi đẩy sơ đồ sang bước kế. Một nút chỉ phát toast mà không đổi gì là thứ dạy người dùng đừng tin toast.

Trạng thái không bao giờ chỉ nằm ở màu: bước hiện tại mang `aria-current="step"` và mỗi bước có một dòng `sr-only` nói nó đang ở đâu trong chuỗi. Toàn bộ sơ đồ nằm trong một `<details>` thu gọn; thao tác duyệt/phát hành và lịch sử phiên bản vẫn hiển thị ngoài nó. Dưới 720px sơ đồ xếp dọc và đường nối xoay đứng.

### Feedback

- **Toast:** cố định góc phải dưới, nền mực gần đen, chữ trắng, bo 10px, bóng overlay, vào bằng 8px/220ms; nút đóng 30px. Hẹn giờ 4,2 giây **dừng khi rê chuột hoặc khi focus vào toast**, và huỷ khi component unmount — một thông báo ghi thời điểm và người duyệt là thứ cần đọc kỹ, không phải thứ biến mất giữa chừng. Mobile nâng lên trên bottom nav và safe area.
- **Notice:** cao ≥44px, bo 6px, padding `10px 13px`, nền nhạt mang màu mức độ, nhãn đậm mang màu mức độ, phần giải thích dùng `ink-2`. Không viền, không vạch. Dưới 720px nhãn và nội dung xuống dòng riêng, nút rộng hết dòng.
- **Empty state:** căn giữa, padding 28px, icon positive, một dòng kết luận và một dòng giải thích.

### Login (cùng hệ, không phải ngoại lệ)

Hai cột `minmax(340px, 42%) / 1fr`: cột trái nền `surface-soft` với viền phải `line`, mang con dấu nhận diện, headline ≤26px và ghi chú dữ liệu mô phỏng; cột phải trắng mang form. Không có eyebrow trên tiêu đề. Ô nhập và nút gửi cao 44px, bo 6px. Dải lỗi là nền `critical-bg` với chữ `critical`, mang `role="alert"`, **không vạch trái**. Thẻ tài khoản mẫu cao 68px (78px khi có dòng quyền), viền 1px `line` cộng bóng 1px, `aria-pressed` cho trạng thái chọn; trạng thái chọn đổi viền sang đỏ son và nền sang hồng giấy. Dưới 720px hai cột xếp dọc và cột trái rút còn dải ≥190px.

### No access (màn từ chối quyền)

Một trạng thái hợp lệ của sản phẩm, không phải trang lỗi: khối trắng ≤560px bo 10px trên giấy ấm, dùng đúng token và thang chữ của hệ. Nó là màn giữ chỗ trong lúc vai Lãnh đạo nhà nước được chuyển sang Dashboard Thu NSNN, và là lối thoát khi chuyển hướng không tới nơi. Vì nằm ngoài Shell, nó **tự mang** con dấu nhận diện và nhãn "Mô phỏng" — màn này nêu đích danh một con người và một cơ quan, và là màn dễ bị chụp gửi đi nhất. Dòng "Đang mở Dashboard…" có `role="status"`; hai lối đi là một nút primary và một nút secondary cùng hàng.

## Do's and Don'ts

### Do:

- **Do** giữ mọi bậc trung tính trong họ ấm; lấy sắc độ từ `ink`, đừng lấy từ một bảng xám chung.
- **Do** cho khối nội dung cả viền 1px lẫn bóng panel; hai thứ đó đi cùng nhau.
- **Do** giữ đỏ son là màu thao tác duy nhất, và giữ vàng ở đúng con dấu nhận diện trên nền đỏ đậm.
- **Do** để con số tổng hợp mang màu mực trung tính; màu trạng thái sống ở nhãn và thông báo.
- **Do** chỉ cho hiệu ứng nhô vào thứ thật sự bấm được, và bọc nó trong `any-hover`/`any-pointer` cộng `prefers-reduced-motion`.
- **Do** nói "đang chọn" bằng nền hồng giấy, cộng viền hồng ở nơi vốn đã có viền.
- **Do** để độ cao ô tổng hợp chạy theo nội dung qua `:has(small)` (56px / 72px) thay vì thêm class biến thể.
- **Do** cho bảng dài một đầu bảng dính trong chính vùng cuộn có trần chiều cao, `scope="col"` ở mọi `th`, và một `aria-label` cho vùng cuộn.
- **Do** cho mỗi hàng bảng bấm được một đích bàn phím thật bên trong ô đầu, dựng bằng margin âm bù padding để hàng không cao thêm.
- **Do** giữ cam kết 44px và mốc shell cảm ứng ở **cùng một breakpoint** (900px).
- **Do** giữ đúng một khoảnh khắc chuyển động khi vào trang, và gate cả nó lẫn `scrollTo` theo `prefers-reduced-motion`.
- **Do** theme cả những bề mặt trình duyệt vẽ hộ: selection, caret, accent, placeholder, vòng focus, thanh cuộn.
- **Do** để trạng thái nói bằng ít nhất hai tầng: `aria-current` cộng `sr-only` bên cạnh màu, không bao giờ chỉ màu.
- **Do** cắt nhánh nền khỏi cây trợ năng bằng `inert` khi drawer mở, ngoài bẫy Tab bằng JS.
- **Do** giữ màn đăng nhập và màn từ chối quyền trên cùng token và cùng thang chữ với các view bên trong.

### Don't:

- **Don't** đặt eyebrow hay dòng nhãn nhỏ phía trên bất kỳ tiêu đề nào — măng sét, trang, màn đăng nhập hay màn từ chối quyền. Tiêu đề tự đứng được.
- **Don't** đưa một xám trung hoà hay xám xanh vào bảng trung tính; nó đọc ra màu lạ ngay cạnh giấy ấm.
- **Don't** dùng vàng ở chỗ thứ hai ngoài con dấu nhận diện, và đừng đặt vàng làm chữ trên nền trắng.
- **Don't** tô cả khối số theo trạng thái; bốn ô tổng hợp không phải một bảng đèn.
- **Don't** cho hiệu ứng nhô vào khối lớn, ô tổng hợp chỉ đọc hay hàng nguồn chỉ đọc.
- **Don't** vẽ vạch màu dày quá 1px ở cạnh một khối nội dung, hàng đang chọn, notice, dải lỗi hay thẻ đang chọn — kể cả dựng bằng inset shadow; vạch điều hướng cũ đã được gỡ, đừng dựng lại.
- **Don't** lồng một khối có viền vào trong một khối có viền; bên trong dùng `line-soft` hoặc khoảng trắng.
- **Don't** cho panel mượn bóng overlay; bóng lớn chỉ dành cho drawer và toast.
- **Don't** cho nhãn "Mô phỏng" màu cảnh báo; một cảnh báo thường trực có màu là một cảnh báo người dùng học cách bỏ qua.
- **Don't** mở rộng danh sách ngoại lệ chip quá hai mục đã ghi.
- **Don't** thêm cỡ chữ ngoài chín bậc, và đừng mượn cỡ 18px cho metadata.
- **Don't** dùng bậc 10px cho gì khác ngoài nhãn bottom nav.
- **Don't** đặt `role="button"` lên `<tr>`; nó phá ngữ nghĩa bảng.
- **Don't** để mốc chạm lệch khỏi mốc shell, và đừng để chỉ dẫn cuộn xuất hiện muộn hơn hiện tượng nó chỉ dẫn.
- **Don't** làm mờ nền măng sét; blur chỉ tồn tại ở bottom nav mobile.
- **Don't** thêm hiệu ứng vào cho từng khối; một trang chỉ nhô lên một lần.
- **Don't** đưa webfont vào sản phẩm; stack hệ thống là quyết định đã cân nhắc.
- **Don't** đổi vị trí điều hướng, bộ lọc hay nút mà người dùng đã quen tay.
- **Don't** ép bảng nghiệp vụ thành card rời trên mobile hoặc giấu việc bảng cuộn ngang.


## Sidebar theo ảnh tham chiếu — 29/09/2026

Giữ nguyên palette hiện hành. Sidebar và drawer dùng nền chrome đỏ sẫm, dấu nhận diện tròn, nhóm điều hướng tách bằng khoảng cách. Bỏ icon trong danh sách sidebar; thanh điều hướng mobile vẫn giữ icon để dễ nhận diện trong không gian hẹp.

Mục đang chọn có nền trắng, chữ brand-strong, bo 4px; bỏ vạch vàng bên trái. Mục chưa chọn dịch ngang 3px khi hover bằng chuột, 140ms. Chuyển màn dùng workspace-enter 200ms, dịch ngang 8px và fade; chỉ nội dung thay đổi chuyển động, khung/sidebar đứng yên. Bấm lại mục hiện tại không tạo history entry hoặc chạy lại animation. prefers-reduced-motion bỏ chuyển động.


## UX remediation — 29/09/2026 (ưu tiên hơn mô tả cũ)

- Panel và dải tổng hợp: viền 1px var(--line), shadow 0 1px 2px / 5% + 0 5px 14px / 4%. Panel ngoài không có hover lift.
- Mục sidebar chưa chọn dùng font-weight 400; mục chọn 600. Bỏ chữ HN giả lập logo, dùng tên cơ quan cho tới khi có asset logo phù hợp.
- Thông tin phụ quan trọng: 12px. Nhãn nguồn vẫn là 11px; chỉ giữ mã nguồn cần cho việc đối chiếu.
- Tổng hợp Workbench mobile: 2×2 hàng gọn cao tối thiểu 44px, nhãn và số cùng dòng; công việc xuất hiện sớm hơn.
- Form tạo báo cáo: dialog bo 12px, tên + chu kỳ + kỳ, validate trường bắt buộc; Escape/Hủy trả focus; Tab giữ trong form. Bản nháp có bản ghi và lịch sử v1, lưu sessionStorage theo tài khoản; không tự nhận đã chạy dữ liệu.
- Chức năng demo chưa triển khai không thông báo giả rằng đã hoàn thành.
- Báo cáo đo: UX-MEASUREMENT.md. Kiểm tra lặp lại: node scripts/measure-ux.mjs.
- Biểu trưng Thuế Nhà nước dùng ảnh nội bộ `public/tax-logo.png` tại sidebar, drawer, đăng nhập và màn từ chối quyền; nguồn ảnh: biểu tượng ứng dụng eTax Mobile do cơ quan Thuế phát hành trên App Store. Favicon là `public/tax-favicon.svg`, bản rút gọn chỉ giữ vòng tròn, sao và bông lúa để đọc rõ ở 16–32px.


## Phân cấp điều hướng — 29/09/2026

Sidebar được chia thành ba nhóm ngữ nghĩa Điều hành / Nghiệp vụ / Dữ liệu. Tên nhóm 10px, viết hoa, letter-spacing .1em và dùng mực `--on-chrome-3`; tên mục 14px và dùng mực sáng hơn. Không có đường chia ngay trên Điều hành; hai nhóm sau có khoảng cách dọc 24px và đường chia trắng mờ 1px, cách chữ nhóm 20px. Mục đang chọn dùng nền trắng, chữ đỏ sẫm; hover mục khác dùng trắng trong suốt. `role=group` và nhãn riêng cho mỗi nhóm giúp trình đọc màn hình nhận ra cấu trúc.

## Rà soát nội dung các tab — 29/09/2026

Thứ bậc màn hình là tiêu đề và hành động chính → số liệu tổng hợp hoặc cảnh báo cần xử lý → bảng/danh sách chính → chi tiết bản ghi đang chọn. Bỏ mô tả trang lặp lại tên tab, subtitle chỉ giải thích cách đọc chính bảng, và helper text trùng cột hoặc trạng thái. Giữ thời điểm dữ liệu, mã nguồn nghiệp vụ và thông báo về quy tắc chưa có hiệu lực vì chúng ảnh hưởng cách hiểu số liệu. Trên bảng tương tác, hover là giấy xám ấm (`--hover-surface`), đang chọn là hồng giấy (`--selected-surface`); hover hàng đang chọn giữ nguyên màu đang chọn.
