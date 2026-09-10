# Bộ tham chiếu cho prototype NSNN giữ nguyên UI

Nguồn: https://dev-nsnn.thehegeo.com/

Ngày khảo sát: 10/09/2026. Trình duyệt Chrome trên Windows. Bộ này phục vụ prompt `../PROMPT-CLAUDE-NSNN.md`; không phải một ứng dụng đã được xây dựng.

## Bắt đầu với Claude Code

Đặt `PROMPT-CLAUDE-NSNN.md` và thư mục `reference-nsnn/` trong cùng workspace, rồi yêu cầu:

> Đọc PROMPT-CLAUDE-NSNN.md và thực hiện toàn bộ yêu cầu. Dùng reference-nsnn/ làm nguồn tham chiếu. Code prototype chạy local trong prototype-nsnn/, giữ nguyên UI của website, không redesign.

Prompt đã được bổ sung sau khi đọc `dac-ta-v2.html` (mới nhất theo người dùng), `update_dac-ta-89_tham-khaor.html`, `phan-tich.md` và cả CSS/markup/JavaScript của `index.html`. Đọc [đối chiếu v2](DOI-CHIEU-DAC-TA-V2.md) và [tài liệu nguồn](documents/dac-ta-v2.html) trước khi code. V2 xác định nghiệp vụ mục tiêu; yêu cầu clone hiện tại vẫn giữ UI web ba tab. Không trộn bốn tab/filter v2 vào clone khi chưa được yêu cầu chuyển phạm vi.

## Nội dung

- 40 trạng thái đã khảo sát/chụp ảnh: [mục lục ảnh](SCREENSHOTS.md), [mục lục JSON](states/index.json).
- 143 URL API có phản hồi đã lưu: [manifest](api/manifest.json). Một endpoint có thể có nhiều bộ query. Tất cả phản hồi lưu trong manifest này có status 200 tại thời điểm khảo sát.
- 13 endpoint được quan sát: [cấu trúc mẫu](api-shapes.json).
- [CSS gốc](assets/index-C1Ij_FY5.css), [bundle gốc](assets/index-BaEmXFk_.js), [bundle được format](assets/app-readable.js).
- [Trích đoạn ứng dụng](app-excerpts.txt): giữ className, copy và logic gốc để dựng lại. Một số trích đoạn cắt ngang hàm; khi cần đối chiếu bản đầy đủ. Tên hàm trong file bị minify, đây không phải source project gốc.
- [126 phường/xã](data/hanoi_126_wards.geojson), [30 quận/huyện cũ](data/hanoi_30_districts_pre_2025.geojson). Đã parse và kiểm tra số feature lần lượt 126/30.
- `documents/`: bản sao nguyên gốc của HTML đặc tả v2, bản cập nhật 8/9, `phan-tich.md`, prototype `index.html`; kèm trích nội dung, JavaScript của prototype và ảnh render để đọc thuận tiện. Các ảnh thực sự có trong `Attachment/` được sao chép vào `documents/attachments/`; các ảnh nguồn còn thiếu được ghi rõ trong đối chiếu, không tự tạo thay thế.

## Phạm vi đã khám phá

- Cả 3 tab; 6 filter chung và kỳ A/B trong Compare.
- Đủ 3 chỉ tiêu, PERIOD/YTD, năm 2024/2025/2026; lọc tháng trong quý, đổi quý, qua ranh giới tháng 6/7 năm 2025.
- Địa bàn toàn thành phố, phường và quận/huyện lịch sử; bản đồ hiện tại/lịch sử/mixed; chọn phường, zoom và reset zoom.
- Chart zoom modal, modal xu hướng một địa bàn, các mode xếp hạng, mở rộng/thu gọn, cơ cấu cấp ngân sách/sắc thuế.
- Compare draft/commit, so sánh tháng/quý/năm, hai kỳ cùng năm, thiếu số liệu, reload và refresh.
- URL sai, cảnh báo và đóng cảnh báo.
- Desktop 1440×1000, tablet 1024×900, mobile 390×844. Ảnh `31` và `32` chụp viewport sau mở rộng; phần text JSON lưu cả nội dung mở rộng.

## Giới hạn cần hiểu đúng

- Đã đi qua các nhánh chức năng chính và đọc logic ứng dụng công khai; chưa click mọi tổ hợp của toàn bộ 126 phường × năm × quý × tháng × chỉ tiêu.
- Fixture là phản hồi của các request đã khảo sát, không phải dữ liệu offline đầy đủ cho mọi lựa chọn. Muốn các tổ hợp khác hoạt động cần proxy API gốc hoặc bổ sung fixture đúng query.
- Không đối chiếu tính đúng nghiệp vụ của số tiền. Các bất nhất đang có trên web cần được giữ nguyên khi clone, theo yêu cầu người dùng.
- Loading/error được mô tả từ implementation; không tạo sự cố hoặc sửa dữ liệu trên hệ thống gốc để kích hoạt tất cả nhánh lỗi.
- Ảnh chụp có thể chứa tooltip và animation tại thời điểm chụp. CSS/DOM, logic và payload là nguồn bổ trợ để phân biệt trạng thái chuyển tiếp với layout cuối cùng. So sánh ảnh khi code nên chờ chart animation kết thúc.
- Các bản ghi bằng 0 có thể đổi thứ tự giữa các response do nguồn không đảm bảo tie-break; khi kiểm chứng pixel, dùng một fixture cố định.

## Bản đồ hàm để tra cứu nhanh

| Hàm trong bundle | Nội dung |
|---|---|
| `Bf` | Phân loại historical/current/mixed theo thời gian |
| `jz`, `Nz`, `Mz` | Parse URL, serialize URL, filter state và chuyển trạng thái |
| `j6` | Thanh bộ lọc |
| `M6`, `I6` | Cảnh báo URL và độ phủ địa bàn |
| `Ut`, `aR`, `Go`, `x1` | Card, KPI, thanh giá trị, số dòng Top theo viewport |
| `Uie` | Layout Overview |
| `Tie`, `D6`, `L6`, `uR` | Layout Detail, xếp hạng và chi tiết địa bàn |
| `$A`, `C6`, `T6` | Bản đồ, tooltip, chọn vùng, zoom/reset |
| `Sw`, `Eie`, `a_` | Xu hướng tháng và modal phóng to |
| `lL`, `Oie` | Theo cấp ngân sách/donut và điều kiện empty |
| `Iie`, `Nie`, `jie` | Cơ cấu thu và waterfall |
| `zie`, `Fie`, `Lie` | Xếp hạng theo tháng và modal sparkline |
| `Bie`, `eM`, `tM` | So sánh cơ cấu địa bàn, xem thêm/thu gọn |
| `qie` | Đính chính |
| `soe`, `hM`, `kz` | Compare và chọn kỳ/draft/default |
| `Xie`, `rM`, `eoe` | KPI, bar chart và xu hướng Compare |
| `coe` | App shell và tabs |

Giữ nguyên file `index.html` đang có trong workspace. Đọc file đó để hiểu prototype mô phỏng và cascade/drill-down, nhưng không dùng số liệu, mã địa bàn hoặc font/style của nó làm nguồn chuẩn cho clone website. File đó không phải entry của bản tham chiếu web.
