---
name: Quản lý nghiệp vụ Thuế TP Hà Nội
description: Bàn làm việc nghiệp vụ dùng chung bảng màu navy, xanh dữ liệu và trung tính của Dashboard Thu NSNN.
colors:
  canvas: "#f2f5f9"
  surface: "#ffffff"
  surface-soft: "#f7f9fc"
  surface-tint: "#eef4fc"
  hover-surface: "#f7f9fc"
  selected-surface: "#dbe8f8"
  selection-bg: "#dbe8f8"
  line: "#dbe3ed"
  line-soft: "#eaeff6"
  control-line: "#c6d2e0"
  control-line-hover: "#86b6ef"
  state-edge: "#75869b"
  ink: "#16263c"
  ink-2: "#485666"
  ink-3: "#63707f"
  chrome: "#0e2a47"
  brand: "#1657a8"
  brand-strong: "#1c5cab"
  focus: "#1657a8"
  focus-on-chrome: "#ffffff"
  positive: "#187044"
  positive-bg: "#eaf4ee"
  warning: "#7a5a12"
  warning-bg: "#fdf5dd"
  critical: "#b3352f"
  critical-bg: "#fdefed"
  info: "#1657a8"
  info-bg: "#eef4fc"
  on-chrome-1: "#ffffff"
  on-chrome-2: "#d3e1f0"
  on-chrome-3: "#86b6ef"
  on-chrome-note: "#dbe8f8"
  positive-on-chrome: "#ffffff"
  data: "#1657a8"
  data-secondary: "#3987e5"
  data-family: "#86b6ef"
  data-reference: "#75869b"
  data-track: "#e7edf5"
  scroll-thumb: "#c3cedd"
  scroll-thumb-hover: "#9aa9bd"
typography:
  display:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(22px, 2vw, 26px)"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  metric:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-strong:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "normal"
  lead:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  column-head:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "0.01em"
  nav-group:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  panel: "10px"
  control: "6px"
  chip: "4px"
  nav: "4px"
  dialog: "12px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  xxl: "16px"
  xxxl: "18px"
  gutter: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-strong}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  button-quiet-hover:
    backgroundColor: "{colors.surface-tint}"
    textColor: "{colors.brand}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "0 14px 12px"
  panel-head:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "13px 16px"
    height: "54px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "32px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.on-chrome-1}"
    typography: "{typography.body}"
    rounded: "{rounded.nav}"
    padding: "0 10px"
    height: "38px"
  nav-item-hover:
    backgroundColor: "#ffffff14"
    textColor: "#ffffff"
  nav-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand-strong}"
    rounded: "{rounded.nav}"
    padding: "0 10px"
    height: "38px"
  badge-critical:
    backgroundColor: "{colors.critical-bg}"
    textColor: "{colors.critical}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 7px"
  badge-mock:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 7px"
  kpi:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
    padding: "9px 16px"
    height: "56px"
  toast:
    backgroundColor: "{colors.chrome}"
    textColor: "#ffffff"
    typography: "{typography.body-strong}"
    rounded: "{rounded.panel}"
    padding: "9px 9px 9px 13px"
    height: "46px"
---

# Design System: Quản lý nghiệp vụ Thuế TP Hà Nội

## Overview

**Creative North Star: "Bàn làm việc trên hệ màu NSNN"**

Đây là bàn làm việc nghiệp vụ, không phải dashboard quan sát. Tax Ops dùng chung palette của Dashboard Thu NSNN để hai ứng dụng trong cùng hệ sinh thái nhận diện nhất quán: navy thể chế (`--chrome #0e2a47`) làm khung điều hướng và vùng nhận diện; nền xám xanh (`--canvas #f2f5f9`) cùng bề mặt trắng dành cho nội dung; xanh thương hiệu (`--brand #1657a8`) dành cho hành động.

Thang xanh NSNN dùng cho hành động và dữ liệu; trạng thái tăng/giảm, cảnh báo và lỗi tiếp tục có màu semantic riêng. Logo Thuế hiện hữu được giữ nguyên, nhưng màu logo không còn được dùng làm màu giao diện thay thế cho palette chung.

Mật độ cao và tĩnh. Thước đo là Stripe Dashboard: bảng dài đọc được, số có trọng lượng, trạng thái rõ mà không ồn. Sản phẩm đi theo chuẩn mực của loại sản phẩm một cách có chủ đích — đây là lựa chọn đã ghi trong PRODUCT.md, không phải mặc định do thiếu quyết định — nên quy ước phải được thực thi đầy đủ, không mỉa mai và không lén cài nét lạ. Lằn ranh người dùng đặt ra vẫn đứng: giao diện không được trông như sản phẩm tiêu dùng.

**Key Characteristics:**
- Navy thể chế làm khung; nền xám xanh, bề mặt trắng và đường viền xanh xám tạo lớp nội dung.
- Xanh thương hiệu dành cho hành động; thang xanh dữ liệu đơn sắc dành cho đại lượng; trạng thái giữ ngôn ngữ semantic riêng.
- Một bộ chữ duy nhất, Public Sans, tự host trong mã nguồn; chữ số dùng `tabular-nums` trên toàn thân trang.
- Khối nội dung có viền mảnh 1px và bóng hai lớp rất nhẹ; không có thẻ nổi.
- Bậc chữ ngắn (10 → 22px, thêm một bậc `clamp` tới 26px ở màn đăng nhập); phân cấp do đường kẻ và cân nặng gánh.
- Bàn phím và cảm ứng là điều kiện: focus 2px trên mọi thứ bấm được, 44px tối thiểu từ 900px trở xuống.
- Không có tràn ngang ở bất kỳ khổ nào: mọi rãnh lưới chứa bảng đều khai báo cơ sở 0.
- Không còn lớp phủ nào: mọi thứ từng mở trong hộp thoại nay là khối trong luồng trang, và trạng thái màn nằm trong địa chỉ.

## Địa chỉ và lớp phủ

Hai quyết định dưới đây đi liền nhau và ràng buộc mọi màn về sau.

### Named Rules

**The No-Overlay Rule.** Không màn nào được mở nội dung trong `<dialog>`, lớp phủ, popup hay ngăn trượt phủ lên trang. Bản mẫu này sẽ được dựng lại trên nền khác, nơi trợ lý đọc và trình bày giao diện, nên lớp phủ mang ba cái giá:

1. Nội dung trong lớp phủ **không lọt vào ảnh chụp toàn trang**, bản xuất PDF hay bản bàn giao thiết kế — nó đơn giản là vô hình trong mọi bản chụp tĩnh.
2. `<dialog>`, `::backdrop`, bẫy focus và `z-index` là **giả định về nền web**. Một khối trong luồng trang thì nền nào dựng được `div` là chạy được.
3. Lớp phủ **không có địa chỉ**, nên không ai gửi được liên kết mở thẳng tới nó.

Ngoài ba cái giá chung, mỗi lớp phủ còn che mất đúng thứ người dùng cần nhìn lúc ấy: hộp lý do trả lại che bảng số mà lý do đang nói về; ngăn chi tiết hồ sơ che bảng vừa chọn dòng trong đó; hộp tải tệp che danh sách lô đang thiếu dữ liệu.

Thay vào đó: khối mở ra **trong luồng trang, ngay dưới thứ mở nó**, mang `tabIndex={-1}` và nhận focus khi hiện, đóng bằng nút Đóng và bằng Escape, trả focus về chỗ vừa bấm. Danh sách thả xuống vẫn được định vị tuyệt đối trong ô chứa của nó — đó không phải lớp phủ — nhưng đóng bằng người nghe `pointerdown` chứ không bằng một tấm màn `position: fixed`.

Hai thứ được phép nổi lên vì chúng không mang nội dung phải đọc kỹ: toast thông báo, và drawer điều hướng ở khổ điện thoại.

**Ngoại lệ thứ ba — chi tiết một bản ghi (chốt 07/10/2026).** Người dùng quyết định: bấm một dòng trong danh sách thì chi tiết của nó mở trong **ngăn trượt từ mép phải**, không phải một khối trong luồng trang. Áp cho danh sách lượt chạy ở Tình trạng dữ liệu và danh sách NNT của QL3.

Quyết định này được ghi lại thay vì tranh luận lại, nhưng nó KHÔNG mở cửa cho lớp phủ nói chung. Ba cái giá ở trên vẫn còn nguyên, và ngoại lệ chỉ đứng vững khi trả lại được hai trong ba:

- **Địa chỉ phải có.** Đây là cái giá nặng nhất và là cái duy nhất bắt buộc phải trả: dòng đang mở nằm trong `so=`, nạp lại trang thì ngăn mở lại đúng bản ghi ấy, và gửi liên kết đi thì người nhận thấy đúng cái đang bàn. Một ngăn trượt không có địa chỉ là vi phạm, không phải ngoại lệ.
- **Một đường dựng duy nhất.** Mọi ngăn trượt đi qua `CaseLayout presentation="drawer"`. Dựng ngăn thứ hai cho một màn khác là nhân đôi số chỗ phải kiểm mỗi lần đổi luật bố cục.
- **Chỉ cho CHI TIẾT, không cho HÀNH ĐỘNG.** Hộp lý do trả lại, ô xác nhận trước khi chốt, hộp tải tệp vẫn nằm trong luồng trang. Chi tiết là thứ để đọc; ba thứ kia là thứ để quyết, và người quyết cần còn nhìn thấy bảng số lúc quyết.

Cái giá còn lại — không lọt vào ảnh chụp tĩnh — chấp nhận, vì nội dung trong ngăn luôn có đường khác để tới: bản xuất Excel mang đủ mọi cột mà ngăn bày.

Lý do đổi, ghi lại để người sau không lật ngược: bản trước của danh sách NNT đặt chi tiết thành **cột cố định bên phải**. Cột ấy ăn 30% bề ngang suốt thời gian kể cả khi người dùng chỉ đang đọc bảng, và dưới 1361px nó rơi xuống dưới bảng — tức cùng một thao tác cho ra hai bố cục khác nhau tùy bề rộng màn. Ngăn trượt cho bảng giữ trọn bề ngang ở mọi khổ và chỉ xuất hiện khi được yêu cầu.

**The URL Is The State Rule.** Những mẩu trạng thái người khác cần dẫn tới đều nằm trong query string, đọc lúc mở màn và ghi lại khi đổi (`state/diaChi.ts`): `ky`, `donvi`, `muc`, `moc`, `so`, `trang`, `xem`. Giá trị mặc định **không** được ghi ra, để địa chỉ ngắn và không khóa cứng mặc định hôm nay. Đổi màn thì dọn sạch tham số của màn cũ.

Lý do là trợ lý: người dùng hỏi trên nền AI, trợ lý phải trả lời bằng một liên kết mở đúng kỳ, đúng mục, đúng sheet đang bàn. Một trạng thái chỉ sống trong bộ nhớ của tab là một trạng thái không nói ra được.

Ràng buộc đi kèm, không được nới: **địa chỉ chỉ ĐỌC trạng thái, không thực hiện hành động.** Không tham số nào duyệt, chốt số hay gửi đi. Mở một liên kết là xem; chuyển tiếp liên kết cho người khác không được phép biến thành người đó duyệt hộ — QR-03 còn cấm cả người lập tự duyệt bản của mình. Vì cùng lý do, một ô nhập đang mở dở (lý do trả lại, tải tệp) **không** vào địa chỉ: nó là hành động, không phải thứ đang xem.

## Colors

Tax Ops và Dashboard Thu NSNN dùng chung bảng màu semantic. Màu xác lập thẩm quyền và điều hướng; phần lớn diện tích vẫn là nền sáng, còn màu bão hòa chỉ xuất hiện khi mang ý nghĩa.

### Brand and Data
- **Navy thể chế** (`--chrome #0e2a47`): sidebar, drawer, cột nhận diện đăng nhập, toast và skip-link. Đây là khung điều hướng, không phải dark theme.
- **Xanh thương hiệu** (`--brand #1657a8`): nút chính, liên kết, tab/mục được chọn, focus trên nền sáng và thao tác có thể bấm. `--brand-strong #1c5cab` dành cho hover/active.
- **Thang dữ liệu xanh**: `--data-primary #1657a8`, `--data-secondary #3987e5`, `--data-family #86b6ef` và `--data-reference #75869b`. Đại lượng cùng hệ dùng chung ngôn ngữ xanh; xanh lá/đỏ không dùng làm màu trang trí cho biểu đồ.

### Status
- **Xanh xác nhận** (`--positive #187044` / `--positive-bg #eaf4ee`): hoàn tất, đã duyệt và trạng thái lành tính.
- **Vàng lưu ý** (`--warning #7a5a12` / `--warning-bg #fdf5dd`): chờ duyệt, dữ liệu mô phỏng hoặc điều cần đọc trước khi tin con số.
- **Đỏ cần xử lý** (`--critical #b3352f` / `--critical-bg #fdefed`): chỉ việc cần can thiệp. Không dùng đỏ cho hành động thông thường.
- **Thông tin** (`--info #1657a8` / `--info-bg #eef4fc`): thông báo trung tính; trạng thái luôn có nhãn chữ hoặc icon đi kèm.

### Neutral
- **Canvas** (`--canvas #f2f5f9`), **surface** (`--surface #ffffff`) và **surface sunken** (`--surface-soft #f7f9fc`) phân lớp nền, khối nội dung và vùng lùi.
- **Blue 050** (`--surface-tint #eef4fc`) dành cho hover/nhấn nhẹ; **Blue 100** (`--selected-surface #dbe8f8`) cho hàng được chọn.
- **Đường kẻ** (`--line #dbe3ed`) và **divider** (`--line-soft #eaeff6`) tạo cấu trúc. Viền điều khiển `#c6d2e0`; hover `#86b6ef`.
- **Mực** (`--ink #16263c`, `--ink-2 #485666`, `--ink-3 #63707f`) tạo ba cấp chữ trên nền sáng. Trên navy dùng `--on-chrome-1 #ffffff`, `--on-chrome-2 #d3e1f0` và `--on-chrome-3 #86b6ef`.

### Named Rules

**The Shared NSNN Palette Rule.** UI chrome, neutral surfaces, text, action blue, data blues and status colors follow the shared Dashboard NSNN tokens. The Tax Ops logo stays as supplied; its red and gold are identity artwork, not alternate action or status tokens.

**The Blue Action, Blue Data Rule.** Brand blue is reserved for action and selection. Data series use the registered blue scale; positive, negative and warning colors retain their semantic meanings and never become decorative series colors.

**The Blue Focus Rule.** Focus uses `--focus #1657a8` on light surfaces and white `--focus-on-chrome` on navy. Keep a visible 2px outline and preserve the existing keyboard focus order.

**The Neutral Numeral Rule.** Numeric values stay ink-colored. Status color belongs on the label, chip or notice, not on a number that only needs emphasis.

**The Two Neutral Lines Rule.** Use `--line` for panel boundaries and table-header rules; use `--line-soft` for internal separators. Do not introduce a third neutral divider.

## Typography

**Display / Body / Label Font:** `"Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif` — biến thể, tự host tại `src/fonts/`, hai subset `vietnamese` và `latin`, tổng 33,7 kB cho toàn dải cân nặng 100–900.
**Mono Font:** `ui-monospace, SFMono-Regular, Consolas, monospace`, cho mã số thuế, tên file và mã tài khoản.

**Character:** Bản trước dùng stack hệ thống, và PRODUCT.md ghi ba căn cứ cho lựa chọn đó: bề mặt tác nghiệp được phục vụ tốt bằng font hệ thống; dấu tiếng Việt chồng tầng (ế, ự, ỡ) dựng ổn định trong Segoe UI trong khi nhiều webfont subset latin-ext dựng không đều; và hệ chạy trên mạng nội bộ nơi mỗi kilobyte tải thêm là chi phí thật. Public Sans được chọn vì nó **đáp ứng cả ba**, không phải vì bỏ qua chúng: nó có subset `vietnamese` riêng với dấu được vẽ thật thay vì ghép từ latin-ext; nó nằm trong mã nguồn và đi qua Vite nên không gọi ra mạng ngoài và không hỏng khi máy trạm không ra được internet; và vì là tệp biến thể, toàn dải 100–900 chỉ tốn 33,7 kB.

**Vì sao không phải bộ chữ khác — đã đo, không đoán.** Be Vietnam Pro dựng dấu đẹp nhất trong các ứng viên nhưng **không có `tnum`**: ở cỡ 14px bề rộng chữ số dao động từ 5,39px tới 9,95px. Với một sản phẩm đầy cột tiền và cột ngày thì đó là mất căn cột, không phải chuyện thẩm mỹ, và nó phá thẳng **The Tabular Number Rule** bên dưới. IBM Plex Sans và Source Sans 3 có `tnum` nhưng dựng dấu chồng tầng rời và cao ở cỡ tiêu đề. Public Sans có cả hai, và là biến thể nên bậc 650 và 550 trong bảng phân cấp vẫn dựng đúng thay vì bị nắn về 700 và 500.

Tính cách của chữ vẫn đến từ cân nặng và khoảng cách nhiều hơn từ hình dáng: trọng lượng 650 cho tiêu đề, `letter-spacing` âm nhẹ cho số và tiêu đề, `tabular-nums` bật trên toàn `body` để các cột số thẳng hàng.

**The Font Must Earn Its Bytes Rule.** Một bộ chữ chỉ được đưa vào khi nó vượt qua ba phép đo, và cả ba đều chạy được trong trình duyệt trước khi quyết định: có subset `vietnamese` riêng hay không; bề rộng mười chữ số dưới `font-variant-numeric: tabular-nums` có bằng nhau không; và tổng kilobyte của các subset thực dùng. Không bộ chữ nào được chọn bằng cảm nhận về "đẹp" mà bỏ qua ba phép đo này. Khi đo `tnum`, đặt `font-variant-numeric` **sau** shorthand `font:` — shorthand reset nó về `normal` và phép đo sẽ nói dối.

### Hierarchy
- **Display** (650, `clamp(24px, 2.2vw, 30px)`, 1.22, -0.022em): chỉ tên hệ trong khối nhận diện màn đăng nhập. Đây là chỗ duy nhất trong hệ có chữ lớn, và nó được phép lớn vì màn đăng nhập không phải màn làm việc.
- **Headline** (650, 20px, 1.25, -0.02em): tiêu đề hộp thoại tạo báo cáo, tiêu đề form đăng nhập, tiêu đề màn từ chối quyền.
- **Metric** (650, 18px, 1.25, -0.015em): con số trong dải tổng hợp và trong luồng trạng thái. Giữ nguyên 18px cả trên mobile — dải tổng hợp ở Trang công việc đổi khuôn hình (mỗi ô thành một hàng nhãn-số) chứ không hạ cỡ số, vì con số là thứ người dùng quét trước.
- **Title** (700, 14px, -0.008em): tiêu đề khối `.panel-head h2`. Đây là bậc tiêu đề thường gặp nhất; tiêu đề màn ẩn nên khối chính là đơn vị người dùng đọc. Nó ở **700** chứ không phải 650 vì tên hàng trong bảng cũng là 14px và cũng màu `--ink`: lệch 50 đơn vị cân nặng ở cùng một cỡ và cùng một màu là lệch không nhìn ra, và tiêu đề khối khi đó không hơn được chính nội dung nó quản.
- **Body** (400, 14px/1.5): chữ nền của `body`, nhãn điều hướng, giá trị trong ô chi tiết (nặng 500).
- **Body-strong** (600, 13px): nhãn nút, tên hàng, tên bước, chữ trong dải thông báo, mục danh sách kiểm.
- **Lead** (400, 13px/1.5, `max-width: 72ch`, màu `--ink-2`): dòng mô tả mở đầu mỗi màn (`.page-lead`). Đây là dòng chữ đầu tiên người dùng thấy trong nội dung, vì tiêu đề màn bị ẩn.
- **Label** (600, 12px): nhãn ô chi tiết, nhãn dải tổng hợp, chú thích phụ, dòng phụ của hàng. Dòng phụ quan trọng đã được nâng từ 11px lên 12px và nâng đó vẫn đứng trong bản dựng.
- **Column-head** (700, 11px, +0.02em): đầu cột bảng, sticky, nền giấy mềm, chữ `--ink-3`. Ở 11px giữa các ô 14px, cân nặng 650 đọc ra nhạt hơn ô dữ liệu bên dưới; 700 cộng một chút giãn chữ trả nó về đúng vai đầu cột.
- **Nav-group** (700, 10.5px, +0.01em): nhãn nhóm điều hướng trong sidebar. Mực `--on-chrome-3` trên nền navy, không bấm được — nó là tiêu đề cấu trúc, và nó phân biệt bằng cỡ, cân nặng và màu chứ không bằng chữ hoa.
- **Group-label** (700, 10.5px, +0.01em, chữ thường): nhãn nhóm BÁO CÁO trong cụm mục của phân hệ. Nó nằm một bậc dưới Nav-group, trong cùng vùng navy, nên nó phân biệt bằng cỡ và vị trí chứ không bằng việc viết hoa thêm một lần nữa.

### Named Rules

**The Silent H1 Rule.** Tiêu đề trang không hiện. `PageIntro` vẫn dựng `<h1>` nhưng gắn `className="sr-only"`: tên màn đã nằm ở mục điều hướng đang mở trong sidebar, in lại nó ở đầu nội dung là nói hai lần và ăn mất dòng đắt nhất của trang. Thẻ vẫn nằm trong DOM vì một trang không có tiêu đề là một trang mà người dùng bàn phím không biết mình đang ở đâu. Không gỡ `<h1>`, và cũng không bỏ `sr-only` để "cho cân". Cùng nguyên tắc này áp xuống cấp khối — xem **The Row Already Said It Rule** ở mục Components.

**The One Leading Per Step Rule.** Mỗi cỡ chữ có ĐÚNG một giãn dòng, và cả hệ chỉ có ba giá trị: **1.25** cho chữ lớn một dòng (display, số trong dải tổng hợp), **1.35** cho nhãn nhỏ và chip, **1.5** cho mọi thứ có thể xuống dòng thành đoạn. Bản trước có tám giá trị — 1.22, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.6 — và riêng cỡ 12px dùng tới bốn trong số đó. Mắt không đọc ra từng giá trị, nhưng đọc ra việc nhịp dọc không đều, và đó là thứ làm trang có cảm giác chưa được chỉnh.

**The No Uppercase Tier Rule.** Toàn hệ KHÔNG có bậc nào viết hoa toàn bộ. Mọi nhãn nhỏ — nhãn nhóm điều hướng, nhãn bộ lọc, nhãn thẻ số, đầu cột so sánh, nhãn ô nhập — viết thường và phân biệt bằng cỡ, cân nặng, màu mực.

Ban đầu luật này chừa một ngoại lệ cho nhãn nhóm điều hướng, với lý do nó ở 10px trên nền navy và là vạch chia cấu trúc. Ngoại lệ ấy đã bỏ: lý do loại bốn bậc kia vẫn đúng với nó, và giữ đúng một ngoại lệ chỉ để có ngoại lệ thì không đáng. Trước đó mã có bốn bậc viết hoa ở bốn cỡ khác nhau trên cùng một màn — chúng cạnh tranh nhau để giành vai tiêu đề và người đọc hết manh mối biết cái nào quản cái nào.

Lý do không phải thẩm mỹ. Chữ viết hoa mất hình lên xuống của từ nên mắt phải đọc từng chữ cái thay vì nhận dạng cả từ; với tiếng Việt còn nặng hơn vì dấu dồn lên trên một dải chữ vốn đã cao bằng nhau, và "TỶ LỆ ĐÃ CƯỠNG CHẾ" đọc chậm hơn hẳn "Tỷ lệ đã cưỡng chế" ở cùng cỡ.

**The Short Ramp Rule.** Cả hệ chạy trong khoảng 10–30px với chín bậc, và không thêm bậc nào nữa. Phân cấp do đường kẻ, khoảng trắng và cân nặng gánh; nâng cỡ chữ để tạo phân cấp là cách làm của sản phẩm tiêu dùng và nó phá mật độ mà bảng dài cần.

**The Tabular Number Rule.** `font-variant-numeric: tabular-nums` đặt một lần trên `body`, không rắc lẻ từng chỗ. Số tiền và số lượng đi qua `Intl.NumberFormat("vi-VN")`; cột số căn phải bằng lớp `.num`.

## Layout

Khung cố định, nội dung co giãn. Sidebar `position: fixed` rộng 252px; **không có măng sét** — mặt làm việc lùi trái 252px với đệm `18px 20px 32px` và bắt đầu ngay mép trên khung nhìn. Nội dung nằm trong `.page-stack`: `width: min(100%, 1540px)`, `grid-template-columns: minmax(0, 1fr)`, căn giữa, các khối cách nhau 18px. Trần 1540px giữ cho bảng không kéo dài vô tận trên màn rộng.

Thao tác cấp trang nằm trong luồng nội dung ở MỌI khổ: `PageIntro` dựng `.page-actions` tại chỗ, không còn portal và không còn ô cắm. `PageIntro` trả về một fragment — `<h1 class="sr-only">` cộng `.page-lead` — chứ không còn bọc trong một khối `.page-intro`; lớp đó không còn tồn tại.

Nhịp khoảng cách chạy theo bậc 4 / 8 / 10 / 12 / 14 / 16 / 18 / 20. Đệm trong khối là `0 14px 12px` (12px từ 720px xuống). Các dải toàn chiều rộng bên trong khối — bảng, danh sách việc, danh sách nguồn, bảng xếp hạng, lưới chi tiết — dùng `margin-inline: -14px` để chạm hẳn mép khối trong khi phần chữ vẫn thụt vào. Hàng bảng cao 38px, ô chi tiết và ô tổng hợp cao tối thiểu 56px, hàng việc 54px, đầu khối 54px.

Hai bố cục làm việc: `.workbench-grid` chia 1.1fr / 0.9fr, và `.case-layout` nay chỉ còn **một cột** — danh sách chiếm trọn bề ngang, chi tiết nằm trong `<dialog>` trượt từ mép phải. Màn đăng nhập là lưới hai cột `minmax(300px, 36%) / minmax(0, 1fr)`: cột trái navy, cột phải trắng. 36% giữ được vai trò làm khung mà không thành khoảng trống. Cụm form rộng `min(380px, 100%)` — hai ô nhập trải 560px đọc ra một biểu mẫu bị kéo giãn, vì ô dài gấp mấy lần nội dung nó chứa.

**Điểm ngắt.**
- **Mọi khổ** — chọn một hàng mở `<dialog>` trượt từ mép phải, rộng `min(100vw, 520px)`, cao toàn màn, nền `--canvas`. Không còn điểm ngắt 1361px và không có luật chặn chiều cao nào áp cho dải, vì khi danh sách đứng một cột thì chặn chiều cao là bóp nghẹt chính bảng dữ liệu.
- **1180px** — lưới hai cột duỗi thành một; luồng trạng thái từ năm cột xuống ba.
- **900px** — sidebar ẩn, mặt làm việc bỏ lùi trái, thanh điều hướng đáy hiện lên cùng nút mở ngăn điều hướng (nền `#fffffff2`, `backdrop-filter: blur(14px)`), mặt làm việc chừa 86px đáy. Mọi vùng chạm lên 44px và dải nhắc cuộn ngang xuất hiện trên bảng.
- **720px** — màn đăng nhập xếp dọc; dải tổng hợp về hai cột; nút phân đoạn đổi thành `<select>`; ô bảng cao 44px; dải thông báo xếp dọc hoàn toàn; luồng duyệt đổi trục ngang thành trục dọc.

**Chuyển động.** Một hàm gia tốc duy nhất `--ease-out: cubic-bezier(.16, 1, .3, 1)`. Đổi trạng thái 100–160ms; vào màn 200ms; toast 220ms; ngăn chi tiết 180ms. Toàn bộ nằm sau `prefers-reduced-motion: no-preference`, và có một công tắc chung cắt mọi animation cùng transition xuống 0,01ms khi người dùng yêu cầu giảm chuyển động.

### Named Rules

**The 44px Floor Rule.** Từ 900px trở xuống, mọi thứ bấm được cao tối thiểu 44px: nút, ô tìm kiếm, `<select>`, nút phân đoạn, mục điều hướng trong drawer, nút đăng xuất, vùng chọn hàng, nút trong chân bảng. Đây là ràng buộc trong PRODUCT.md, không phải gợi ý.

**The Whole Row Rule.** Hàng bảng bấm được thì cả hàng bấm được: `.row-select` kéo rộng `calc(100% + 24px)` với `margin: -7px -12px` để phủ hết ô, và `tbody tr:has(.row-select:not(:disabled))` nhận `cursor: pointer`. Không bắt người dùng ngắm một nút nhỏ nằm trong hàng.

**The Zero-Basis Track Rule.** Mọi rãnh lưới có thể chứa bảng phải khai báo cơ sở 0: `.page-stack` dùng `grid-template-columns: minmax(0, 1fr)`, và `.case-layout` cùng `.case-list` đều mang `min-width: 0`. Rãnh `auto` mặc định nở tới bề rộng tối thiểu 780px của bảng nghiệp vụ rồi kéo mọi khối anh em vượt khung nhìn ở 390 và 768 — tràn ngang không bắt đầu ở cái bảng, nó bắt đầu ở cái rãnh chứa bảng.

**The List Has No Ceiling Rule.** Danh sách không nhận trần chiều cao nào. Mười dòng một trang đã là trần thật của nó, và một trần thứ hai bằng `vh` chỉ sinh ra thanh cuộn dọc bên trong một khối vốn đã vừa — xem **The Long List Gets Pages Rule**. Luật cũ "dải quyết định chiều cao" đã gỡ cùng với dải hai cột: không còn cột nào bên cạnh để kéo bằng.

**The Sections Live In The Sidebar Rule.** Mục của một phân hệ nằm trong THANH BÊN, không phải một hàng tab ngang trên trang. Đây là một **lệch có chủ đích** so với chữ của tài liệu, nên nó được ghi lại kèm căn cứ thay vì để người sau phát hiện rồi đoán.

Hai bản thiết kế gọi các mục nội dung là "tab" và liệt kê chúng thành danh sách phẳng: `design_ql1ql3` §4.2 cho QL1 11 tab, §5.2 cho QL3 4 tab; `design_ql2ql4` §4.2 cho QL2 12 tab, §5.2 cho QL4 11 tab. Riêng tầng chọn báo cáo thì `design_ql2ql4:50` tự đưa ra hai hình dạng: *"1 tầng chọn báo cáo (**menu con** hoặc thanh tab cấp 1)"*. Menu con là hình dạng đang dùng, và nó là một trong hai thứ tài liệu nêu tên.

Ba lý do chọn thanh bên cho cả mục nội dung:

- **Số lượng.** QL2 có 12 mục, QL4 có 11. Một hàng tab ngang 12 mục ở khổ 1440px gãy thành hai ba dòng hoặc phải cuộn ngang; danh sách dọc không có trần ấy.
- **Chiều cao.** Tầng chọn báo cáo cộng tầng mục, làm bằng tab ngang là hai thanh xếp chồng ăn khoảng 100px đầu mọi trang — đúng chỗ bảng 30–32 cột đang thiếu bề rộng nhất.
- **Một nơi duy nhất để tìm.** Người dùng đã tìm màn ở thanh bên; đặt mục ở chỗ thứ hai là bắt họ học hai thói quen cho cùng một việc.

Hệ quả bắt buộc: cụm mục KHÔNG được xuất hiện trên trang — xem chốt kiểm `soatTrucDoc` trong `scripts/acceptance.mjs`.

**The Report Is The Tab Rule (chốt 08/10/2026).** Phân hệ có NHIỀU báo cáo thì mỗi **báo cáo** là một mục cấp ngoài của thanh bên, không phải một nhãn nằm trong mục mang tên phân hệ.

Bản trước gộp cả sáu báo cáo của QL2 vào trong mục "Rủi ro hóa đơn", nên thanh bên có ba tầng: phân hệ → nhãn nhóm → mục. Tầng giữa chỉ để đọc, không bấm được, nên muốn sang báo cáo khác phải nhắm vào một mục con của nó; và sáu báo cáo nằm chung một mục buộc người dùng cuộn qua hai chục dòng của báo cáo khác để tới cái của mình.

Bốn ràng buộc:

- **Không còn mục mang tên phân hệ.** Giữ thêm một mục "Rủi ro hóa đơn" trên sáu báo cáo của nó là một tầng chỉ để bấm qua.
- **Nhãn chỉ mang TÊN CHỦ ĐỀ**, bỏ mã `QL2-01`. Mã là của bảng phân công báo cáo: có ích khi đối chiếu tài liệu, không có ích khi tìm đường. Nó vẫn nằm ở `baoCao` và vẫn hiện trên tiêu đề kỳ của thanh duyệt.
- **Bấm vào báo cáo mở mục ĐẦU của nó**, và chỉ báo cáo đang mở mới bày mục con. Không có màn riêng cho "một báo cáo nói chung", mà để nó không làm gì thì nó vẫn chỉ là một nhãn.
- **Cha có con thì cha KHÔNG tự bày nội dung.** Bấm vào báo cáo là nhảy xuống mục con thứ nhất, và chính mục con ấy bày nội dung — nên lúc nào cũng có đúng một mục con đang sáng và người dùng biết mình đang đọc cái gì. Cha mang `is-active` để thấy đang ở nhóm nào nhưng KHÔNG mang `aria-current="page"`: trang hiện tại là mục con, và hai thứ cùng khai "page" thì trình đọc màn hình đọc ra hai trang đang mở.
- **Báo cáo chỉ có MỘT mục là một mục lá**, bày nội dung ngay, vì không có con nào để nhảy xuống (QL2-03, QL2-05, QL2-06). Cùng hình dạng với "Tổng quan".
- **Không giấu mục con nào.** Bản đầu giấu mục con trùng tên với cha rồi cho cha mở thẳng nó; kết quả là bấm "Xác minh hóa đơn" ra nội dung mà không mục con nào sáng, nhìn như cha đang bày bảng. Chỗ nào trùng tên thì ĐỔI TÊN mục con cho đúng nội dung của nó — §4.2 gọi tab 6 của QL2-04 đúng bằng tên báo cáo, nên nó lấy tên theo nội dung ("Tổng hợp theo đơn vị"), song song với cách đặt tên của QL2-01 ngay trên.

Mục không thuộc báo cáo nào đi theo nghĩa của nó: **Tổng quan** đứng đầu cụm Phân hệ; **Dữ liệu gốc** xuống cụm Dữ liệu cạnh "Tình trạng dữ liệu", vì nó nói về NGUỒN kéo về chứ không về một báo cáo.

QL3 hiện mới dựng một báo cáo nên **giữ nguyên** một tầng mục phẳng dưới tên phân hệ: không có báo cáo nào để tách, tách là tạo một tầng rỗng. Nó sẽ theo luật này khi RS-QL3-02 (bộ báo cáo khối) được dựng.

**QL1 đã tách (08/10/2026).** Nó dựng từ `design_ql1ql3`, tài liệu mô hình hóa cả phòng là MỘT báo cáo mười một tab, nên nó từng có một cụm phẳng bảy mục, một danh sách kỳ và MỘT vòng duyệt. `SPec/QLDN1` thì giao sáu báo cáo riêng, mỗi cái một kỳ và một đầu mối — và ba trong số đó đã dựng:

| Mục cấp ngoài | Báo cáo | Kỳ theo spec |
|---|---|---|
| Đánh giá nợ | RS-QL1-01 | Tuần, tháng, **năm** |
| Đánh giá kết quả cưỡng chế | RS-QL1-03 | Tuần, tháng |
| Tạm hoãn xuất cảnh → *Trên ngưỡng nợ* · *Trạng thái 06* | RS-QL1-04 | Tuần, tháng |

Ba hệ quả bắt buộc đi kèm, cả ba đều từng sai khi còn gộp:

- **Mỗi báo cáo một vòng duyệt**, khóa là `QL1|<báo cáo>|<kỳ>`. Một khóa cho cả phòng nghĩa là bấm "Gửi duyệt" một lần là gửi cả ba báo cáo, dù chúng khác hạn và khác người chịu trách nhiệm.
- **Mỗi báo cáo một danh sách kỳ.** Dùng chung một danh sách thì hoặc RS-QL1-01 mất kỳ năm, hoặc hai báo cáo kia được chọn một kỳ chúng không có.
- **Mỗi báo cáo một bộ sheet** (`ql1Workbook(ky, donVi, baoCao)`). Trước đây một tệp gom chín sheet của ba báo cáo khác kỳ; người nhận không có cách nào biết sheet nào thuộc kỳ nào. Bản xuất Word vì thế cũng lấy sheet theo TÊN chứ không theo vị trí, và đánh lại số La Mã theo những phần thật sự có.

Ba báo cáo còn thiếu so với spec — RS-QL1-02 Thu hồi nợ đọng, RS-QL1-05 Cảnh báo phân loại nợ, RS-QL1-06 TTHC về nợ — **chưa dựng**. Đây mới là sửa mô hình của phần đã có.

Ràng buộc kỹ thuật đi kèm: đổi mục TRONG cùng phân hệ phải gọi `datMuc` của `MucPhanHeProvider`; `setView` chỉ ghi địa chỉ nên thanh bên sẽ đứng yên. Sang phân hệ khác thì ngược lại — provider của phân hệ kia chưa dựng, nên phải đổi màn và đặt mục trong cùng một lần (`setView(view, muc)`).

**The Summary And Its List Are One Section Rule.** Bảng tổng hợp theo đơn vị và danh sách chi tiết của chính nó nằm trong CÙNG một mục, không tách thành hai tab. Vì thế bảy mục của QL1 phủ mười một tab mà §4.2 liệt kê:

| Mục trên màn | Tab của §4.2 |
|---|---|
| Tổng quan | 0 |
| So sánh nợ | 1 So sánh nợ + 2 DN tăng nợ KNT trên ngưỡng |
| Kết quả cưỡng chế | 3 Đánh giá kết quả cưỡng chế + 5 DS NNT chưa cưỡng chế |
| Tạm hoãn xuất cảnh | 4 Đánh giá tạm hoãn XC + 6 DS trên ngưỡng chưa THXC |
| Tạm hoãn XC · trạng thái 06 | 7 THXC NNT trạng thái 06 + 8 DS chưa tạm hoãn (TT06) |
| Quy tắc và nguồn | 9 |
| Dữ liệu gốc | 10 |

Lý do gộp là G3: *"Bấm số → xem chi tiết"*. Tách hai thứ thành hai tab thì mỗi lần bấm một ô tổng hợp là một cú nhảy tab, và người dùng mất ngữ cảnh của con số họ vừa bấm. Để chúng trên cùng một màn thì danh sách mở ra ngay dưới bảng sinh ra nó.

Không mục nào của §4.2 bị bỏ. Khi đối chiếu với phòng nghiệp vụ, dùng bảng trên để chỉ ra mỗi tab của họ nằm ở đâu.

**The Same Spine Rule.** Mọi phân hệ dựng theo ĐÚNG MỘT trật tự dọc, không có ngoại lệ:

> Tiêu đề màn và nút xuất (`PageIntro`) → thanh duyệt của kỳ (`ThanhDuyet`) → khối xem báo cáo nếu đang mở → thanh lọc chung (`BoLocChung`) → nội dung của mục đang mở.

Và **mục của phân hệ luôn nằm trong thanh bên**, không bao giờ là một dải trên trang. QL3 từng dùng `Segmented` ngang ở giữa trang trong khi QL1 dùng thanh bên: hai phòng cùng một hệ, cùng một loại việc, mà người dùng phải tìm mục ở hai chỗ khác nhau, và ai làm việc với hai phòng thì phải học lại chỗ bấm mỗi lần chuyển. Dải trên trang còn ăn một dòng ngang đúng ở nơi bảng cần bề rộng nhất.

Nhãn nút cũng là một bộ duy nhất: **Xuất Excel** và **Xuất Word** trong khối Xem báo cáo cho cả bộ sheet, **Xuất bảng này** trong đầu khối cho một bảng, **Xuất danh sách đang lọc** cho danh sách đã lọc. Trước đó cùng một việc mang ba tên — "Xuất cả bộ báo cáo", "Xuất báo cáo Excel", "Xuất Excel" — và người dùng phải đoán ba cái ấy có khác nhau không.

Tiêu đề màn luôn là **tên nghiệp vụ · tên phòng** ("Rủi ro hóa đơn · Phòng QL2"), vì một người có thể mở phân hệ của phòng khác trong cùng phiên làm việc và cần biết mình đang ở đâu.

**The Fixed Slots Rule.** Một vùng điều khiển gồm các **ô cố định theo vai trò của điều khiển**, không phải một hàng nút xếp theo thứ tự thứ gì có mặt. Thanh duyệt có hai ô: *đọc* ("Xem báo cáo") rồi *quyết định* ("Trả lại", "Duyệt", hoặc nút đã tắt thay chỗ nút vừa bấm). Quyền hay trạng thái đổi thì điều khiển trong ô được thay hoặc bỏ đi, nhưng **ô không đổi chỗ**.

Ba hệ quả bắt buộc:

- **Không nút nào co giãn để lấp chỗ trống**, ở bất kỳ khổ nào. Một nút rộng ra vì bên cạnh thiếu nút là bố cục đổi theo dữ liệu, và nó phá luôn cả The Whole Row Rule ở chỗ khác.
- **Khoảng cách giữa hai ô phải lớn hơn khoảng cách trong một ô** (20px so với 8px). Bằng nhau thì ba nút khác loại đọc thành một bộ ba cùng loại.
- **Một điều khiển đã tắt đứng đúng chỗ điều khiển nó thay**, không tách ra đứng riêng. "Đã gửi" nằm trong ô quyết định vì nó đứng chỗ nút "Gửi duyệt" vừa biến mất — đó là toàn bộ lý do nó tồn tại.

Lý do là việc đối chiếu giữa người với người: hai cán bộ cùng mở một kỳ phải chỉ được cho nhau "nút thứ hai từ phải" mà không cần hỏi đối phương đang thấy mấy nút. Vai trò khác nhau thì **nội dung** ô khác nhau, **vị trí** ô thì không.

**The Friction Follows Consequence Rule.** Độ khó của một thao tác phải đi theo **mức khó gỡ lại của nó**, không theo mức ồn ào của nó.

Hệ này từng làm ngược. `Trả lại` — việc người lập nhận lại bản nháp và sửa tiếp — bắt gõ lý do bắt buộc tới 200 ký tự, có khối riêng trải hết thanh. Còn `Duyệt`, việc khóa số của cả một kỳ, chốt bằng **một cú bấm**, không xác nhận, không tóm tắt, không hoàn tác. Theo QR-03 thì duyệt xong muốn sửa phải mở bản điều chỉnh kèm lý do — nghĩa là cú bấm rẻ nhất trên màn lại là cú đắt nhất để gỡ.

Luật: mọi thao tác không tự gỡ lại được đều đi qua **một ô xác nhận trong luồng trang**, mang đúng hai thứ — câu nói **hệ quả** ("duyệt xong là kỳ khóa số; muốn sửa phải mở bản điều chỉnh, không có nút hoàn tác") và bản **tóm tắt đang chốt cái gì** (kỳ, bộ sheet, phạm vi). Ô ấy dùng chung khuôn với ô lý do trả lại: cùng vị trí, cùng cặp nút Hủy / nút chốt, cùng cách mở bằng `aria-expanded` trên nút gọi nó.

Ba điều không được nới:

- **Xác nhận không phải là hỏi "chắc chưa".** Một ô chỉ hỏi lại mà không nói đang chốt cái gì thì chỉ thêm một cú bấm, và người dùng học cách bấm qua nó mà không đọc. Tóm tắt là phần bắt buộc; phân hệ phải truyền vào (`tomTat`), vì chỉ nó biết bộ báo cáo của mình gồm mấy sheet.
- **Chặn ở cửa thì phải nói lý do tại cửa.** Báo cáo chưa có mẫu, dữ liệu chưa đủ điều kiện — tắt nút và in lý do ngay dưới thanh (`chan`), không giấu nút. Giấu thì người dùng đi tìm một chức năng đã biến mất.
- **Nút chốt vẫn đứng nguyên ô quyết định.** Thêm một bước không được đổi chỗ nút — xem The Fixed Slots Rule. Cú bấm thứ nhất nay dẫn tới một câu hỏi thay vì tới một kỳ đã khóa, nhưng nó vẫn là cùng một nút ở cùng một chỗ.

Chốt kiểm: trợ thủ `chot()` trong `scripts/acceptance.mjs` là đường đi duy nhất tới hai cú chốt; nút nào chốt thẳng trở lại thì cổng đỏ.

**The Overflow Decides, Not The Breakpoint Rule.** Dấu hiệu "còn nội dung ngoài khung" bám **hiệu số giữa nội dung và khung**, không bám bề rộng màn hình.

Dải gợi ý cuộn từng chỉ hiện từ 900px xuống. Nhưng tràn ngang không đi theo khổ máy: ở 1440px bảng nhập kết quả PRS-03 rộng 1752px trong khung 1146px — 606px, khoảng 35%, khuất hẳn, và cột khuất đúng là cột `Kết quả`. Ngược lại ở 390px một bảng bốn cột hẹp vẫn hiện dải dù không có gì để cuộn. Cùng một phép đo sai, sai cả hai hướng.

`TableWrap` đo bằng `ResizeObserver` trên cả khung lẫn con của nó — khung đổi khi cửa sổ hay thanh bên đổi, con đổi khi sang trang hay đổi bộ lọc, và lần đổi thứ hai không kéo theo lần đổi thứ nhất. Phần khuất còn được nói cho trình đọc màn hình ngay trong `aria-label` của vùng, vì ở đó nó đến đúng lúc người dùng bước vào vùng.

Cùng một lý do áp cho **The 44px Floor Rule**: luật ghi "từ 900px trở xuống" thì khối CSS phải là `max-width: 900px`, và nó phải đứng **sau** luật nền của cùng selector — media query không cộng thêm độ đặc hiệu. Hai luật vùng chạm của thanh lọc từng nằm trong khối 720px, nên dải 721–900px rơi lại 32px suốt một thời gian mà không ai thấy: bộ khổ của `soat` nhảy thẳng từ 1280 xuống 390. **Phép kiểm không đo dải nào thì không bảo vệ được dải ấy** — 768×1024 nay nằm trong bộ khổ.

**The Export Lives On What It Exports Rule (chốt 08/10/2026).** Phạm vi của một nút xuất mã hóa bằng **VỊ TRÍ**, không chỉ bằng nhãn:

| Xuất cái gì | Nút nằm ở đâu | Nhãn |
|---|---|---|
| Cả bộ sheet của báo cáo | **đầu khối chứa bảng**, cạnh bộ lọc của chính khối ấy | `Xuất Excel`, `Xuất Word` |
| Một bảng | đầu khối của chính bảng ấy | `Xuất bảng này` |
| Danh sách đang lọc | chân khối của chính danh sách ấy | `Xuất danh sách đang lọc` |

Chỗ đặt nút xuất cả bộ đã đi qua ba bản, và lý do loại từng bản ghi lại ở đây để không ai thử lại:

1. **Măng sét** — bỏ cùng măng sét (The No Masthead Rule).
2. **Hàng nút lẻ ở đầu trang** — một nút đứng một mình trên một hàng trắng, đúng thứ chú thích cũ của `PageIntro` gọi là "bơ vơ".
3. **Trong khối Xem báo cáo** — nút nằm trên chính vật nó xuất, nhưng phải mở khối mới tới được, và khối ấy chỉ dựng khi `choXemTruoc` đúng nên trưởng phòng xem kỳ Bản nháp mất luôn đường xuất.

Bản đang dùng: **đầu khối chứa bảng**. Nút đi tới đó qua context (`XuatProvider`), khối nào nhận thì tự khai `chinh` — KHÔNG đoán "khối đầu tiên" theo thứ tự dựng, vì một màn có ba khối và thứ tự có thể đổi.

Bốn ràng buộc:

- **Mỗi màn nhiều nhất MỘT chỗ đặt nút.** Cùng một việc ở hai nơi thì người dùng phải dừng lại hỏi hai nút có khác nhau không. Chốt kiểm đếm số khối mang nút trên mọi màn × hai khổ.
- **Bộ lọc nhóm chỉ tiêu KHÔNG ảnh hưởng tới tệp.** Nhóm chỉ tiêu là cách đọc trên màn; tệp ra đủ cột theo mẫu. Bộ sheet dựng thẳng từ dữ liệu nên điều này đúng theo cấu trúc, không theo quy ước.
- **Mục không thuộc báo cáo nào thì không có nút** (Tổng quan, Quy tắc và nguồn, Dữ liệu gốc) — không có bộ sheet để xuất.
- **Hàng thao tác của đầu khối nằm NGANG.** `.panel-actions` là flex, `align-items: end` để nút thẳng hàng với ô chọn chứ không với nhãn nhỏ phía trên nó. Trước đây nó là khối thường, nên khối nào có hai thứ thì chúng rơi xuống hai dòng và đầu khối cao gấp đôi — lỗi không lộ ra cho tới khi nút xuất về đây, vì phần lớn khối chỉ có một nút.

**The Fixed Furniture Rule.** Không đổi vị trí điều hướng, bộ lọc hay nút mà người dùng đã quen tay. Sidebar trái, thanh lọc chung dính lên mép trên khung nhìn, bộ lọc riêng của bảng nằm trong đầu khối, thao tác chính nằm bên phải đầu khối — đây là lằn ranh người dùng đặt ra, và mọi màn mới thừa hưởng nó.

## Elevation & Depth

Hệ gần như phẳng. Độ sâu chủ yếu đến từ lớp navy làm khung, trắng làm mặt, canvas xám xanh làm nền và hai bậc đường kẻ. Bóng chỉ nhận ba nhóm việc: đóng khung khối, phản hồi khi trỏ tới, và nâng lớp phủ.

### Shadow Vocabulary
- **Khối nội dung** (`box-shadow: 0 1px 2px rgb(41 37 38 / 5%), 0 5px 14px rgb(41 37 38 / 4%)`, kèm `border: 1px solid var(--line)`): áp cho `.panel`, `.kpi-strip`, `.figure-line`. Hai lớp rất nhạt, đủ để khối tách khỏi giấy mà không đọc thành thẻ nổi.
- **Nút có nền** (`0 1px 1px #29252614` cho nút chính, `0 1px 1px #2925260f` cho nút phụ): tắt hẳn khi `:active`, kèm `translateY(.5px)` để cú bấm có trọng lượng.
- **Mục điều hướng đang mở** (`0 2px 5px rgb(0 0 0 / 10%)`): thanh trắng nổi lên khỏi nền navy.
- **Nâng khi trỏ tới** (`0 3px 8px rgb(41 37 38 / 10%)` kèm `translateY(-2px)`): chỉ hàng bảng, hàng việc và ô tổng hợp bấm được.
- **Nút phân đoạn đang bật** (`0 1px 2px #2925261f` kèm viền `--state-edge`): một mảnh trắng nhô lên khỏi rãnh xám.
- **Lớp phủ** (`--shadow-overlay: 0 18px 48px #29131833`): chỉ còn drawer điều hướng ở khổ điện thoại và toast — xem The No-Overlay Rule. Scrim của drawer là `#29252680`.
- **Mép dính** (`0 1px 3px rgb(22 38 60 / 4%)` cho thanh lọc chung, `0 -6px 20px #16263c12` cho thanh điều hướng đáy): gần như không thấy, chỉ để mép không trôi vào nội dung khi cuộn.

### Named Rules

**The Hover Belongs to Handles Rule.** Hiệu ứng nâng bị khóa sau `@media (any-hover: hover) and (any-pointer: fine)` và chỉ áp cho ba thứ thật sự bấm được: hàng bảng có vùng chọn còn bật, hàng việc dạng `<button>`, và ô tổng hợp dạng `<button>`. Một khối chỉ để đọc mà nhấc lên khi rê chuột là hứa một hành động không tồn tại.

**The Two-Line Rule.** Cấu trúc bên trong khối do hai bậc đường kẻ gánh: `--line` cho ranh giới khối và vạch dưới đầu cột, `--line-soft` cho mọi vạch chia bên trong. Không thêm bậc thứ ba, và không dùng bóng để thay đường kẻ bên trong khối.

## Shapes

Ba bậc bo góc, mỗi bậc gắn với một loại vật: khối nội dung và toast dùng 10px (`--radius-panel`); nút, ô nhập, `<select>`, ô tìm kiếm, nút đóng dùng 6px (`--radius-control`); chip trạng thái, vùng chọn hàng và mục điều hướng dùng 4px (`--radius-chip`). Bậc 12px cũ đi cùng hộp thoại tạo báo cáo đã bỏ, nên không còn ngoại lệ nào. Hệ còn khai báo `--radius-hairline: 2px` nhưng không nơi nào dùng — coi đó là token cũ, đừng dựng bậc thứ tư quanh nó.

Thanh cuộn tùy biến cũng lấy bậc khối (`--radius-panel`) thay vì một con số rời, để không có bán kính nào sống ngoài thang.

Hình tròn (`50%`) dành riêng cho dấu bước: chấm 6px mở đầu chip trạng thái, chấm 11px trên dòng thời gian, vòng 20px trong danh sách kiểm, vòng 26px trong luồng duyệt. Viền luôn 1px, trừ vòng tròn dòng thời gian (2px) và vạch trên của mục điều hướng đáy đang mở (2px).

Biểu trưng là ảnh `public/tax-logo.png` dựng qua `<img>`, cắt tròn bằng `clip-path: circle(42.5% at 50% 50%)`, hiện ở ba cỡ: 46px trong sidebar và drawer, 50px trên màn từ chối quyền, 64px trên màn đăng nhập.

### Named Rules

**The Emblem Not Lettermark Rule.** Khối nhận diện luôn là ảnh con dấu cộng hai dòng chữ ("Quản lý nghiệp vụ Thuế" / "Thuế TP Hà Nội"). Không thay con dấu bằng ký tự lồng hay ký hiệu viết tắt, không vẽ lại con dấu bằng SVG suy diễn, không đặt chữ đè lên nó.

**The Circle Means Step Rule.** Hình tròn trong hệ này luôn có nghĩa "một bước trong chuỗi" hoặc "một chấm trạng thái". Không bo tròn nút, không dựng avatar tròn, không dùng dáng viên thuốc cho chip.

## Components

### Buttons
- **Shape:** bo nhẹ (6px), cao 32px trên desktop và 44px từ 900px xuống, chữ 13px/600, `white-space: nowrap`, icon 17px đặt trước nhãn.
- **Primary:** nền và viền `--brand`, chữ trắng, bóng 1px. Hover chuyển `--brand-strong`; `:active` bỏ bóng và lún nửa pixel.
- **Secondary:** nền trắng, viền `--control-line`, chữ mực. Hover đổi viền sang `--control-line-hover` và nền sang giấy mềm.
- **Quiet:** không nền, không viền, chữ `--brand`, đệm ngang 8px. Hover nhận nền xanh nhạt `--surface-tint`. Trên mobile nó bỏ đệm ngang và căn trái trong đầu khối thay vì kéo rộng như hai loại kia.
- **Disabled:** `opacity: .45`, bỏ bóng, bỏ dịch chuyển, `cursor: not-allowed`.
- **Focus:** vòng mực 2px, `outline-offset: 2px`, kế thừa từ quy tắc chung chứ không định nghĩa lại.
- **Nút gửi của màn đăng nhập** là biến thể riêng: cao 44px, chiếm trọn bề ngang form, cùng bảng màu với nút chính.
- **Nút hiện/ẩn mật khẩu** nằm chồng lên mép phải ô nhập, cao 34px, không viền không nền, chữ 12px/650 màu `--ink-2`. Nó **chỉ được dựng khi ô đã có ký tự** — trên ô rỗng nó là một đích bấm không làm gì. Ô nhập chỉ chừa `padding-right: 58px` khi nút có mặt, bằng `:has(button)`.

### Chips (Badge)
- **Mặc định là chữ có chấm, không phải viên thuốc:** nền trong suốt, không viền, không đệm, chữ 12px/600, và một chấm tròn 6px `currentColor` đứng trước qua `::before`. Bốn tông dùng dạng này: neutral (`--ink-2`), positive, warning, info. Chấm cộng chữ nghĩa là trạng thái không bao giờ chỉ được truyền bằng màu.
- **Hai ngoại lệ có nền:** tông `critical` và cờ "Mô phỏng" chuyển thành chip có nền nhạt, bo 4px, đệm `2px 7px` — đó là hai thứ phải nhìn thấy trước khi đọc. Chip mô phỏng bỏ chấm vì nó không phải một trạng thái trong chuỗi. Chip này chỉ còn dùng ở màn từ chối quyền, nơi không có khung bao quanh để nói đây là bản mô phỏng.

### Cards / Containers (Panel)
- **Corner Style:** 10px, `overflow: hidden`.
- **Background:** trắng trên canvas xám xanh.
- **Border & Shadow:** có khung — viền 1px `--line` và bóng hai lớp rất nhẹ (xem Elevation & Depth). Stylesheet còn giữ một khai báo cũ hơn viết `border: 0` cho `.panel`, nhưng nó bị quy tắc muộn hơn ghi đè; trạng thái đang chạy là khối **có** viền và bóng.
- **Đầu khối:** cao tối thiểu 54px, đệm `13px 16px`, vạch dưới `--line`. Tiêu đề 14px/700, không kèm nhãn nguồn — xem **The Panel Is Not A Bibliography Rule** bên dưới. Dòng mô tả (`max-width: 72ch`, màu `--ink-3`) là tùy chọn và **không dùng ở khối chi tiết** — xem quy tắc dưới. Khi đầu khối có vùng thao tác, nó chuyển sang lưới (`display: grid`) để thao tác xuống dòng dưới tiêu đề thay vì bóp tiêu đề; đó là lý do đầu khối chi tiết ở Nợ và Lô dữ liệu cao hơn ở Hoàn thuế và Báo cáo, chứ không phải vì còn sót dòng phụ. Chiều cao đầu khối vì thế là kết quả của nội dung, không phải một con số đặt trước — đúng lý do hàng lưới chung phải là subgrid.
- **Internal Padding:** `0 14px 12px`, xuống `0 12px 12px` từ 720px.
- **Trong dải hai cột:** khối thành hộp dọc, thân nhận `flex: 1; min-height: 0; overflow: auto`, và hai đầu khối nằm trên cùng một hàng lưới (xem quy tắc dưới).

**The Row Already Said It Rule.** Đầu khối chi tiết chỉ định danh bản ghi bằng tên, còn mọi trường đã hiện trên hàng đang chọn thì ở lại trên hàng. Bốn khối chi tiết của dải (Nợ, Hoàn thuế, Báo cáo, Lô dữ liệu) đã bỏ hẳn dòng phụ vì nó lặp lại đúng các cột nằm cách đó vài trăm pixel về bên trái — mã số thuế che, đơn vị và cán bộ ở Nợ; ngày nhận và đơn vị ở Hoàn thuế; kỳ, đơn vị chủ trì và nguồn ở Báo cáo; mốc cập nhật ở Lô dữ liệu. Đọc cùng một trường hai lần trên một màn, và trả giá bằng một đầu khối cao hơn, là lỗ kép. Đây chính là **The Silent H1 Rule** áp xuống một cấp.

Kèm theo một điều kiện, vì đây là chỗ cách làm rẻ tiền sẽ làm mất dữ liệu: con số nào chỉ có trong dòng phụ mà không có trong bảng thì phải chuyển đi đâu đó, không được bỏ. Ở Lô dữ liệu, `{thieu.length} đơn vị chưa gửi` đã chuyển vào dải cảnh báo sẵn có trong thân khối, nay đọc là "{loi.length} file cần xem lại, trong đó {thieu.length} đơn vị chưa gửi". Bỏ dòng phụ là bỏ một chỗ đặt chữ, không phải bỏ một dữ kiện.

**The Card Fits The Table Rule.** Khung cao theo bảng, không phải bảng nén vào khung. Dải hai cột từng bị chặn ở `100dvh - 100px` rồi cho thân khối cuộn bên trong — đúng khi bảng có 2.455 dòng, sai khi một trang chỉ có 10. Ở 1440 và 1366, tên doanh nghiệp bị bóp xuống ba bốn dòng, hàng cao tới 204px, và 18/20 trang vẫn phải cuộn: chia trang xong vẫn còn thanh cuộn. Bỏ trần đi thì khối cao đúng bằng mười hàng của nó, không còn thanh cuộn dọc nào, và trang dài ra thì cuộn trang — thao tác người dùng vốn đã quen. Khối chi tiết quay về `position: sticky` nên nó đi theo tầm mắt. Đánh đổi đã biết và chấp nhận: hai cột không còn cao bằng nhau, và đầu cột chỉ dính trong khung bảng chứ không ghim lên mép màn khi cuộn trang.

**Ghi chú lịch sử.** Trước đó dải dùng `contain: size` trên thân khối chi tiết để chiều cao do **bảng** quyết định, không do khối chi tiết. Hai cột trước đây cùng nằm trong một hàng lưới cao bằng cái cao hơn, nên một bản ghi nhiều thông tin kéo cả hai cột lên theo: ở Lô dữ liệu, chọn lô TTR có 8 file làm dải cao 900px trong khi bảng chỉ cần 473px — nửa dưới cột bảng thành khoảng trống, và chiều cao trang nhảy mỗi lần đổi hàng.

Cách làm là `contain: size` trên thân khối chi tiết. Nó khai chiều cao nội tại của thân bằng 0, nên thân không còn tham gia quyết định chiều cao hàng lưới; thân vẫn giãn hết hàng nhờ `stretch`, và phần dôi ra đi vào thanh cuộn của chính nó (`scrollbar-width: thin`, `scrollbar-gutter: stable` để nội dung không dịch khi thanh cuộn hiện). Đây là cách duy nhất giữ được subgrid canh đầu khối: đưa thân ra khỏi luồng bằng `position: absolute` thì khối không còn là mục lưới để subgrid bám vào.

Luật này chỉ chi phối THÂN khối. Đầu khối vẫn nằm chung một hàng lưới và vẫn cao theo nội dung cao hơn — xem quy tắc ngay dưới. Hệ quả còn lại: ở Báo cáo, bản ghi có nút đẩy trạng thái làm đầu khối cao từ 66px lên 96px, nên dải cao thêm 30px so với bản ghi không có nút. Đó là chiều cao của **thao tác**, không phải của dữ liệu tràn.

**The Sticky Head Needs A Scrolling Box Rule.** `position: sticky` neo vào **tổ tiên cuộn gần nhất**, nên đầu cột chỉ dính khi chính `.table-wrap` là vùng cuộn dọc. Trong dải hai cột, `.table-wrap` từng bị gỡ trần chiều cao để dải tự lo chiều cao — hệ quả là vùng cuộn dọc chuyển sang `.panel-body`, `th` neo vào một hộp không cuộn, và đầu cột trôi đi cùng nội dung ngay khi cuộn.

Không vá được bằng `overflow-y: visible` trên `.table-wrap`: CSS quy định khi một trục là `auto` thì trục khai `visible` bị tính thành `auto`, nên nó vẫn là vùng cuộn. Cách làm là **thân khối danh sách thôi cuộn** (`.case-list .panel-body { overflow: hidden }`) và trả vai cuộn dọc về cho bảng (`.case-list .table-wrap { flex: 1; min-height: 0 }`). Được thêm một thứ: chân bảng nằm ngoài vùng cuộn nên luôn nhìn thấy, thay vì phải cuộn hết 200 dòng mới tới nút xuất.

**The Shared Head Row Rule.** Đầu hai khối trong dải phải nằm trên **cùng một hàng lưới**, không phải cùng một con số đoán trước. Một đầu mang ô tìm kiếm, đầu kia mang dòng phụ — hai nội dung đó không bao giờ cao bằng nhau, nên chiều cao cứng luôn để lại một bên lệch, và thân hai khối bắt đầu ở hai độ cao khác nhau đúng chỗ mắt bắt lỗi đầu tiên khi so hai cột. Cách làm là subgrid: `.case-layout` nhận `grid-template-rows: auto minmax(0, 1fr)`, hai cột và hai khối đều thành subgrid kéo dài hai hàng. Khối `@supports (grid-template-rows: subgrid)` được gác thêm bằng `:has(> .case-list > .panel:only-child):has(> .case-detail > .panel:only-child)` — luật chỉ đúng khi mỗi cột có đúng một khối. Trình duyệt không hỗ trợ subgrid rơi về sàn `min-height: 66px` vẫn còn trong mã: hai cột vẫn bằng nhau, chỉ riêng đầu khối là có thể lệch. Sàn 66px đó là lưới an toàn, không phải cách làm; đừng chỉnh nó để "nắn" cho cân.

### Inputs / Fields
- **Style:** cao 32px, viền 1px `--control-line`, bo 6px, nền trắng, đệm ngang 9px. `<select>` rộng tối thiểu 150px với đệm phải 28px chừa chỗ cho mũi tên.
- **Hover:** viền đậm lên `--control-line-hover`.
- **Focus:** vòng mực 2px offset 2px. Ô tìm kiếm là vỏ bọc chứa icon và `<input>` không viền; vỏ bắt `:focus-within`, tự bỏ viền của mình và vẽ vòng focus quanh cả cụm — vòng focus phải bao quanh thứ người dùng thấy là một ô, không bao quanh phần tử bên trong nó.
- **Disabled:** nền giấy mềm, viền `--line`, chữ `--ink-2`, `opacity: 1` — ô khóa vẫn phải đọc được.
- **Nhãn** 12px/650 màu `--ink-2`, đặt trên ô, cách 6px; nhãn phụ trong hàng bộ lọc là 11px/600 màu `--ink-3`.
- **Placeholder** màu `--ink-3` với `opacity: 1`, vì mặc định của trình duyệt làm nó tụt dưới ngưỡng đọc.

### Login
**The Two Columns Do Two Jobs Rule.** Cột trái là NHẬN DIỆN, cột phải là NỘI DUNG, và không cột nào lấn sang việc của cột kia. Bản trước đặt "Đăng nhập theo vai trò nghiệp vụ" bên trái rồi "Đăng nhập" bên phải — cùng một câu nói hai lần, cách nhau nửa màn hình, và người đọc phải tự đoán câu nào mới là tiêu đề thật. Cột nhận diện không được mang chữ nào của luồng đăng nhập: không tiêu đề, không nút, không đường dẫn.

Cột trái vì thế chỉ có một khối duy nhất đặt giữa chiều cao (`margin: auto 0` trong cột flex): con dấu 112px, tên hệ bậc `Display` có `text-wrap: balance` và `max-width: 14ch`, một vạch `56×2px` màu `--brand`, rồi tên cơ quan 14px. Ghi chú dữ liệu mô phỏng ghim đáy sau một vạch `#ffffff1f`.

Cột phải mang toàn bộ phần đọc và làm: `<h1>Đăng nhập</h1>` — thẻ h1 duy nhất của trang — dòng phụ, hai ô nhập, nút gửi, rồi lối đăng nhập một lần.

**Lối phụ đứng sau một vạch "hoặc".** Vạch đó là lưới ba rãnh `1fr auto 1fr` với hai đường kẻ là `::before`/`::after`, nên chữ luôn nằm đúng giữa dù nhãn dài bao nhiêu — không phải một đường kẻ bị chữ đè lên. Nút Keycloak bên dưới **dùng lại đúng thành phần `button is-secondary`** của hệ, chỉ thêm `width: 100%` và `min-height: 44px` để đứng ngang hàng với nút gửi. Vẽ riêng một diện mạo cho nó là tạo bậc nút thứ tư chỉ tồn tại ở một màn.

**Nút tượng trưng phải tự khai là tượng trưng.** Keycloak là hướng đã chọn cho xác thực tập trung nhưng chưa nối trong bản này. Bấm vào nút mở một dòng ghi chú nói thẳng điều đó; nó không giả vờ chuyển hướng rồi quay về. Một nút trông như chạy được mà không chạy là thứ khiến người xem tin nhầm rằng hệ đã có SSO, và đó là hiểu nhầm đắt nhất mà màn này có thể gây ra.

Từ 720px xuống, dải nhận diện co thành một hàng ngang cao tự nhiên — con dấu 46px bên trái, tên hệ và tên cơ quan xếp dọc bên phải — và thành đầu trang thay vì một nửa bố cục. Ghi chú mô phỏng vẫn hiện ở khổ này.

**The Login Is Not A Control Panel Rule.** Màn đăng nhập không mang bảng chọn tài khoản mẫu. Một danh sách in sẵn tên đăng nhập và mật khẩu chung ngay cạnh ô nhập là bộ phận của bản trình diễn chứ không phải của sản phẩm: nó làm màn đầu tiên người xem nhìn thấy tự khai mình là đồ giả, và mọi nhận xét về sau đều bị đặt trong khung đó. Hệ quả phải chịu và không được lách: **ô nhập bắt đầu rỗng**. Điền sẵn một tài khoản cũng là tự khai là demo, chỉ kín đáo hơn. Tài khoản demo vẫn nằm trong `demoAuth`; chỉ lối vào nhanh bị gỡ.

### Navigation
- **Sidebar** rộng 252px, nền navy, cuộn dọc riêng, đệm `20px 14px 14px`. Các màn cấp hệ thống chia theo nhóm; nhóm "Dữ liệu" mở đầu bằng **Tình trạng dữ liệu**. Chữ làm điều hướng: mục **không có icon**, chỉ có nhãn 14px. Ba nhóm ("Điều hành" / "Nghiệp vụ" / "Dữ liệu") ngăn nhau bằng `margin-top: 24px` và một vạch `#ffffff2b`; nhãn nhóm là bậc `nav-group`, `aria-hidden` vì `role="group"` đã mang tên. Nhóm là tiêu đề cấu trúc, các mục bên dưới mới là đích điều hướng.
- **QL1 submenu:** khi mở **Báo cáo công tác nợ**, sidebar bung bảy mục con — Tổng quan, So sánh nợ, Kết quả cưỡng chế, Tạm hoãn xuất cảnh, Tạm hoãn XC · trạng thái 06, Quy tắc và nguồn, Dữ liệu gốc. Đây là các vùng trong cùng báo cáo QL1, không phải bảy màn cấp hệ thống; submenu phản ánh mục đang mở và không thay đổi quyền truy cập.
- **Mục nghỉ:** chữ `--on-chrome-1` cân nặng 400, nền trong suốt, cao 38px. Khai báo `font-weight: 550` cũ đã bị gỡ: nó bị một quy tắc sau đè mất nên chưa bao giờ có hiệu lực, và 550 cạnh 600 của mục đang mở là bậc không ai nhìn ra.
- **Hover:** nền `#ffffff14`, chữ trắng, trượt phải 3px — chỉ khi có chuột thật và không yêu cầu giảm chuyển động.
- **Đang mở:** một tín hiệu đặc và duy nhất — mục cấp hệ thống lật thành **thanh trắng** (`background: var(--surface)`, viền cùng màu), chữ xanh `--brand-strong` cân nặng 600, bóng nhẹ. Mục QL1 đang chọn dùng nền navy sáng nhẹ, chữ trắng và vạch xanh dữ liệu.
- **Mobile:** dưới 900px sidebar ẩn, thay bằng thanh đáy tối đa sáu ô (icon 20px trên nhãn 10px; ô đang mở nhận chữ `--brand` và vạch trên 2px `--brand`) và một drawer navy `min(84vw, 320px)` dùng lại đúng nội dung sidebar, gồm cả submenu QL1 khi phân hệ mở. Drawer có scrim, bẫy Tab, `Escape` để đóng, `inert` cắt nhánh nền khỏi cây trợ năng, và focus trả về nút đã mở nó. Chọn một mục QL1 sẽ đóng drawer.
- **Skip-link** ẩn phía trên khung nhìn, bật ra khi nhận focus: nền navy, chữ trắng, cao 44px, góc trên trái.

**The Panel Is Not A Bibliography Rule.** Khối không mang nhãn "Nguồn: …". Prop `source` của `Panel` và lớp `.panel-source` đã bị gỡ khỏi cả chín màn. Lý do: nhãn đó chiếm một dòng ở mọi khối để nói một thứ người dùng không hành động được, và khi nối dữ liệu thật nó in ra nguyên tên tệp — `BAO_CAO_DANH_GIA_CONG_TAC_NO_DN_TO_CHUC_20260730 - Có chú thích.xlsx` — dài gấp đôi bề ngang cột, kèm cả lỗi bảng mã của chính tên tệp. Nguồn dữ liệu thuộc về tài liệu, không thuộc về chân từng khối. Tên tệp chỉ còn hiện ở nơi nó LÀ dữ liệu: danh sách file trong một lô.

**The Screen Needs A Requirement Rule.** Mỗi màn phải truy được về một epic trong BRD. Màn "Cách lấy dữ liệu" từng tồn tại để ghi cách mỗi phòng lấy dữ liệu, mẫu báo cáo và tần suất — nhưng câu đó chỉ nằm ở dòng *Mục đích* của biên bản khảo sát 24/9, tức mục tiêu của một **buổi làm việc**, không phải một yêu cầu sản phẩm. Đầu ra của buổi khảo sát là chính bản BRD. Sáu epic trong BRD không epic nào cần màn đó; thứ gần nhất, FT-05.2 "ghi rõ nguồn – tham số – thời điểm", đã là màn Lượt chạy dữ liệu. Màn bị gỡ. Một yêu cầu trong biên bản họp không tự nó thành một tab.

**The Page Carries Data, Not Commentary Rule.** Dải `.notice` chỉ được dùng cho trạng thái của **bản ghi đang chọn** bên trong khối chi tiết. Không đặt dải thông báo ở cấp trang. Năm màn từng mở đầu bằng một dải cảnh báo chung — "Ngưỡng chưa có văn bản căn cứ", "Hệ số K chỉ để tham khảo", "Kéo tự động chưa được phép cho mọi nguồn" — và cả năm đều nói điều đúng nhưng không đổi theo dữ liệu, nên sau lần đọc thứ hai chúng thành một dải màu người dùng lướt qua, đồng thời đẩy bảng xuống dưới nếp gấp. Điều kiện và giới hạn thuộc về tài liệu; màn hình mang dữ liệu.

**The Filter Must Have Something To Choose Rule.** Ô lọc chỉ được dựng cho cột có **từ hai giá trị trở lên** trong dữ liệu thật, và điều kiện đó được **đếm ngay trên dữ liệu** chứ không khai cứng. Bộ thật có những cột hằng số: "Loại NNT" ở danh sách chưa cưỡng chế chỉ có đúng một giá trị trên cả 2.455 dòng, "Nhóm xử lý" ở trạng thái 06 cũng vậy. Dựng ô chọn cho chúng là dựng một control bấm vào không đổi được gì. Đếm trên dữ liệu còn có cái lợi thứ hai: kỳ sau có thêm giá trị thì ô lọc tự xuất hiện, không ai phải nhớ mở nó ra.

Hệ quả thấy được: mục Tình hình nợ có ba ô (Đơn vị, Mã CQT, Loại NNT), hai mục cưỡng chế và tạm hoãn ≥500tr có ba ô khác (Đơn vị, Mã CQT, Chương), mục trạng thái 06 có bốn. Nút **Đặt lại** chỉ hiện khi đang có bộ lọc — một nút xoá-bộ-lọc lúc chưa lọc gì cũng là nút không làm gì.

**The Detail Opens On Demand Rule.** Không màn nào còn cột chi tiết đứng cố định. Chi tiết một bản ghi mở trong **thanh trượt bên phải**, ở MỌI khổ màn hình, khi người dùng bấm vào một hàng — cơ chế này vốn đã có sẵn cho khổ hẹp, nay là đường duy nhất.

Cột cố định cũ có ba giá đắt. Nó chiếm 30% bề ngang suốt thời gian kể cả khi người dùng chỉ đang đọc bảng, mà bảng mới là thứ cần bề ngang: bỏ nó đi, khối danh sách nhảy từ 904px lên **1.308px**. Nó luôn hiện một bản ghi, nên lúc vừa mở màn nó hiện bản ghi ĐẦU TIÊN — một hồ sơ người dùng chưa chọn và chưa chắc quan tâm. Và nó là đường dựng thứ hai cho cùng một nội dung: cột và thanh trượt phải nuôi song song, mỗi luật bố cục mới phải kiểm hai lần.

Thanh trượt giữ nguyên hành vi đã có: `Escape` đóng, focus trả về đúng hàng vừa bấm, scrim phủ nền. Hệ quả cho CSS: toàn bộ nhánh `.case-detail` biến mất, kéo theo `contain: size`, subgrid canh đầu khối và trần chiều cao theo khung nhìn — ba cơ chế chỉ tồn tại để hai cột cao bằng nhau.

**The Four Reports Are One Workflow Rule.** Bốn mục nghiệp vụ của QL1 dùng chung kỳ, bộ lọc và khuôn "bảng tổng hợp theo đơn vị rồi danh sách chi tiết"; chúng vẫn thuộc cùng một phân hệ và một lần lập báo cáo. Bảy vùng QL1 được chọn từ submenu dưới **Báo cáo công tác nợ** trong sidebar, thay cho dải `Segmented` ngang; chúng không trở thành bảy màn cấp hệ thống hay đổi vị trí bộ lọc dữ liệu.

Bốn mục khai bằng **cấu hình**, không bằng bốn khối giao diện song song: mỗi mục nói bảng tổng hợp lấy ở đâu, cột nào, danh sách chi tiết là tệp nào. Dựng bốn khối riêng thì mỗi lần sửa khuôn bảng phải sửa bốn chỗ. Bốn danh sách chi tiết dùng chung một kiểu `HangChiTiet` với mọi cột là tuỳ chọn, vì chúng trùng nhau phần lớn và khác nhau ở vài cột số.

**Chỉ nạp mục đang mở.** Bốn tệp chi tiết cộng lại 6,7 MB; nạp cả bốn khi mở màn là tải hết chỗ đó cho một màn mà người dùng chỉ đọc một mục tại một thời điểm. Mỗi mục nạp khi được mở lần đầu rồi giữ trong bộ nhớ phiên.

**Kỳ báo cáo hiện dưới dạng CHỮ, không phải ô chọn**, chừng nào bộ dữ liệu còn đúng một kỳ. Một ô chọn một lựa chọn là control bấm vào không đổi được gì, và nó làm người xem tưởng hệ đã có nhiều kỳ. Dòng dẫn nói cả hai mốc ngày có thật trong tệp gốc — bảng tổng hợp chốt 31/07, danh sách chi tiết chốt 22/07 — thay vì chọn bừa một cái.

**The Same Record Reads The Same To Everyone Rule.** Một trạng thái có **một nhãn và một màu**, giống nhau với mọi vai. Màn Báo cáo từng hiện cùng một bản ghi là "Đã gửi duyệt" màu xanh dương với người lập và "Cần duyệt" màu hổ phách với người duyệt: hai người gọi điện cho nhau sẽ gọi tên hai thứ khác nhau cho cùng một hồ sơ, và không ai đối chiếu được màn hình của mình với màn hình người kia. Vai được phép khác nhau ở **phạm vi** — trưởng phòng không thấy bản nháp của chuyên viên — nhưng không khác ở cách gọi tên.

Dải tổng hợp cũng dùng chung một bộ nhãn, và đếm trên tập hàng **vai đó xem được** chứ không trên toàn bộ dữ liệu; đếm trên toàn bộ thì con số lại nói về những hàng người xem không được mở.

**The Workflow Is Three Steps And One Dead End Rule.** Luồng báo cáo đi đúng ba bước của mục G10 bản thiết kế: **Nháp → Chờ duyệt → Đã chốt**. Chuyên viên gửi, trưởng phòng chốt hoặc trả lại; không vai nào làm được cả hai việc, và bảng `TIEP` ở `Reports.tsx` khóa vai vào từng bước để quyền nằm ở dữ liệu chứ không nằm ở việc ẩn nút trong JSX. Trả lại là đường lùi **duy nhất**, và nó gỡ luôn dấu "đã gửi" trên phiên bản mới nhất: bản quay về tay chuyên viên thì không còn là bản đã nộp.

**Đang vướng** là trạng thái thứ tư nhưng không phải bước thứ tư. Nó nói dữ liệu chưa đạt nên chưa gửi được, vì thế nó không có mặt trong dải ba bước ở khối chi tiết — xếp nó vào chuỗi sẽ đọc ra "vướng rồi mới tới chờ duyệt", điều không đúng.

Hai trạng thái cũ "Đã duyệt" và "Đã phát hành" vẫn ở ngoài: chúng giả định lãnh đạo nhà nước bấm duyệt và phát hành *bên trong* web này, còn **Q-03** — *lãnh đạo nào nhận báo cáo* — vẫn chưa có câu trả lời. Đây là trường hợp riêng của một luật chung: **đừng dựng trạng thái cho một bước xảy ra ngoài hệ thống**. Một trạng thái mà hệ không bao giờ tự đặt được là một ô trống chờ ai đó nhớ vào cập nhật bằng tay.

**The Menu Is The Permission Rule.** Quyền xem màn là tích của **hai trục** — phòng × vai — theo ma trận mục 3 bản thiết kế, và `navCho()` ở `components/nav.ts` là nơi duy nhất tính nó. Bản trước có đúng một tài khoản "Cán bộ thuế" mở được cả chín màn; không ai làm việc như thế, và một tài khoản thấy mọi thứ làm cả bản demo nói sai về cách phân quyền sẽ chạy thật. Mục bảo mật S1 ghi "ẩn hẳn menu, không chỉ làm mờ", nên màn của phòng khác vừa không có trong điều hướng, vừa không mở được bằng deep link — cổng nghiệm thu kiểm cả hai chiều.

Vai **Vận hành dữ liệu** không thuộc phòng nào và mở đúng một màn: nó theo dõi job kéo và xử lý lỗi (Q-77), không đọc số liệu nghiệp vụ, nên màn Giám sát dữ liệu nhìn theo JOB chứ không theo kỳ báo cáo và không có cột tiền.

### Bộ lọc chung
**The Filter Belongs To The Subsystem, Not The Tab Rule.** Kỳ + Đơn vị đặt trong một thanh dính đầu trang, **trên** cụm tab, và lựa chọn sống ở context trên App chứ không ở state của màn — mục G1 đòi "đổi tab không mất lựa chọn", mà một state cục bộ trong màn Nợ sẽ bị dựng lại mỗi lần người dùng rời màn. Đặt thanh này *dưới* cụm tab thì nó đọc thành "lọc của mục này", đúng thứ G1 yêu cầu không được hiểu nhầm.

Thanh dính ở `top: 0`. Trước đây nó dính ở `top: var(--topbar-h)` vì măng sét cũng dính và cao đúng chừng ấy; măng sét bỏ rồi thì mép trên khung nhìn là mốc đúng ở mọi khổ.

Đơn vị chọn nhiều bằng hộp tự dựng, không phải `<select multiple>`: select nhiều ở khổ hẹp cao bằng nửa màn và không cho biết đã chọn gì nếu không cuộn. Danh mục đơn vị lấy từ chính dữ liệu của phân hệ đang mở — QL1 và QL3 dùng hai danh mục khác nhau (mục 6 bản thiết kế), nên một danh sách khai cứng dùng chung sẽ sai ở một trong hai. Mảng rỗng nghĩa là **toàn ngành**, không phải "không khớp gì"; giữ nó rỗng thay vì liệt kê hết để nút bỏ lọc có nghĩa rõ ràng.

### Bảng nhiều tầng tiêu đề
**The Wide Report Shows One Comparison Rule.** Mẫu Excel của QL1 có **28 cột số**: bốn cột hiện trạng cộng ba nhóm "tăng giảm so với" (đầu năm, tháng trước, tuần trước), mỗi nhóm lại chia số tuyệt đối và số tương đối. Màn hình dựng **tám** — hiện trạng cộng đúng một mốc — và hai control trên đầu bảng quyết định đang xem mốc nào, dạng nào. Lý do không phải chỗ hẹp: người đọc so với MỘT mốc tại một thời điểm rồi mới đổi mốc, nên 28 cột cùng lúc là bắt họ bỏ qua 20 cột ở mỗi lần nhìn. Dòng chữ dưới bảng nói rõ bản kết xuất Excel vẫn đủ 28 cột, để không ai tưởng màn hình đã là toàn bộ báo cáo.

**The Header Offset Is Measured, Not Declared.** Dòng tiêu đề thứ hai dính ở `top: var(--cao-dau)`, giá trị do `ResizeObserver` đo đáy dòng thứ nhất rồi truyền vào. Khai cứng `34px` là chỗ hỏng: nhãn nhóm dài hơn một dòng thì dòng đầu cao hơn, dòng hai dính lên quá cao, và dải hở giữa hai dòng để lọt số của các hàng đang cuộn phía sau — bảng đọc ra như có một dòng ma. Cùng lý do, mốc trái của cột đơn vị là `var(--dv-trai)` chứ không phải một con số: QL1 có cột STT đứng trước nó, QL3 thì không.

**The Column Widths Live In The Config.** Toàn hệ dùng `table-layout: fixed` để khung bảng đứng yên qua mọi trang. Nhưng `fixed` mà không khai bề rộng thì mọi cột chia đều, và mười ba cột chia đều nghĩa là cột tên đè lên cột bên cạnh. Bề rộng vì thế khai theo TÊN CỘT trong cấu hình rồi dựng thành `<colgroup>`, không khai bằng `nth-child` trong CSS — bốn mục có số cột khác nhau, và một bộ `nth-child` cho mỗi mục là bốn chỗ phải sửa mỗi lần đổi một cột. Bảng tổng hợp đi xa hơn: chỉ cột đơn vị khai bề rộng, các cột số chia đều phần còn lại, nên bảng nở vừa khít khung thay vì tràn ra ngoài.

### Tham số và nguồn
**The Threshold Has One Home Rule.** Mọi ngưỡng nằm trong `data/thamSo.ts` và chỉ ở đó. Màn Quy tắc đọc nó để hiện; bộ sinh dữ liệu đọc nó để dựng cột "Ngưỡng" và lọc danh sách tăng nợ; tiêu đề danh sách cũng đọc nó. Gõ "500 triệu" vào tiêu đề rồi lọc bằng một hằng khác là cách tiêu đề bắt đầu nói dối mà không ai phát hiện. Tiêu chí NT-06 của BRD kiểm đúng điều này: đổi ngưỡng thì báo cáo đổi theo mà không phải sửa mã.

**The Screen Does Not Print Someone's Disk.** Sheet `QuyTac_Nguon` của file thật ghi đủ `D:\DTNGOC\QLHT DN SO 1\...` cho từng nguồn. Tab Dữ liệu gốc liệt kê cùng những nguồn ấy nhưng bỏ hẳn đường dẫn — mục S4 cấm, và nó cũng không giúp gì người đọc: thứ họ cần biết là nguồn nào, chốt ngày nào, bao nhiêu dòng.

**The Mismatch Goes Above The Table.** Cảnh báo lệch ngày chốt và lệch số dòng đứng TRƯỚC danh sách nguồn, không phải chú thích cuối trang: chúng làm thay đổi cách đọc mọi con số bên dưới. File mẫu thật có ba mốc ngày cho cùng một kỳ mà không chỗ nào giải thích; màn hình phải nêu ra thay vì để người dùng phát hiện sau khi đã trích số đi họp.

### Tổng quan
**The Overview Invents Nothing Rule.** Tab Tổng quan chỉ gom lại thứ đã nằm trong các mục khác và nói nó đến từ mục nào. Không chỉ số tổng hợp tự nghĩ ra, không điểm số, không xếp hạng rủi ro — bản thiết kế ghi thẳng "mọi số đều là số đã có trong các tab 1–8, không tạo chỉ tiêu mới". Một chỉ tiêu mới ở màn tổng quan là một con số không truy ngược được về bất kỳ bảng nào, và nó sẽ được trích đi họp trước khi ai kịp hỏi nó tính thế nào.

Khối xếp hạng chỉ lấy đơn vị đang xấu đi, không xếp hạng toàn bộ: đây là danh sách để đôn đốc, nên đơn vị đã giảm nợ không thuộc về nó. Ở QL3, đơn vị chưa đạt KPI đăng ký đổi MÀU thanh chứ không chỉ thêm chữ, vì danh sách này được quét bằng mắt theo chiều dọc.

**The Department Owns Its Screens Rule.** Màn QL3 từng mang cả chênh lệch tờ khai – hóa đơn, xác minh hóa đơn và một dải hệ số K. BRD mục 8 xếp cả ba vào QLDN2 (`BR-QL2-01`, `BR-QL2-02`, `BR-QL2-04`); QL3 chỉ có `BR-QL3-01` và `BR-QL3-02`. Để chúng ở màn QL3 làm bản demo nói sai về phân công giữa các phòng — đúng loại sai mà việc tách tài khoản theo phòng đang cố tránh. Danh mục đơn vị cũng vậy: QL3 không có Phòng QLHKD và Phòng QLĐ, còn thuế cơ sở của nó mang mã địa bàn, nên hai phân hệ không dùng chung một danh mục.

### Màu của dữ liệu
**The Data Has Its Own Colour Rule.** Sắc đỏ con dấu đã mang **hai** nghĩa trong hệ — `--brand` là hành động, `--critical` là can thiệp. Thanh tỷ lệ và thanh xếp hạng từng tô `--brand`, nên một bảng ba mươi dòng đọc ra như ba mươi cảnh báo, và lúc cần báo động thật thì không còn màu nào để báo.

Đại lượng vì thế có màu riêng: `--data` lam ngọc sẫm `#1d5a61`, nốt bù của đỏ con dấu — đủ khác để không ai nhầm nó với cảnh báo, đủ trầm để không tranh chỗ với mực. Nó chỉ nói "đây là một đại lượng", không nói tốt hay xấu.

Đánh giá vẫn do `--critical` và `--positive` đảm nhiệm, và **chỉ ở nơi có ngưỡng thật**: mũi tên tăng giảm nợ (tăng là xấu, giảm là tốt — ngưỡng là số 0) và thanh của đơn vị chưa đạt KPI đăng ký ở QL3 (ngưỡng là KPI họ tự đăng ký). Danh sách "đơn vị tăng nợ nhiều nhất" KHÔNG tô đỏ: tiêu đề đã nói nó là danh sách gì, còn thanh ở đó đang trả lời "nhiều bao nhiêu", không phải "có đáng lo không".

### Soát toàn hệ
`npm run soat` đi qua **mọi tài khoản × mọi màn × mọi mục × ba khổ** và in ra bốn nhóm phát hiện: tràn, cột dính để lọt nội dung, vùng chạm dưới ngưỡng, tương phản dưới chuẩn. Nó khác `npm run acceptance` ở mục đích — cổng nghiệm thu khẳng định những điều đã biết là đúng và dừng ở lỗi đầu tiên; lượt soát đi tìm thứ chưa ai nhìn và chạy hết để thấy toàn cảnh.

Hai phép đo trong đó phải trừ hao, vì nếu không chúng báo nhầm chính các quy ước của hệ:

- **Vùng bấm cả hàng cố ý tràn.** `.row-select` và `.dv-nut` nới rộng hơn ô 24px rồi kéo lại bằng lề âm, nên ô nào chứa chúng cũng có đúng 2px scroll mà không chữ nào bị cắt. Ngưỡng báo đặt ở 4px.
- **Ô dính che ô dính là đúng việc.** Dòng tiêu đề dính che hàng đang cuộn qua nó, và thanh điều hướng đáy che đáy khung nhìn — cả hai đều theo thiết kế. Phép kiểm hỏi `elementFromPoint` rồi bỏ qua phần tử dính và lớp phủ cố định; chỉ báo khi một ô **thường** lọt lên trên cột dính.

### Danh sách màn
**The Screen List Comes From The Document Rule.** Menu trái có đúng những màn §1.2 bản thiết kế gọi tên: khung chung (gồm **Tình trạng dữ liệu**), phân hệ của phòng, và **Giám sát dữ liệu** cho vai Vận hành. Bốn màn đã gỡ, mỗi màn kèm chỗ nội dung của nó chuyển đến:

| Màn đã gỡ | Vì sao | Nội dung chuyển đi đâu |
|---|---|---|
| Báo cáo | Tài liệu không có màn danh sách báo cáo. Mục 3 vẽ luồng duyệt chạy trên chính phân hệ | Thanh duyệt ở đầu phân hệ |
| Lượt chạy dữ liệu · Lô dữ liệu | §1.2 gọi tên MỘT màn, "Tình trạng dữ liệu" | Hai mục của màn đó |
| Ánh xạ quản lý | Không có trong tài liệu như một màn; nó là chất lượng dữ liệu của kỳ | Mục "Gắn về phòng" |
| Quy tắc nghiệp vụ | §4.2 đặt nó làm tab 9 BÊN TRONG phân hệ QL1 | Tab "Ngưỡng đang áp dụng" |

Ba màn dữ liệu tách rời bắt người dùng mở lần lượt cả ba mới trả lời được một câu hỏi duy nhất — kỳ này dữ liệu đã về đủ chưa — và không chỗ nào cho họ biết là còn hai chỗ nữa phải xem. Ngưỡng tách khỏi bảng số thì nó mất ngữ cảnh: một con số ngưỡng chỉ có nghĩa cùng bảng nó đang áp vào.

**The Approval Lives Where The Numbers Live Rule.** Trạng thái duyệt và ba nút của nó nằm ngay đầu phân hệ, cùng màn với bảng số mà chúng nói về. Đặt ở một màn riêng thì trưởng phòng phải rời khỏi số vừa đọc để đi tìm nút duyệt, và lúc bấm thì không còn nhìn thấy thứ mình đang duyệt. Khóa trạng thái là `phân hệ + kỳ`, nên đổi kỳ ở thanh lọc là thấy ngay kỳ ấy đang ở bước nào.

Trả lại **bắt buộc có lý do** — sơ đồ luồng ghi thẳng "Trả lại + lý do". Trả lại không nói vì sao thì chuyên viên nhận về một bản nháp mà không biết sửa gì, nên vòng duyệt thứ hai hỏng y như vòng thứ nhất. Lý do hiện lại trên thanh duyệt của chuyên viên, không chỉ trong một thông báo thoáng qua.

**The Fallback Button Appears Only When Needed Rule.** Nút tải tay nằm ở màn Tình trạng dữ liệu và chỉ dựng khi thật sự có nguồn thiếu — G12: "Tải tay chỉ là dự phòng… nút chỉ hiện khi nguồn thiếu". Măng sét hiện ở mọi màn và mọi lúc, nên đặt nó ở đó là nói ngược lại điều tài liệu dặn. Măng sét nay không còn nút cấp hệ thống nào.

### Chữ trên giao diện
**The Label Is The Department's Word Rule.** G4 ghi "giữ đúng tên chỉ tiêu nguyên văn như file Excel của phòng", nên tên cột không đổi: "Nợ KNT ngày báo cáo", "Tổng nợ đánh giá MST+CQT", "Số DN đã hoàn thành (ko tính hồ sơ chờ giải trình)". Thứ được viết lại là chữ của HỆ THỐNG — tên mục, câu rỗng, thông báo, nhãn nút:

- Tên mục lấy theo §4.2 chứ không tự đặt: "So sánh nợ", "Kết quả cưỡng chế", "Tạm hoãn xuất cảnh", "Trạng thái 06".
- Nhãn control nói thứ người dùng chọn, không nói thuật ngữ thống kê: "Số tiền / Phần trăm" thay cho "Tuyệt đối / Tương đối".
- Câu rỗng nói rõ tập nào đang rỗng: "Không có người nộp thuế nào khớp bộ lọc đang đặt", không phải "Không có bản ghi nào".
- Thông báo nói việc đã xảy ra và hệ quả: "Đã gửi báo cáo tuần… lên trưởng phòng. Số liệu khóa lại cho tới khi có kết quả duyệt."
- Lỗi nhập nói cần làm gì và để làm gì: "Nhập lý do trả lại để chuyên viên biết cần sửa gì", thay cho thông báo mặc định tiếng Anh của trình duyệt.

**The Total Row Does Not Need A Colour Rule.** Dòng tổng và dòng khối nổi bằng cân nặng chữ và vạch trên, không bằng mảng màu. Tô đặc `--brand` rồi đặt chữ trắng lên làm mất vai trò hành động của màu xanh; mũi tên tăng giảm trong chính hai dòng ấy vẫn mang màu nghĩa. Giữ dòng tổng trung tính để so sánh số liệu và hướng biến động không bị nhiễu.

### Theo FRS
**The Catalogue Has One Home Rule.** FRS mở đầu mục 4 bằng câu quyết định: "Mọi phân hệ khác đọc danh mục từ đây, không tự giữ bản riêng." `data/danhMuc.ts` giữ 31 mã cơ quan thuế của Phụ lục A, và hai phân hệ dựng danh sách đơn vị từ đó. Trước đó mỗi phân hệ tự khai, và hai bản đã lệch nhau thật: mã viết tắt của Thuế cơ sở 18 đến 25 ở QL3 sai so với Phụ lục A.

Lỗi nặng hơn mà bản khai tay giấu đi: **năm Thuế cơ sở gồm HAI mã địa bàn** — TCS18 là Sóc Sơn (0117) cộng Mê Linh (0127), tương tự TCS19, 20, 21, 22. Danh mục một đơn vị một mã thì báo cáo kéo theo mã địa bàn gom hụt đúng một nửa, và không có dấu hiệu nào trên màn để ai đó nhận ra.

**The Lifecycle Has Four States, Not Three.** BC-06 và bảng 13.2 của FRS: **Nháp → Đã rà soát → Đã duyệt**, cộng **Điều chỉnh** mở từ bản đã duyệt kèm lý do. Bản demo trước dừng ở ba trạng thái và coi "đã chốt" là điểm cuối. Báo cáo thuế bị sửa sau khi đã trình là chuyện có thật; không có đường ấy thì người dùng sẽ sửa ngoài hệ rồi gửi file tay, và hệ mất luôn dấu vết mà nó sinh ra để giữ.

Bản điều chỉnh giữ `soBanDaDuyet` nên nó tự biết mình là bản thay thế, và thanh duyệt nói ra điều đó. Bản đã duyệt cũ vẫn tra cứu được cho tới khi bản mới được duyệt.

Tên trạng thái lấy theo FRS chứ không theo bản thiết kế (G10 gọi "Chờ duyệt", "Đã chốt"). Hai tài liệu gọi hai tên cho cùng một bước là thứ phải dừng ở lúc triển khai, không mang vào giao diện.

**The Author Does Not Approve Their Own Work Rule.** QR-03 của FRS: "người lập báo cáo không tự duyệt báo cáo của mình." Đây là luật phân nhiệm, không phải luật vai trò — một người kiêm hai vai vẫn không được duyệt bản chính mình gửi. Nên `canChangeApproval` so **tên người gửi**, không chỉ so vai; kiểm theo vai thôi thì ngày có người kiêm nhiệm là luật tự lặng lẽ mất hiệu lực.

**The Ratio Rules Live In One Place.** BC-10: "tỷ lệ khi mẫu số = 0 → để trống", "tỷ lệ hiển thị 2 chữ số thập phân". Bốn màn trước đó mỗi màn một hàm `pt` riêng với một chữ số thập phân. Để trống chứ không phải 0%: mẫu số bằng 0 nghĩa là **không có gì** để tính tỷ lệ, còn 0% nghĩa là có việc phải làm mà chưa làm được gì — đơn vị đọc nhầm sẽ đi giải trình một con số không tồn tại.

**MH-03 Answers What The Approval Bar Cannot.** Thanh duyệt ở đầu phân hệ chỉ nói về kỳ đang mở. QT-08 hỏi một câu khác: trong cả loạt kỳ, kỳ nào chưa ai chạy, kỳ nào đang nằm chờ ai, hạn là bao giờ. Vì thế bảng báo cáo × kỳ phân biệt **"Chưa chạy"** với **"Nháp"** — gộp hai thứ làm một thì mọi kỳ cũ đọc ra như đang có người làm dở.

**The Selected Row Keeps Its Fill.** Mực phụ `--ink-3` đạt 5,05:1 trên nền trắng nhưng chỉ 4,07:1 trên nền hàng đang chọn. Cách sửa phía nền đòi làm nhạt nền tới mức chỉ còn 1,11:1 so với trắng — lúc đó hàng đang chọn không còn ra dáng đang chọn. Nên mực đổi, nền giữ: trong hàng đang chọn, `small` lùi lên `--ink-2` (6,04:1).

**The Table Picks, The Drawer Reads Rule (chốt 09/10/2026).** Mọi **danh sách hồ sơ** — một dòng là một ca cần xử lý — giữ trên bảng những cột đủ để **chọn**, và để mọi cột còn lại cho **ngăn trượt** mở khi bấm cả hàng. Việc trên màn danh sách là triage: tìm ra ca cần làm, rồi mới đọc nó. Cột nào không đổi được quyết định "mở dòng này hay dòng kia" thì nó không thuộc về bảng.

Trước ngày chốt, sáu danh sách của bốn phòng bày đủ mọi cột của nguồn: 1.450px tới 2.304px trong khung 1.146px, tức kéo ngang hai ba lần cho mỗi dòng. Nay cả sáu vừa khung, không cuộn ngang ở khổ 1440.

| Màn | Trước | Sau |
|---|---|---|
| QL1 · ba mục xử lý (cưỡng chế, tạm hoãn, trạng thái 06) | 13–15 cột, 1.578–2.304px | 6 cột |
| QL2 · Hóa đơn còn tồn xác minh | 10 cột, 1.550px | 6 cột |
| QL2 · Hệ số K – Lượt còn tồn | 13 cột, 2.116px | 7 cột |
| QL4 · Hồ sơ đang xử lý | 10 cột, 1.750px | 6 cột |
| QL4 · Hồ sơ vênh | 8 cột, 1.510px | 6 cột |
| QL4 · Danh sách phiếu ghi | 10 cột, 1.748px | 6 cột |

Bốn điều ràng buộc, dựng một lần trong `components/ChonHang.tsx` để sáu màn không lạc nhau: hồ sơ đang mở nằm trong **địa chỉ** (`?so=`, hoặc `?nnt=` ở QL1 vì `so` đã mang nghĩa khác trên cùng màn ấy); đóng ngăn thì con trỏ về đúng dòng vừa bấm; **nút nằm trong hàng là việc riêng của nó**, bấm nút không mở ngăn; và ngăn phải mang **đủ** những cột bảng đã bỏ — bỏ cột mà không có chỗ đọc lại là giấu số, không phải thu gọn.

Ngoại lệ, và lý do: **lưới nhập liệu** không áp luật này. Màn "Nhập kết quả phiếu" và "Gói rủi ro Công an" có ô nhập trong từng hàng và bấm hàng đã mang nghĩa chọn-để-điền, nên một ngăn trượt sẽ cướp mất cú bấm ấy; chúng giữ bảng rộng. **Bảng báo cáo theo mẫu** cũng không áp: cột của chúng là cột của sheet Excel, bỏ bớt là lệch mẫu.

**The Group Header Says The Formula Rule (chốt 09/10/2026).** Khi một bảng tổng hợp có mấy cột cộng lại thành một cột khác, **xếp chúng cạnh nhau dưới một tiêu đề nhóm** thay vì viết công thức vào dòng chú thích. Bảng "Xác minh hóa đơn · theo đơn vị" từng chép đúng thứ tự tệp nguồn (10 · 14 · 6 · 7 · 8) rồi dặn bên dưới "Tồn = 6 + 7 + 8 + 10" — người đọc phải tự ánh xạ bốn mã sang bốn cột rời nhau. Nay bốn trạng thái tồn đứng dưới một tiêu đề "Còn tồn" kèm cột "Cộng tồn", và câu công thức không cần viết nữa. Mã trạng thái lùi vào `title`: nó là khóa đối chiếu với tệp nguồn, không phải thứ người đọc cần trên mỗi tiêu đề cột.

Cùng lần chốt ấy, cột "Đang kẹt ở bước nào" (thanh năm sắc) đã **gỡ**: tài liệu không ghi cách đọc nào như vậy, nên nó là một kết luận bản mẫu tự nghĩ ra — cùng lý do với **The Overview Invents Nothing Rule**.

**The Week Label Says Which Week And Which Days Rule (chốt 09/10/2026).** Nhãn kỳ tuần có MỘT dạng cho cả bốn phòng: `Tuần 39/2026 · 18/09–24/09`. Nó nói đủ hai thứ người dùng cần — tuần nào, và tuần ấy là những ngày nào.

Trước ngày chốt mỗi báo cáo tự đặt một kiểu: QL1 `Tuần · nợ đến 31/07/2026`, QL2-02 `Tuần 39/2026 · 18/09–24/09`, QL2-04 `Tuần 39/2026 · đến 25/09`, QL4 `Tuần 39/2026`. Hai kiểu đầu không nói số tuần, kiểu cuối không nói ngày nào. Đổi tab là đổi cách đọc, trong khi kỳ là thứ người dùng kiểm lại mỗi lần mở một báo cáo. Số tuần tính theo ISO 8601 trong `data/nhanKy.ts`, không viết cứng vào từng danh mục kỳ.

**Một ngoại lệ, có lý do:** ngày chốt tuần của QL1 không cách nhau bảy ngày — tệp gốc có 07/07, 16/07, 22/07, 31/07, tức cách nhau 9, 6 rồi 9 ngày, và tài liệu ghi rõ điều đó là có thật. Số nợ cũng là ảnh chụp TẠI ngày chốt chứ không phải tổng của một khoảng. Nên QL1 giữ hình dạng chung nhưng nói thẳng đây là mốc chụp: `Tuần 31/2026 · nợ đến 31/07`. Bịa ra một khoảng bảy ngày cho nó là dựng một kỳ không tồn tại.

**The Block Is A Filter, Not Just A Sort Rule (chốt 09/10/2026).** Bảng xếp Văn phòng trước, Thuế cơ sở sau là một cách SẮP, không thay được cách LỌC: khối Thuế cơ sở có 25 đơn vị, nên muốn chỉ đọc năm phòng Văn phòng thì phải bỏ qua hai mươi lăm dòng bằng mắt, còn thanh lọc chung thì chọn từng đơn vị — tick đủ 25 ô là một việc khác hẳn. Màn tổng hợp theo đơn vị vì thế có ô lọc **Khối** (`?khoi=`). Khi đang lọc, dòng tổng cộng **tổng của phần đang xem** và đổi nhãn theo (`Cộng Khối Văn phòng Thuế TP Hà Nội`): để nó cộng cả hai khối thì mọi phép so dòng-với-tổng trên màn đều sai.

**The Four Tabs Open The Same Way Rule.** Bốn mục của QL1 mở đầu danh sách chi tiết bằng cùng **ba** cột, cùng thứ tự: MST · Tên NNT · Phòng / Thuế cơ sở. Trong **ngăn chi tiết**, thứ tự đầy đủ vẫn là MST · Tên NNT · Phòng / Thuế cơ sở · Mã CQT · Loại NNT, rồi Chương (ba mục có), rồi khối tiền riêng của mục, rồi khối xử lý, và cuối cùng là Kết luận với Ghi chú. (Trước 09/10/2026 cả năm cột định danh đứng trên bảng; từ khi ba mục xử lý thu gọn, Mã CQT và Loại NNT lùi vào ngăn — luật giữ nguyên, chỗ áp thì đổi.)

Ba sheet Excel gốc tự chúng xếp khác nhau — sheet cưỡng chế để "Phòng/TCS" ở cột 5, sheet trạng thái 06 để nó ở cột 10 dưới tên "Map Phòng/Thuế cơ sở". Bê nguyên từng sheet lên màn thì đổi mục là phải dò lại từ đầu xem cột đơn vị nằm đâu, mà đổi mục là thao tác người dùng làm liên tục.

Việc này không trái G4 ("giữ đúng tên chỉ tiêu nguyên văn"): tên cột giữ nguyên, chỉ **thứ tự trên màn** là thống nhất, còn bản kết xuất Excel vẫn dựng đúng thứ tự của từng mẫu sheet. Một ngoại lệ về tên, có chủ ý: sheet cưỡng chế gọi cột mã cơ quan thuế là "CQT", sheet trạng thái 06 gọi "Cơ quan thuế" — hai tên cho cùng một thứ, nên màn hình chọn một tên là "Mã CQT".

### Blocked State
Dùng khi một màn **không có dữ liệu để trình bày** và chính lý do đó mới là nội dung. Thứ tự: kết luận một dòng, từng việc còn thiếu kèm con số đứng trước câu chữ, lối ra bằng một nút, rồi những điều kiện ĐÃ đạt lùi xuống cuối ở cỡ 12px màu `--ink-3`.

**The Blocked Screen Says It Once Rule.** Tab "Tờ khai & hóa đơn" từng mặc trang phục dashboard: bốn ô tổng hợp rồi một bảng điều kiện hai cột. Cả bốn ô nói đúng một điều — thiếu file mua vào — và nói lại lần thứ tư ở dòng "Đủ 26 file mua vào · Còn thiếu". Người dùng quét hết bốn con số rồi mới hiểu ra không có gì để đọc, và không có nút nào để đi tiếp. Màn bị chặn thì **nói thẳng là bị chặn, đúng một lần**, không dựng dải tổng hợp cho những con số chỉ để nhắc lại rằng chúng chưa tính được.

Hai điều kiện đã đạt gộp vào một dòng chữ nhỏ: chúng không sai, nhưng cũng không phải thứ người dùng cần làm gì với, nên không được chiếm cùng trọng lượng với việc còn thiếu. Con số thiếu (`0/26`) đứng TRƯỚC câu chữ vì nó trả lời "thiếu bao nhiêu" nhanh nhất.

### Notice
Dải thông báo trong khối: cao tối thiểu 44px, bo 6px, không viền, nền là bậc nhạt của màu trạng thái (`warning` / `critical` / `info` / `positive`). Nhãn in đậm 650 mang màu trạng thái; phần giải thích chuyển về màu mực `--ink-2` để đọc được, không nhuộm theo tông.

**The Notice Wraps Rule.** Nhãn và phần giải thích nằm cùng hàng khi còn chỗ và **xuống dòng** khi hết chỗ: `flex-wrap: wrap`, nhãn `flex: 0 1 auto` (co được), phần giải thích `flex: 1 1 22ch`. Trước đây nhãn để `flex: none` nên trong cột hẹp của ngăn chi tiết nó giữ nguyên bề ngang còn phần giải thích bị ép xuống vài chục pixel — mỗi dòng một chữ. Đây là lỗi đã được báo trên bản dựng, không phải phòng xa.

### Detail Panel (DetailGrid)
Lưới `<dl>` bốn cột trên desktop, hai cột trong ngăn chi tiết và từ 720px xuống. Mỗi ô cao tối thiểu 56px, đệm `9px 16px`, ngăn nhau bằng `--line-soft` theo cả hai trục; nhãn là bậc `label` màu `--ink-3`, giá trị 14px/500 màu mực, dòng phụ 11px/400.

**The Single Left Edge Rule.** Mọi thứ trong ô căn về một mép trái duy nhất: `justify-items: start`, `text-align: left`, và `margin: 0` trên cả `dt` lẫn `dd`. Trình duyệt cho `<dd>` một thụt lề mặc định 40px, nên nếu không xóa thì giá trị bị đẩy sang phải trong khi nhãn ngay trên nó lại sát trái — hai mép trong một ô là lỗi đọc, không phải phong cách.

### Page Intro & Page Actions
`PageIntro` không dựng khung riêng: nó trả về `<h1 class="sr-only">` cộng dòng dẫn `.page-lead` (13px/400, `max-width: 72ch`, màu `--ink-2`), rồi gửi cụm thao tác đi nơi khác.

**The No Masthead Rule (chốt 07/10/2026).** Hệ KHÔNG có măng sét. Quyết định của người dùng: nó không đáng một dải ngang ở mọi màn khi việc xuất dữ liệu đã có nút ngay trong đầu khối của từng bảng.

Măng sét từng mang bốn thứ, và ba thứ phải có chỗ mới trước khi gỡ nó:

- **Nút mở ngăn điều hướng** chuyển xuống thanh điều hướng đáy, và nay LUÔN có mặt chứ không chỉ khi vai có hơn năm màn. Đây là phần bắt buộc: dưới 900px thanh bên ẩn, nên không có nút ấy thì **mục của phân hệ** không còn lối nào để mở — một vai bốn màn như chuyên viên QL3 sẽ mất hẳn Tổng quan, Danh sách NNT và KPI đăng ký.
- **Thao tác cấp trang.**  và  cho **cả bộ sheet** vào **khối Xem báo cáo** — xem The Export Lives On What It Exports Rule bên dưới. Các thao tác cấp trang khác vào đầu khối mà chúng nói về: "Mở báo cáo của phòng" ở đầu khối công việc, "Tải tệp bổ sung" ở đầu khối nguồn dữ liệu.
- **Dải bối cảnh** ("Tháng 9/2026 · Thuế TP Hà Nội") bỏ hẳn: kỳ đang xem đã nằm trong thanh lọc chung ngay dòng đầu nội dung, còn tên cơ quan lặp lại ở mọi màn mà không ai cần.
- Ô cắm thứ hai cho thao tác cấp hệ thống vốn đã rỗng từ lâu (`hanhDongChung = null`), nên gỡ nó không mất gì.

Hệ quả bố cục: thanh lọc chung dính ở `top: 0`, `--topbar-h` không còn tồn tại, và nội dung bắt đầu ngay mép trên khung nhìn.

Điều này KHÔNG mở cửa cho việc dựng lại một hàng tiêu đề chỉ để có chỗ đặt nút. Tiêu đề màn vẫn ẩn (The Silent H1 Rule); nút cấp trang đứng một mình ở đầu nội dung là hình dạng đã chọn.

**The One Name Per Job Rule.** Một việc có MỘT nút và MỘT nhãn, đứng cố định một chỗ. Ba màn nghiệp vụ từng tự dựng nút tạo báo cáo riêng — "Tạo báo cáo tuần" ở Nợ, "Tạo báo cáo tháng 9" ở Kiểm tra, "Tạo báo cáo kỳ này" ở Hoàn thuế — ba nhãn cho cùng một hành động, và kỳ báo cáo bị đóng cứng vào nhãn nút trong khi kỳ là thứ hộp thoại hỏi. Người dùng không học được "nút này ở đâu" vì câu trả lời đổi theo màn. Nay chỉ còn `Tạo báo cáo`, không kèm kỳ.

**Hai bậc thao tác, hai chỗ đứng.** Măng sét mang hai cụm khác nhau và không trộn:

| Bậc | Thuộc về | Chỗ đứng | Ví dụ |
|---|---|---|---|
| Cấp trang | Màn đang mở | `#page-actions-slot`, bắn vào bằng portal | ô tìm kiếm, bộ lọc kỳ |
| Cấp hệ thống | ~~Cả hệ, có mặt trên mọi màn~~ | **Không còn.** Ô cắm đã rỗng từ lâu và măng sét đã gỡ | — |

Thao tác cấp hệ thống không đi qua portal: nó không thuộc màn nào nên không có màn nào để bắn đi. Dưới 901px cả hai bậc đều rơi về nội dung; cụm cấp hệ thống thành `.system-actions`, hai nút chia đôi bề ngang bằng `flex: 1 1 0` để không nút nào trông như phụ của nút kia, và nằm TRÊN dòng dẫn vì nó thuộc về khung chứ không thuộc về trang.

**Hệ quả với trạng thái.** Nút cấp hệ thống bấm được cả khi đang mở chính màn đích, nên yêu cầu mở hộp thoại không được đi qua tham số đường dẫn hay hiệu ứng "chạy khi mount": ở đó không có lần dựng mới nào để bám vào, và lần bấm thứ hai sẽ im lặng không mở. `App` giữ một cờ, màn đích trả cờ lại ngay sau khi dùng.

**The One Door For Files Rule.** Mọi tệp vào hệ đi qua MỘT cửa. Chỗ phân loại tệp nằm bên trong hộp thoại, sau khi bấm, chứ không nằm ở việc chọn đúng nút trước khi bấm — người đang hỏi "nộp cái này ở đâu" là người chưa phân loại được. Hộp thoại `Nhập dữ liệu` hỏi loại trước (phiếu khai cách lấy dữ liệu / file dữ liệu mẫu từ nguồn) rồi lọc `accept` theo loại đã chọn. Màn Lô dữ liệu vì thế không còn nút nhập riêng.

**Ô chọn tệp gốc luôn bị ẩn.** `input[type=file]` in nhãn theo ngôn ngữ trình duyệt ("Choose Files / No file chosen") và không đổi được bằng CSS. Trên một sản phẩm toàn tiếng Việt đó là hai chữ lạc giữa màn. Ô gốc nhận `.sr-only`, `tabIndex={-1}` và `aria-hidden`; control thật là nút `Chọn tệp` bên cạnh, còn tên tệp đã chọn do ta tự in ra.

**The Column Width Is Declared, Not Discovered Rule.** Mọi bảng dùng `table-layout: fixed` và khai bề rộng cột bằng phần trăm. `auto` tính bề rộng theo nội dung **của riêng trang đang xem**, nên sang trang hoặc đổi bộ lọc là khung đổi theo: cùng một bảng mà cột tên lúc rộng lúc hẹp, mắt phải định vị lại từ đầu ở mỗi lần bấm. Đây là thứ người dùng mô tả là "loãng tầm nhìn", và nó chỉ lộ ra khi danh sách đủ dài để có trang thứ hai.

Mỗi bảng chừa đúng **một** cột không khai bề rộng — cột chữ dài nhất — để nó hứng phần dư. Chừa hai cột trở lên thì chúng chia đều phần dư, mà "đều" gần như luôn sai với cột chữ. Tỷ lệ lấy từ bề rộng tự nhiên đo ở khổ 1600 rồi nhường thêm cho cột co giãn.

Hai hệ quả phải xử lý cùng lúc. Thứ nhất, `fixed` không co ô theo nội dung nữa nên chuỗi dài không ngắt được sẽ tràn: mã số thuế, tên tệp và đường dẫn nhận `overflow-wrap: anywhere`. Thứ hai, bề rộng cột là phần trăm của bề ngang bảng, nên **sàn `min-width` của bảng quyết định cột hẹp nhất nhận bao nhiêu pixel** ở khổ màn hình nhỏ; sàn 780px cũ làm ngày hiệu lực và chip trạng thái tràn ở 768px và 390px. Sàn chung nâng lên 820px, bảng Báo cáo 880px, bảng Quy tắc 1100px vì nó có nhiều cột `nowrap` nhất.

### Tables
Bảng rộng tối thiểu 780px, nằm trong vùng cuộn có trần `min(62vh, 560px)` — trần này được gỡ khi bảng nằm trong dải hai cột, vì ở đó dải đã lo chiều cao. Vùng cuộn mang `tabIndex={0}`, `role="region"` và `aria-label` — đã là điểm dừng Tab thì phải có tên, nếu không người dùng trình đọc màn hình gặp một loạt điểm dừng câm. Đầu cột sticky, nền `--surface-soft`, chữ `--ink-2` bậc `column-head`. Ô cao 38px (44px từ 720px), vạch dưới `--line-soft`, hàng cuối bỏ vạch. Hàng đang chọn nhận nền `--selected-surface` và chữ nặng 500. Chân bảng là một dải 12px màu `--ink-3` có vạch trên. Dưới 900px hiện dải nhắc "Vuốt ngang để xem thêm" nền `--surface-tint`, chữ `--brand`.

**The Constant Column Earns Nothing Rule.** Một cột — hay một dòng phụ — mang **cùng một giá trị ở mọi hàng** thì không phân biệt được hàng nào với hàng nào, mà vẫn ăn bề ngang hoặc chiều cao của những cột đang thiếu chỗ. Bộ dữ liệu thật ở màn Nợ có bốn trường như vậy, đều hằng số trên cả 2.455 dòng: `ketLuan` = "Chưa cưỡng chế", `tinhTrang` = "Không có QĐCC", `bienPhap` rỗng, `loaiNNT` = "Doanh nghiệp, tổ chức". Gỡ cột Kết luận và dòng phụ loại người nộp thuế kéo hàng cao nhất từ 204px xuống 120px và trả đủ bề ngang cho cột tên. Trạng thái không mất: nó nằm ở tiêu đề khối ("Người nộp thuế chưa cưỡng chế") và ở dải tổng hợp phía trên. **Kiểm tra phân bố giá trị trước khi dựng một cột**; cột đẹp mà hằng số vẫn là cột rỗng nghĩa.

**The Long List Gets Pages, Not A Scrollbar Rule.** Cuộn trong khung cao cố định đọc được với vài chục dòng. Với 2.455 dòng thì không: người dùng mất mốc, không quay lại được chỗ cũ, và thanh cuộn nhỏ tới mức kéo một pixel là nhảy mấy chục hàng. Bảng dài chia trang **10 dòng**, chân bảng mang cụm chuyển trang ở mép trái và hành động ở mép phải. Không kèm dòng chú thích kiểu "Bản ghi 41–50 trong 2.455": cụm chuyển trang đã nói vị trí, và dải tổng hợp phía trên đã nói tổng số. Cụm chuyển trang không dựng khi chỉ có một trang — một cụm điều hướng luôn vô hiệu là nhiễu. Đổi bộ lọc thì về trang 1, vì trang 7 của kết quả cũ không còn nghĩa gì.

**Một trang phải VỪA màn hình.** Chia trang mà vẫn phải cuộn trong trang thì chỉ đổi một thanh cuộn dài lấy một thanh cuộn ngắn. 10 hàng × 97px = 974px, không màn laptop nào chứa nổi; cùng 10 hàng ở 58px thì vừa 614px. Khoảng chênh đó đến từ **một dòng phụ không mang tin**: "Doanh nghiệp, tổ chức" lặp y hệt ở cả 2.455 hàng, không phân biệt được hàng nào với hàng nào mà vẫn ăn một dòng mỗi hàng. Gỡ nó đi thì hàng về một dòng, cao đều đúng 58px, và trang vừa khít từ 1600×900 trở lên. Trường đó vẫn nằm trong khối chi tiết, nơi nó nói về đúng một hồ sơ.

**The Row Height Comes From Line Count Rule.** Chiều cao hàng phải đều, và cách giữ nó đều là chặn số DÒNG của mỗi ô — không phải đặt một chiều cao cứng cho hàng, vì chiều cao cứng thì hoặc cắt chữ hoặc chừa chỗ trống.

Khuôn hai dòng `<strong>` + `<small>` mà Nợ (tên + MST), Lô dữ liệu (nguồn + kỳ) và Lượt chạy dùng chính là cơ chế này: MỌI hàng đều hai dòng, nên một tên dài xuống dòng thứ hai cũng không làm hàng cao thêm. Hệ quả: **dòng phụ không bao giờ được dựng có điều kiện**. Bảng báo cáo từng đặt cảnh báo chất lượng làm dòng phụ của tên báo cáo, và vì chỉ ba trên sáu hàng có cảnh báo nên ba hàng cao hơn ba hàng kia — mắt phải căn lại ở mỗi hàng. Cảnh báo chuyển sang cột riêng bên phải, nơi hàng nào cũng có một ô.

Cạm bẫy thứ hai ở cùng chỗ: một dòng phụ **tự xuống dòng** cũng phá nhịp y hệt. Khi cột bị bóp, `TMS 9.4.16.1 – 2.2.7` tách làm hai dòng và ô thành ba dòng, cao hơn phần còn lại 16px. Cột mang dòng phụ vì thế được cấp `min-width` đủ cho chuỗi dài nhất nằm trên một dòng, và phần bị bóp dồn sang cột tên — nơi xuống dòng vô hại vì hàng vốn đã hai dòng.

Cột chứa văn xuôi dài ngắn khác nhau (mô tả, ghi chú tự do) không theo được luật này mà không cắt chữ. Với chúng, hoặc chấp nhận hàng lệch, hoặc để văn xuôi ở khối chi tiết và giữ trong bảng một nhãn ngắn — nhưng không bao giờ cắt bằng `line-clamp`.

**The Mockup Uses Only Fake Data Rule.** Bản mẫu KHÔNG có đường nào dẫn dữ liệu thật lên màn. Chế độ `?du-lieu-that=1` cùng `DuLieuThatContext`, `data/duLieuThat.ts` và nhánh `DebtThat` đã gỡ ngày 06/10/2026.

Lý do là tài liệu, không phải khẩu vị: `design_ql1ql3.md` §1.2 mục 4 ghi "Mọi mockup dùng **dữ liệu giả** (MST 0100000001, 'Công ty A')… **Không dùng file thật của phòng**", mục bảo mật S5 nhắc lại "Mockup chỉ dùng dữ liệu giả", và `design_ql2ql4.md` §1.2 nói rõ vì sao: "file QL4 có họ tên, CCCD, số điện thoại NNT".

Chế độ cũ mặc định tắt và tệp nguồn đã `.gitignore`, nhưng nó vẫn là một công tắc trên chính bản mẫu để mở dữ liệu thật — thứ mà S5 cấm. Một quy tắc có công tắc tắt nó thì không còn là quy tắc. Mọi số trên màn nay sinh từ `data/ngauNhien.ts` với mã số thuế bắt đầu bằng `01000000` và tên "Công ty A".

Hệ quả cho giao diện: mỗi màn đọc được cả hai bộ phải rẽ nhánh ở chỗ **đọc dữ liệu**, không rẽ ở chỗ **dựng giao diện**. Màn Nợ quy cả hai bộ về một khuôn `HangNo` rồi dựng một lần; rẽ ở chỗ dựng thì một màn thành hai màn phải nuôi song song.

**Tên thật dài hơn tên mô phỏng.** Bộ mô phỏng được viết vừa khít cột; bộ thật thì không. Tên đơn vị dài tới 40 ký tự ("Phòng Quản lý, Hỗ trợ doanh nghiệp số 1") nuốt mất bề ngang của cột tên doanh nghiệp và đẩy tên xuống ba dòng. Cách xử lý là **rút gọn khi hiển thị** trong bảng và giữ tên đầy đủ ở khối chi tiết, cộng với tách mã số thuế ra cột riêng để ô tên chỉ còn mang một thứ. Không dùng `line-clamp`. Sau khi làm, ở 1920 và 1600 khoảng 95% hàng cao bằng nhau; từ 1440 xuống thì tên doanh nghiệp dài ngắn khác nhau vẫn làm hàng lệch, và đó là giới hạn đã ghi ở **The Row Height Comes From Line Count Rule**.

### Figure Line
**Dòng tổng hợp là một hàng, không phải bốn thẻ.** Bốn ô "số to, nhãn nhỏ, màu nhấn" xếp ngang là khuôn mẫu mở màn của mọi bản dựng máy sinh; ở đây bốn con số là đếm hàng đợi chứ không phải kết luận, nên chúng đọc như một dòng cộng đặt ngay dưới mô tả trang — vẫn đủ thông tin, không chiếm mất vị trí của việc cần làm. Dòng phụ được giữ lại vì nó mang dữ liệu thật; thứ bị bỏ là cái thẻ, không phải nội dung. Ô bấm được dựng bằng `<button>`, ô chỉ đọc bằng `<div>`, và chỉ ô bấm được mới có hover. Cùng khuôn hình với `KpiStrip`: bốn cột trên desktop, hai cột từ 720px, các ô ngăn nhau bằng `--line-soft` bên trong một khung chung.

### Toast
Nền navy, chữ trắng, bo 10px, cố định góc phải dưới, rộng `min(420px, calc(100vw - 28px))`, bóng lớp phủ, icon xác nhận `--positive-on-chrome`, nút đóng 30px chỉ hiện nền khi hover. Trên mobile nó nhấc lên trên thanh điều hướng đáy bằng `bottom: calc(74px + env(safe-area-inset-bottom))`.

## Do's and Don'ts

### Do:
- **Do** giữ ba vai của đỏ tách bạch: `--seal` nhận diện, `--brand` hành động, `--critical` can thiệp.
- **Do** dùng xanh `--focus` cho vòng focus trên bề mặt sáng và trắng `--focus-on-chrome` trên nền navy. Quy tắc `:where(.sidebar, .mobile-drawer, .login-context) …:focus-visible` phải nằm **sau** quy tắc chung: `:where()` không cộng độ ưu tiên, đặt trước thì shorthand `outline` phía trên ghi đè lại màu.
- **Do** căn mọi thứ trong ô chi tiết về một mép trái, kể cả `<dd>`.
- **Do** để dải thông báo xuống dòng khi cột hẹp thay vì bóp chữ thành mỗi dòng một từ.
- **Do** giữ `<h1>` trong DOM ở dạng `sr-only` trên mỗi màn, đúng thứ tự tiêu đề.
- **Do** dùng chấm, nhãn hoặc icon kèm màu cho mọi tín hiệu trạng thái; màu không bao giờ là tín hiệu duy nhất.
- **Do** đặt sàn 44px cho mọi vùng chạm từ 900px trở xuống.
- **Do** đặt mọi animation sau `prefers-reduced-motion` và giữ công tắc cắt chung.
- **Do** dán nhãn "Mô phỏng" ở mọi màn có số liệu, kể cả màn nằm ngoài Shell.
- **Do** cho mỗi vùng cuộn nhận Tab một cái tên.
- **Do** khai báo cơ sở 0 (`minmax(0, 1fr)` hoặc `min-width: 0`) cho mọi rãnh lưới có thể chứa bảng.
- **Do** để dải hai cột quyết định chiều cao và cho phần dài hơn cuộn trong thân khối của nó.
- **Do** dùng subgrid khi hai khối cạnh nhau phải bắt đầu ở cùng một độ cao.
- **Do** đặt mỗi nút xuất vào đúng khối chứa thứ nó xuất; không để nút nào đứng một mình trên một hàng, và không dựng lại một dải ngang chỉ để có chỗ cho nó.
- **Do** giữ nút mở ngăn điều hướng trên thanh đáy ở MỌI vai, kể cả vai ít màn — mục của phân hệ chỉ nằm trong ngăn đó.
- **Do** ẩn `input[type=file]` gốc và dựng nút tiếng Việt thay nó.
- **Do** đo bộ chữ trong trình duyệt trước khi chọn; "trông đẹp" không thay được phép đo.
- **Do** chuyển con số chỉ tồn tại trong dòng phụ sang một chỗ khác trong thân khối trước khi bỏ dòng phụ.

### Don't:
- **Don't** tô màu trạng thái vào con số. Màu sống ở nhãn, chip và dải thông báo.
- **Don't** thêm màu ngoài palette chung NSNN nếu màu đó không mang vai semantic đã đăng ký.
- **Don't** cho mục điều hướng đang mở một tín hiệu thứ hai. Thanh trắng trên nền navy đã là tương phản mạnh nhất hệ này có.
- **Don't** nâng hoặc đổ bóng một khối chỉ để đọc khi rê chuột; hover chỉ thuộc về thứ bấm được.
- **Don't** dựng lại dòng tổng hợp thành bốn thẻ riêng có viền.
- **Don't** đưa tiêu đề trang hiện lại lên đầu nội dung; sidebar đã nói tên màn.
- **Don't** gọi bộ chữ từ CDN ngoài. Hệ chạy mạng nội bộ; woff2 nằm trong `src/fonts/` và đi qua Vite.
- **Don't** đổi bộ chữ mà không chạy ba phép đo: subset `vietnamese` riêng, `tnum` đều bề rộng, và tổng kilobyte.
- **Don't** thêm bậc chữ mới hay bậc đường kẻ thứ ba để tạo phân cấp.
- **Don't** đặt giãn dòng thứ tư; ba bậc 1.25 / 1.35 / 1.5 là đủ, và mỗi cỡ chữ chỉ dùng một bậc.
- **Don't** phân biệt hai vai bằng 50 đơn vị cân nặng ở cùng cỡ và cùng màu; đó là lệch không nhìn ra.
- **Don't** đổi vị trí điều hướng, bộ lọc hay nút mà người dùng đã quen tay.
- **Don't** đặt trần chiều cao bằng `vh` lên khối danh sách; phân trang đã là trần của nó.
- **Don't** để hai vùng cuộn dọc lồng nhau quanh một bảng; đầu cột sẽ neo nhầm vào cái bên trong và trôi mất.
- **Don't** dùng thanh cuộn làm cách điều hướng một danh sách hàng nghìn dòng; chia trang.
- **Don't** giữ một cột hoặc một dòng phụ có giá trị giống nhau ở mọi hàng; kiểm tra phân bố giá trị trước khi dựng.
- **Don't** nén bảng vào một khung cao cố định khi danh sách đã chia trang; để khung cao theo bảng.
- **Don't** để `table-layout: auto` trên bảng có phân trang; bề rộng cột sẽ đổi theo nội dung từng trang.
- **Don't** khai bề rộng cho MỌI cột; chừa đúng một cột hứng phần dư.
- **Don't** để khối chi tiết quyết định chiều cao dải; bảng là chuẩn, phần dôi của khối chi tiết đi vào thanh cuộn của nó.
- **Don't** đem luật chặn chiều cao của dải xuống dưới 1361px, nơi dải đã xếp thành một cột.
- **Don't** nắn chiều cao đầu khối bằng một con số đoán trước; hàng lưới chung mới là cách làm.
- **Don't** dựng lại một hàng tiêu đề chỉ để có chỗ đặt nút hành động.
- **Don't** đặt kỳ, phạm vi hay chu kỳ vào nhãn nút. Nhãn nói HÀNH ĐỘNG; kỳ là thứ hộp thoại hỏi.
- **Don't** cho cùng một việc hai nút ở hai màn với hai nhãn khác nhau.
- **Don't** dựng thêm một nút nhập tệp thứ hai ở một màn riêng; phân loại tệp nằm trong hộp thoại, không nằm ở việc chọn đúng nút.
- **Don't** để lộ nhãn gốc của `input[type=file]`.
- **Don't** đặt bảng chọn tài khoản mẫu, mật khẩu in sẵn hay ô nhập điền sẵn lên màn đăng nhập.
- **Don't** dựng nút hiện mật khẩu trên một ô còn rỗng.
- **Don't** để cột nhận diện của màn đăng nhập mang tiêu đề, nút hay bất cứ chữ nào của luồng đăng nhập.
- **Don't** vẽ diện mạo riêng cho một nút chỉ vì nó nằm ở màn đăng nhập; dùng lại bậc nút đã có.
- **Don't** dựng một nút tượng trưng mà không nói nó chưa chạy.
- **Don't** đặt dòng phụ lên khối chi tiết để nhắc lại các cột đã hiện trên hàng đang chọn.
- **Don't** gắn nhãn "Nguồn: …" vào chân khối.
- **Don't** mở đầu một màn bằng dải thông báo chung không đổi theo dữ liệu.
- **Don't** dựng dải tổng hợp cho một màn đang bị chặn; bốn ô cùng nói "chưa tính được" không phải là bốn thông tin.
- **Don't** để một màn bị chặn mà không có lối ra.
- **Don't** đổi nhãn hoặc màu của cùng một trạng thái theo vai người xem; chỉ đổi phạm vi.
- **Don't** dựng trạng thái cho một bước diễn ra ngoài hệ thống.
- **Don't** tách các mục báo cáo đọc liền nhau thành nhiều mục điều hướng.
- **Don't** dựng ô chọn khi chỉ có một lựa chọn; hiện giá trị đó dưới dạng chữ, và đếm số giá trị trên dữ liệu thay vì khai cứng.
- **Don't** dựng cột chi tiết đứng cố định; chi tiết mở trong thanh trượt khi được yêu cầu.
- **Don't** để một khối chi tiết tự hiện bản ghi đầu tiên khi người dùng chưa chọn gì.
- **Don't** dựng dòng phụ của ô bảng có điều kiện; hàng có và hàng không sẽ cao khác nhau.
- **Don't** nắn chiều cao hàng bằng một con số cứng hay bằng `line-clamp`; chặn số dòng của ô mới là cách làm.
- **Don't** đưa dữ liệu thật lên màn bằng bất kỳ đường nào, kể cả sau một công tắc mặc định tắt — xem **The Mockup Uses Only Fake Data Rule**.
- **Don't** để hệ trôi về dáng sản phẩm tiêu dùng: không gradient, không minh họa, không góc bo lớn, không màu bão hòa ngoài bảng đã đăng ký.
