# Tax Ops — Design system v1

Bộ design system trích từ prototype `tax-ops`, dành cho file Figma:
https://www.figma.com/design/zwUeggCjneSdx9Hl61teer/Untitled

**Trạng thái:** đã chuẩn bị tokens, plugin import và bản xem trước. Chưa ghi vào Figma: kết nối MCP báo hết lượt của gói Starter trong bước khám phá. Plugin chưa được chạy trong Figma; kiểm tra canvas và Code Connect còn chờ kết nối/import. Không có thay đổi nào được gửi vào file Figma ở lượt này.

## Mở bản xem trước

Mở `preview.html` bằng trình duyệt. File đã nhúng font Public Sans, CSS và icon; không cần máy chủ hoặc kết nối mạng.

## Import vào file Figma

1. Mở file đích bằng **Figma Desktop**.
2. Chọn **Plugins → Development → Import plugin from manifest…** và chọn `figma-plugin/manifest.json` trong thư mục này.
3. Chạy **Tax Ops — Design System** trong file đích.
4. Plugin tạo **một trang riêng** tên `Tax Ops — Design System v1`, gồm sáu khu vực: Hướng dẫn, Foundations, Icons, Controls, Data và Feedback. Các màn và component hiện có được giữ nguyên.
5. Mở Assets → Local components → Tax Ops để dùng instance. Khi import xong, chọn **Lưu báo cáo import** để lưu ID, token và mapping nguồn.

Plugin dùng Public Sans variable và kiểm tra font trước khi thay đổi file. Nếu font/trục `wght` chưa có, plugin dừng với thông báo cụ thể. Không tự thay font khác hoặc làm tròn weight 650. Plugin không gọi mạng.

Plugin dừng nếu phát hiện trang/collection Tax Ops đã tồn tại, tránh tạo trùng và ghi đè. Nếu import lỗi sau khi bắt đầu, dùng **Undo** để hoàn tác lần import trước khi chạy lại. Plugin không xóa các phần tử cũ để thử lại.

## Phạm vi

| Nhóm | Nội dung |
| --- | --- |
| Foundations | 38 màu semantic lấy trực tiếp từ CSS; alias tới màu primitive; spacing; radius; kích thước control; 11 text styles; 3 effect styles |
| Icons | 20 SVG gốc từ `Icon` trong `src/components/ui.tsx` |
| Button | Primary / Secondary / Quiet × Default / Hover / Focus / Disabled; hai bộ Desktop 32px và Touch 44px; Label, Show icon, Icon swap |
| Field | Text / Search / Select; Default / Focus / Disabled; Text có Error; label và value chỉnh sửa được |
| Navigation | Default / Hover / Selected, trên nền chrome |
| Segmented | Default / Hover / Selected; mobile dùng select trong code |
| Data | 5 tone Badge; Table Cell và Row; Panel; Figure; FigureLine; Pager |
| Feedback | 4 tone Notice; Toast; EmptyState; Dialog |

Các main component nằm bên phải khung mẫu trong từng khu vực. Khung mẫu dùng instance để thay đổi component được phản ánh tự động. Các component dùng auto layout, text styles và variable bindings; tên component có tiền tố `Tax Ops /`.

## Nguồn chuẩn và khác biệt đã phát hiện

- Nguồn chuẩn là **CSS hiện tại** và các component React trong `tax-ops/src`, theo yêu cầu dựa trên prototype tax-ops.
- Figma cũ có Button dùng Inter 16px, màu nâu, cao 36–38px; prototype hiện tại dùng Public Sans 13px, đỏ `#9a1c2a`, cao 32px. Bộ mới tách riêng để không thay đổi những màn người dùng đã dựng.
- `DESIGN.md` có front matter còn ghi system font và badge có nền chung, trong khi code hiện tại dùng Public Sans và chỉ badge critical có nền. Bộ này theo code.
- Sidecar `.impeccable/design.json` đã cũ so với `DESIGN.md`; không được dùng để sinh token và không được sửa trong tác vụ này.
- Không thêm dark theme, component nghiệp vụ mới, hay luồng phê duyệt không tồn tại trong prototype.

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
