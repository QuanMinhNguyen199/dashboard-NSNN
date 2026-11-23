# Tax Ops — Design system v1.1

Bộ design system trích từ prototype `tax-ops`, dành cho file Figma:
https://www.figma.com/design/zwUeggCjneSdx9Hl61teer/Untitled

**Cập nhật 23/11/2026 (v1.1):** khớp prototype sau đợt rà layout và typography 20/11/2026 — thang chữ chín bậc (bằng rem trong code, gốc 16px), ba giãn dòng 1.25/1.35/1.5, bỏ bo góc 12px và măng sét, thêm hàng Total và Toggletip ⓘ. Chi tiết ở mục "Thay đổi v1.1".

**Trạng thái:** đã chuẩn bị tokens, plugin import và bản xem trước. Chưa ghi vào Figma: kết nối MCP báo hết lượt của gói Starter trong bước khám phá. Plugin chưa được chạy trong Figma; kiểm tra canvas và Code Connect còn chờ kết nối/import. Không có thay đổi nào được gửi vào file Figma ở lượt này.

## Mở bản xem trước

Mở `preview.html` bằng trình duyệt. File đã nhúng font Public Sans, CSS và icon; không cần máy chủ hoặc kết nối mạng.

## Import vào file Figma

1. Mở file đích bằng **Figma Desktop**.
2. Chọn **Plugins → Development → Import plugin from manifest…** và chọn `figma-plugin/manifest.json` trong thư mục này.
3. Chạy **Tax Ops — Design System** trong file đích.
4. Plugin tạo **một trang riêng** tên `Tax Ops — Design System v1.1`, gồm sáu khu vực: Hướng dẫn, Foundations, Icons, Controls, Data và Feedback. Các màn và component hiện có được giữ nguyên.
5. Mở Assets → Local components → Tax Ops để dùng instance. Khi import xong, chọn **Lưu báo cáo import** để lưu ID, token và mapping nguồn.

Plugin dùng Public Sans variable và kiểm tra font trước khi thay đổi file. Nếu font/trục `wght` chưa có, plugin dừng với thông báo cụ thể. Không tự thay font khác hoặc làm tròn weight 650. Plugin không gọi mạng.

Nếu file đã có thư viện Tax Ops (bất kỳ phiên bản nào), plugin tự xử lý rồi dựng bản mới, không cần làm tay. Thư viện cũ **đang được dùng** (có instance ở trang khác trỏ vào component của nó) thì được **lưu trữ**: đổi tên trang, component, collection, text/effect style sang `Tax Ops vX (lưu trữ) / …`, instance giữ nguyên main component, thay dần bằng component mới bằng instance swap. Từ 23/11/2026 plugin **không bao giờ xóa**: kể cả khi không thấy instance nào dùng, thư viện cũ vẫn chỉ được lưu trữ; trang "Tax Ops — Màn chi tiết…" cũ được đổi tên thành "Tax Ops (cũ <giờ>) — …". Người dùng tự xóa khi chắc chắn. Không đụng tới trang, style hay collection khác, kể cả trang đã lưu trữ từ lần trước. Bước này chỉ chạy sau khi kiểm font đạt. Cả lần chạy là một bước Undo (Ctrl/Cmd+Z). Lần chạy đầu trên file thật (23/11/2026) có 2.174 instance dùng v1 — lý do không được xóa thẳng.

## Màn chi tiết · Đối chiếu nghĩa vụ

Plugin dựng thêm trang **"Tax Ops — Màn chi tiết · Đối chiếu nghĩa vụ"**: hồ sơ NNT mở từ tab Đối chiếu nghĩa vụ, hai khung 1440px (ngăn rộng 1240px) và 390px. Đây là **layer sửa được** (hình, chữ Public Sans, icon SVG), không phải ảnh chụp. Màu trùng token gắn variable của thư viện; cỡ chữ trùng thang gắn text style. Đoạn chữ nhiều dòng được tách theo đúng chỗ trình duyệt ngắt, mỗi dòng một layer. Số liệu là dữ liệu mô phỏng.

Các khối lặp là **component**: 16 bộ "Màn / Hồ sơ NNT / …" (chỉ báo, ô thông tin, tiêu đề khối, đầu cột, hàng bảng, hàng tổng, số tổng, dòng cần soi, ký hiệu giao dịch, nút xử lý dòng, nút hành động, bộ chọn bước, thu gọn, nút ⓘ, quay lại, không phát sinh) xếp thành cột bên phải hai khung. Trong khung, mỗi khối là instance; chữ, kiểu chữ và màu là ghi đè, ký hiệu giao dịch lồng trong dòng cần soi là instance lồng (đổi mẫu bằng instance swap). Chỗ dùng cùng tên, cùng biến thể (`is-ok`, `is-vang`, bảng ngân sách / qua các năm…) và cùng kích thước dùng chung một component; lớp lệch tối đa 2px được ghép vào cùng khe, chỗ nào thiếu một lớp thì lớp đó ẩn trong instance. Khác kích thước (khổ 390 so với 1440, ô chiếm hai cột, dòng xuống hàng) thành biến thể "Mẫu n" của cùng bộ. Bố cục bên trong component vẫn là định vị tuyệt đối với constraint (chữ căn phải giữ mép phải, nền kín ngang co giãn theo), chưa phải auto layout. Phần ngoài khối lặp (khung ngăn, tiêu đề ngăn, các đường kẻ) vẫn là lớp rời.

Mỗi lần chạy, plugin thay trang màn cũ bằng bản mới. Khi giao diện đổi, chụp lại rồi build:

```
node tax-ops/design-system/capture-screen.mjs   # cần dev server ở cổng 5174
node tax-ops/design-system/build.mjs
```

Dữ liệu chụp nằm ở `screens/doi-chieu-chi-tiet.json` và được nhúng vào `figma-plugin/code.js`. Báo cáo sau khi chạy có thêm các mục kiểm tra trang màn, số khung và số chữ dựng được so với số đã chụp.

## Báo cáo sau khi chạy

Mỗi lần chạy, kể cả khi plugin dừng ở bước kiểm tra trước hoặc lỗi giữa chừng, sẽ mở bảng **Báo cáo import**:

1. Bấm **Chép báo cáo**. Nếu Figma chặn chép tự động, bôi đen ô báo cáo rồi Ctrl/Cmd+C.
2. Dán nguyên văn vào cuộc trò chuyện để kiểm tra. Báo cáo là chữ thuần, bắt đầu bằng `=== TAX OPS · BÁO CÁO IMPORT FIGMA ===` và kết thúc bằng `=== HẾT BÁO CÁO ===`.
3. **Tải JSON** lưu bản đầy đủ (ID variables, styles, components, nhật ký) để đăng ký Code Connect sau này.

Báo cáo gồm:

- **Kết quả:** THÀNH CÔNG, CẦN KIỂM TRA (đã dựng nhưng có mục không đạt) hoặc THẤT BẠI (kèm giai đoạn dừng).
- **Môi trường:** phiên bản plugin, thời điểm build, fileKey, phiên bản Figma API, tình trạng font Public Sans và trục `wght`.
- **Kiểm tra trước:** có Public Sans, có trục `wght`. Sau đó là bước **Dọn thư viện cũ**: liệt kê trang, collection, style đã lưu trữ và số instance ngoài trang đang dùng bản cũ.
- **Kiểm tra sau khi dựng (dự kiến / thực tế):** số màu semantic, số text style, số icon, đủ 18 component, không trùng variant, không component kích thước 0, hàng Total có vạch dưới 2px, ⓘ dựng được từ SVG, mọi text dùng text style, không text thiếu font.
- **Giai đoạn:** thời gian và số node tạo ở Foundations, Icons, Controls, Data, Feedback, Hướng dẫn.
- **Nhật ký** theo giây, và lỗi kèm vài dòng stack nếu có. Nếu lỗi xảy ra sau khi đã tạo node, báo cáo nhắc dùng Undo trước khi chạy lại.

Plugin không kiểm được glyph tiếng Việt; báo cáo chỉ đếm số text có dấu để nhắc xem bằng mắt.

## Phạm vi

| Nhóm | Nội dung |
| --- | --- |
| Foundations | 67 màu và semantic tokens lấy trực tiếp từ CSS; alias tới màu primitive; spacing; radius 10/6/4 + hairline 2 cho thanh dữ liệu; kích thước control, thanh bên 252px, ngăn trượt 600/760px; 14 text styles; 3 effect styles |
| Icons | 40 SVG gốc từ `Icon` trong `src/components/ui.tsx` |
| Button | Primary / Secondary / Quiet × Default / Hover / Focus / Disabled; hai bộ Desktop 32px và Touch 44px; Label, Show icon, Icon swap |
| Field | Text / Search / Select; Default / Focus / Disabled; Text có Error; label và value chỉnh sửa được |
| Navigation | Default / Hover / Selected, trên nền chrome |
| Segmented | Default / Hover / Selected; mobile dùng select trong code |
| Data | 5 tone Badge; Table Cell; Table Row (Total / Default / Hover / Selected — Total ghim đầu, không nền); Panel; Figure; FigureLine; Pager |
| Feedback | 4 tone Notice; Toggletip ⓘ (nút + hộp); Toast; EmptyState; Dialog (bo 10px) |

Các main component nằm bên phải khung mẫu trong từng khu vực. Khung mẫu dùng instance để thay đổi component được phản ánh tự động. Các component dùng auto layout, text styles và variable bindings; tên component có tiền tố `Tax Ops /`.

## Nguồn chuẩn và khác biệt đã phát hiện

- Nguồn chuẩn là **CSS hiện tại** và các component React trong `tax-ops/src`, theo yêu cầu dựa trên prototype tax-ops.
- Figma cũ có Button dùng Inter 16px, màu nâu, cao 36–38px; prototype hiện tại dùng Public Sans 13px, xanh NSNN `#1657a8`, cao 32px. Bộ mới tách riêng để không thay đổi những màn người dùng đã dựng.
- Front matter typography của `DESIGN.md` đã đồng bộ với code ngày 20/11/2026 (rem, chín bậc, ba giãn dòng); bộ này lấy cùng thang.
- Sidecar `.impeccable/design.json` đã cũ so với `DESIGN.md`; không được dùng để sinh token và không được sửa trong tác vụ này.
- Không thêm dark theme, component nghiệp vụ mới, hay luồng phê duyệt không tồn tại trong prototype.

## Thay đổi v1.1 (23/11/2026)

| Phần | v1 (01/10) | v1.1 |
| --- | --- | --- |
| Text styles | 11; giãn dòng px rời (16.8, 19.5…) | 14: thêm **Figure** 24/700, **Subhead** 16/650, **Nav group** 10.5/700; giãn dòng theo hệ số 1.25 / 1.35 / 1.5; mỗi style ghi cỡ rem tương ứng |
| Weight | 650 ở nhiều cỡ | 650 chỉ từ 16px trở lên; 13–14px dùng 400 / 600 / 700 |
| Radius | panel 10, control 6, chip 4, hairline 2, dialog 12 | bỏ dialog 12 — Dialog dùng panel 10 |
| Size | có topbar 60 | bỏ topbar (không còn măng sét); thêm drawer 600, drawer-wide 760 |
| Table Row | Default / Hover / Selected | thêm **Total**: ghim đầu bảng, chữ 700, vạch 2px ink-3, không nền |
| Feedback | — | thêm **Toggletip** và **Toggletip/Trigger** theo `GoiYCachTinh.tsx` |
| Icons | 21 | 40 |

Từ 23/11/2026 plugin tự lưu trữ thư viện cũ, kể cả v1, trước khi dựng, không xóa gì. Báo cáo sau khi chạy ghi rõ đã lưu trữ những gì.

## Mapping sang code

`tokens.json` chứa `sourceMappings`; description của component trong Figma cũng ghi nguồn. `tokens.css` xuất lại các biến đang có và thêm tên biến cho giá trị spacing/dimension vốn đang viết trực tiếp trong CSS. File này **chưa được import vào ứng dụng**, nên không thay đổi giao diện hoặc behavior hiện có.

Đây là mapping tài liệu, **chưa phải Code Connect đã đăng ký**. Khi có kết nối Figma, có thể dùng ID trong báo cáo import để đăng ký Code Connect cho các component React tương ứng. Chưa publish library.

## Kiểm tra

- `node tax-ops/design-system/build.mjs`: tạo lại assets từ source CSS/icon và template.
- Plugin đã qua kiểm tra kiểu với [Figma Plugin API typings chính thức](https://github.com/figma/plugin-typings/blob/master/plugin-api.d.ts); kiểm tra này không thay thế chạy plugin trong Figma.
- `node --check tax-ops/design-system/figma-plugin/code.js`: kiểm tra cú pháp plugin.
- `node tax-ops/design-system/check-preview.mjs`: dùng Chrome kiểm tra preview desktop 1440px và mobile 390px, font, số màu, tràn trang, nút mẫu và lỗi JavaScript; xuất ảnh và `validation.json`.
- Sau import, plugin kiểm tra scope/code syntax của variables, kích thước component và trùng tên variant. Cần kiểm tra trực quan trong Figma trước khi publish: dấu tiếng Việt, trạng thái, nội dung dài, bảng và instance swap.

Preview trình duyệt là tài liệu lấy từ CSS thật; ảnh preview không chứng minh plugin đã chạy hoặc canvas Figma đã được kiểm tra. Interaction trong preview chỉ là minh họa, không tạo báo cáo thật.
