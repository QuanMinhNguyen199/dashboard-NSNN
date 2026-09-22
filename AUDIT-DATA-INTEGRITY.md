# Rà soát tính đúng đắn dữ liệu — prototype NSNN/TMS

Ngày rà soát: 22/09/2026. Mọi con số dưới đây **đo bằng cách chạy chính mã domain**,
không đọc bằng mắt; cổng kiểm `npm run check:data` chạy lại toàn bộ phép đo này.

---

## 1. Kiểm kê danh mục

| Danh mục | Số lượng | Nguồn | Nơi dùng trên UI | Trạng thái |
|---|---|---|---|---|
| Chương | **104** | `tms-catalog.json` (rút từ đặc tả kỹ thuật nội bộ) | Mã hạch toán; chiều cấp quản lý | Thật |
| Mục | **37** | như trên | Mã hạch toán; nhãn danh mục tra cứu | Thật |
| Tiểu mục | **180** | như trên | Mã hạch toán; nhãn danh mục tra cứu | Thật |
| Phường/xã hiện hành | **126** | `tms-joins.json` | Bộ lọc địa bàn, Chi tiết phường/xã, Dự toán | Thật |
| Phạm vi cấp thành phố | 1 dòng (`10100000`) | chứng từ TMS 07/2025 | Chiều địa bàn của Báo cáo | Thật, **không phải** phường/xã |
| Mã nguồn cơ quan thuế | **33** | `tms-joins.json` (32) + danh mục bổ sung (`9801`) | nội bộ, giữ để đối chiếu ngược | Thật |
| Cơ quan thuế (thực thể) | **28** | suy từ 33 mã, gộp theo tên | Bộ lọc CQT, chiều CQT, Phân tích TMS | Thật |
| ├ Thuế cơ sở | **25** | danh mục, đánh số đủ 1–25 | | Thật |
| └ Đơn vị khác | **3** | Thuế TP Hà Nội, CCT Doanh nghiệp lớn `9901`, CCT Thương mại điện tử `9801` | | Thật |
| Dòng chỉ tiêu báo cáo | **113** | `report-tree.json`, `tms-indicators.json` | Tab Báo cáo, xuất Excel theo mẫu ngành | Thật |
| Nhóm ngành nghề | **13** | `report.ts` | Chiều ngành nghề | Thật |
| Mã tham chiếu trong điều kiện | **293** | `ITEM_RULES` | Mã hạch toán, ô "Mã trong điều kiện" | Thật (mã), **cần xác minh** (phân loại) |

Số tiền, số giao dịch, chuỗi thời gian và so sánh cùng kỳ là **mô phỏng tất định**,
có nhãn trên màn hình. Không mã, tên, danh sách hay quan hệ nào được mô phỏng.

---

## 2. Lỗi đã sửa — Trước → Sau

| # | Chỗ | Trước | Sau |
|---|---|---|---|
| 1 | Ô KPI tab Mã hạch toán | `42 Mục · 293 Tiểu mục` | `293 mã` · chú thích `174 đối chiếu được danh mục · 119 cần xác minh` |
| 2 | Dòng Mục trong bảng | `14 Tiểu mục` | `14 mã` |
| 3 | Thẻ "Mục và Tiểu mục" | không nói quy mô danh mục | `danh mục tra cứu: 37 Mục, 180 Tiểu mục` |
| 4 | Nhóm gộp của biểu đồ thác | `Khác (28 mục)` | `Khác (28 khoản)` |
| 5 | Danh mục CQT | 32 mã → 27 thực thể, thiếu `9801` | 33 mã → 28 thực thể |
| 6 | Đếm dòng danh bạ theo CQT | tra một mã, 5 cơ quan hai mã mất nửa số dòng | cộng theo đủ mã nguồn của thực thể |
| 7 | "Địa bàn phụ trách" của đơn vị không theo địa bàn | `Mã này không thuộc danh sách 25 Thuế cơ sở` | `CCT Thương mại điện tử quản lý theo đối tượng, không có phạm vi phường/xã cố định.` |
| 8 | Comment mô tả số lượng cũ | `32 mã`, `27 cơ quan` | `33 mã`, `28 cơ quan`, tách rõ 25 cơ sở + 3 đơn vị khác |

Lỗi 1–3 là lỗi **gọi tên**: 293 mã tham chiếu bị gọi là "Tiểu mục", dựng ra một danh
mục lớn gấp rưỡi danh mục thật. Phần chưa đối chiếu được có thể là cận khoảng, mã loại
trừ hoặc mã chưa vào danh mục hiện hành — chưa xác minh thì chưa được gọi tên.

---

## 3. Bất biến tổng hợp — đã đo, lệch bằng 0

| Bất biến | Kết quả |
|---|---|
| NSTW + NSĐP = Tổng NSNN (kỳ 3 và kỳ 8) | lệch **0** |
| Mỗi Mục = tổng Tiểu mục của nó (42 Mục) | **0** Mục lệch |
| Tổng các Mục = tổng của cấp quản lý | lệch **0** |
| Tỷ trọng cộng lại, ba chiều | **100,0000%** |
| Tổng các nhóm = tổng chung, ba chiều | lệch **0** |
| Gộp mã CQT giữ nguyên tổng tiền (2 kỳ chứng từ) | lệch **0** |

Xuất Excel lấy toàn bộ trang cột chứ không lấy trang đang nhìn, nên phân trang không
làm mất dữ liệu. Danh mục nền không đổi theo bộ lọc: mọi tab, bộ lọc và bản xuất đều
đọc từ cùng một nguồn trong `src/domain`.

---

## 4. Cần xác minh — chưa đưa thành số chính thức

**4.1. Phân loại 119 mã tham chiếu chưa có dòng tên.**
Điều kiện báo cáo nhắc tới 293 mã; 174 mã có dòng tên trong danh mục 180 Tiểu mục,
119 mã không có. Prototype gọi chúng là "mã", không gọi là "Tiểu mục", và ô KPI nói
rõ bao nhiêu mã cần xác minh. Cần danh mục Tiểu mục cập nhật hoặc xác nhận rằng các
mã này là cận khoảng/mã loại trừ.

**4.2. Bảy khoá nhóm Mục không có trong danh mục 37 Mục.**
Ở cấp "tất cả", bảng hiện 42 nhóm, trong đó 35 khoá trùng một Mục có thật, còn 7 khoá
(`1300`, `3300`, `3650`, `3750`, `3800`, `3950`, `4050`) là nhóm suy ra từ dải mã cho
những mã chưa có Mục cha trong danh mục. Bảng gắn nhãn `Chưa có tên trong danh mục`
cho các nhóm này. Cần xác nhận Mục cha thật của chúng.

**4.3. Chín giá trị địa bàn trên chứng từ nằm ngoài danh mục 126.**
Trên hai kỳ chứng từ có 136 giá trị địa bàn; 126 khớp danh mục, 1 là phạm vi cấp
thành phố, 9 còn lại (`275HH`, `272HH`, `9727`, `9733`, `9742`, `9745`, `9772`,
`9775`, `1015730`) chưa tra được. Chúng không lọt vào bảng nào: danh sách phường/xã
của một cơ quan lấy từ bảng phân công, không lấy từ chứng từ.

**4.4. Mã `9801` chưa có cột hiệu lực theo thời gian.**
Tên đã xác nhận là CCT Thương mại điện tử và đã vào danh mục chuẩn. Phạm vi và mốc
hiệu lực thì chưa.

**4.5. QLHT.** Chưa có mã định danh được xác nhận nên **không** được đưa vào danh mục
cơ quan thuế.

---

## 5. Xung đột giữa các nguồn

**5.1. Số mã đối chiếu được: 174 hay 77.**
Yêu cầu rà soát nêu "77 mã khớp danh mục / 216 mã tham chiếu chưa có tên / tổng 293".
Đo trên chính mã domain cho ra **174 khớp / 119 chưa có tên / tổng 293**. Tổng 293
khớp nhau, phần chia thì không. Prototype dùng số đo được, vì nó suy trực tiếp từ
`ITEM_RULES` và danh mục 180 Tiểu mục, và cổng kiểm khoá cả ba con số lại. Cần phía
nghiệp vụ xác nhận cách đếm nào là đúng trước khi đổi.

**5.2. Kho bạc và TMS.**
Vế Kho bạc để trống (`null`), không để 0 và không để bằng vế TMS. Hiện chỉ có một kho
quan sát; nếu lấy cả hai vế từ đó thì chênh lệch luôn bằng 0, và một chênh lệch bằng 0
đọc thành "đã đối soát, khớp" trong khi chưa có phép đối soát nào diễn ra. Prototype
**không** cộng Kho bạc và TMS thành hai nguồn thu độc lập.

---

## 6. Cổng kiểm

`npm run check:data` — chạy trong `npm run build` nên không bỏ qua được.

Phủ: danh mục CQT (33 mã → 28 thực thể, 25 cơ sở + 3 đơn vị khác, năm cặp mã gộp
đúng, `9801`/`9901` trả đúng tên, "Chưa xác định" không nằm trong danh mục, chỉ 25 cơ
sở có phường/xã, danh mục gốc không bị sửa, hợp nhất không sinh bản ghi trùng);
mục lục ngân sách (104/37/180, mã không trùng, Tiểu mục trỏ đúng Mục, 293/174/119);
địa bàn (126 hiện hành, phạm vi thành phố tách riêng); cây chỉ tiêu (113 dòng, khác
số Tiểu mục); chiều báo cáo (đọc từ danh mục chung, "Chưa xác định" chỉ thêm ở lưới);
và sáu bất biến tổng hợp ở mục 3.

Các cổng khác: `check:tokens`, `check:docs`, `acceptance.mjs`, `check-workspaces.mjs`.
