# Báo cáo Prototype — Dashboard Thu NSNN Hà Nội

| | |
|---|---|
| **Trạng thái** | Prototype hoàn chỉnh bốn workspace, chạy được, chờ nối API thật |
| **Bản chạy thử** | <https://quanminhnguyen199.github.io/dashboard-NSNN/> |
| **Ngày báo cáo** | 14/09/2026 |
| **Dữ liệu** | ⚠ **Toàn bộ là số mô phỏng phục vụ prototype — không phải số quyết toán** |
| **Tài liệu nền** | `BA-NSNN.md` (nghiệp vụ), `THIET-KE-DASHBOARD-NSNN.md` (thiết kế v1.1) |

---

## 1. Tóm tắt

Prototype đã dựng xong toàn bộ luồng sử dụng của dashboard Thu ngân sách nhà nước cho
126 phường, xã của Hà Nội: bốn khu vực phân tích, bộ lọc chung giữ nguyên khi chuyển tab,
và đường đi liền mạch từ một con số tổng quan xuống tới nguyên nhân tạo ra nó.

Điểm cần lưu ý khi duyệt: **phần giao diện và nghiệp vụ đã đầy đủ, phần số liệu thì chưa.**
Ứng dụng đang chạy trên dữ liệu mô phỏng do chưa có API. Mọi công thức, quy tắc và luồng
điều hướng đều đã triển khai và kiểm chứng tự động; khi backend sẵn sàng, việc nối vào là
thay một điểm kết nối duy nhất chứ không phải làm lại.

**Đề nghị:** duyệt prototype về mặt nghiệp vụ và giao diện, đồng thời chốt 8 giả định
nghiệp vụ ở mục 7 để đội phát triển hoàn thiện công thức trước khi nối số liệu thật.

---

## 2. Prototype trả lời được câu hỏi gì

Đây là thước đo thực chất của sản phẩm — không phải số lượng biểu đồ.

| Câu hỏi người dùng đặt ra | Trả lời ở đâu |
|---|---|
| Kỳ này thu được bao nhiêu, hơn kém cùng kỳ ra sao? | KPI Tổng quan |
| Đã đạt bao nhiêu phần trăm dự toán? | KPI Tổng quan *(số dự toán còn mô phỏng — xem mục 4)* |
| Tiền đến từ đâu? | Cơ cấu 4 nguồn thu + drawer xem nhanh |
| Trong 21 khoản nội địa, khoản nào chi phối? | Top khoản thu → Phân tích thu |
| Bao nhiêu thuộc NSTW, bao nhiêu thuộc NSĐP, NSĐP nằm ở cấp nào? | Thẻ "Theo cấp ngân sách" — biểu đồ tròn, chọn lát để xem phân rã |
| Vì sao kỳ này chênh so cùng kỳ? | Biểu đồ waterfall biến động |
| Phường, xã nào đóng góp nhiều, nơi nào đang hụt? | Top địa bàn (cao/thấp) + Tăng trưởng địa bàn |
| Phân bố theo không gian thế nào? | Bản đồ nhiệt 126 phường, xã |
| Một địa bàn cụ thể hoạt động ra sao? | Tab Chi tiết phường/xã |
| Hai kỳ / hai nguồn / hai địa bàn khác nhau chỗ nào? | Tab So sánh nâng cao |
| Dữ liệu đã đủ chưa, có gì bất thường? | Ô "Cần chú ý" trong dải KPI |

---

## 3. Phạm vi đã triển khai

### Bốn khu vực phân tích

| Tab | Nội dung |
|---|---|
| **Tổng quan** | KPI, xu hướng 12 tháng so năm trước, cơ cấu 4 nguồn thu, top khoản thu nội địa, top địa bàn, tăng trưởng địa bàn, cơ cấu NSTW/NSĐP, waterfall biến động |
| **Phân tích thu** | Ba nhóm: nội địa / xuất nhập khẩu / khác. Thu nội địa có biểu đồ **3 nhóm lớn** (sản xuất kinh doanh · nhà đất · phí lệ phí và khoản khác), chọn một nhóm để xem các khoản cấu thành. Bảng đủ 21 khoản có tìm kiếm và sắp xếp. Thu XNK tách rõ tổng gộp, hoàn/khấu trừ và thu ròng |
| **Chi tiết phường/xã** | Danh sách có tìm kiếm tiếng Việt + bản đồ nhiệt dùng chung một lựa chọn. KPI, xu hướng, cơ cấu nguồn thu, top khoản thu của địa bàn |
| **So sánh nâng cao** | Ba chế độ: theo kỳ, theo nguồn thu, theo địa bàn. Có KPI hai vế, chênh lệch, waterfall và bảng chi tiết |

### Những điểm đã xử lý theo góp ý review

Toàn bộ 7 mục trong bản review giao diện v1 đã triển khai: đổi tên thành
"Thu nội địa không kể dầu thô", thay ô độ phủ địa bàn bằng tiến độ dự toán, vẽ cơ cấu
NSTW/NSĐP thành biểu đồ tròn có phân rã, bổ sung biểu đồ 3 nhóm thu nội địa với thao tác
chọn nhóm để xem chi tiết, và bỏ ô "Số khoản trong nhóm".

### Hỗ trợ nhiều môi trường

Dashboard dùng được trên Web desktop, Web màn hình hẹp, khung nhúng iframe (cạnh trợ lý
ảo) và WebView của ứng dụng Mobile. Ở khổ hẹp, bộ lọc thu về hai nhóm `Kỳ báo cáo` và
`Chỉ tiêu` để không đẩy số liệu chính xuống dưới. Có sẵn công cụ xem thử iframe và 11 mẫu
điện thoại iOS/Android ngay trên header.

---

## 4. Số liệu: cái gì thật, cái gì mô phỏng

Đây là mục quan trọng nhất khi duyệt. Rủi ro lớn nhất của một prototype là số mô phỏng bị
trích nhầm vào báo cáo thật.

| Thành phần | Tình trạng |
|---|---|
| Danh mục 126 phường, xã | **Thật** — theo cơ cấu hành chính hiện hành |
| Danh mục 21 khoản thu nội địa, 4 nguồn thu | **Thật** — theo đặc tả nghiệp vụ v2 |
| Ranh giới bản đồ 126 phường, xã | **Thật** — dữ liệu địa lý gốc |
| Công thức tính, quy tắc số liệu | **Thật** — đã triển khai và kiểm chứng |
| **Toàn bộ số tiền** | ⚠ **Mô phỏng** — sinh tất định cho 2024–2026 (2026 đến hết tháng 8) |
| **Dự toán và tiến độ dự toán** | ⚠ **Mô phỏng** — API hiện không có trường dự toán. Prototype suy ra bằng thực hiện cả năm trước nhân 1,08 |
| **Phân rã NSĐP theo cấp tỉnh/huyện/xã** | ⚠ **Mô phỏng** — kho dữ liệu chưa có ba cấp con |

> ⚠ **Giao diện không mang nhãn cảnh báo số liệu mô phỏng.** Bản dựng này được bàn giao cho
> đội frontend làm thiết kế chính, nên nhãn đó đã được gỡ để không bị chép vào sản phẩm thật.
> Hệ quả: **bản chạy thử chỉ dùng để duyệt thiết kế, không dùng trong cuộc họp chuyên môn**, và
> người trình chiếu phải tự nêu tính chất số liệu. Lý do đầy đủ ở `BA-NSNN.md` mục 13.1.

Hệ thống không trộn số mô phỏng với bất kỳ tổng chính thức nào.

**Số mô phỏng vẫn có giá trị nghiệm thu** vì nó được dựng có chủ đích để bộc lộ đúng các
tình huống khó: có địa bàn thu bằng 0, có khoản mang giá trị âm hợp lệ (hoàn thuế, khấu
trừ), có hai phường xã cố ý thiếu dữ liệu năm 2026 để kiểm tra cảnh báo độ phủ, và tháng
tương lai để trống chứ không quy về 0.

---

## 5. Chất lượng đã kiểm chứng

Prototype không chỉ "chạy được" — có **17 phép kiểm tra tự động chạy trên trình duyệt
Chrome thật**, cộng với kiểm tra biên dịch và đóng gói. Toàn bộ chạy lại mỗi lần đẩy mã
nguồn qua GitHub Actions.

**Kết quả hiện tại: 17/17 đạt.**

Mỗi phép kiểm tra canh một cách hỏng cụ thể đã từng xảy ra hoặc chắc chắn sẽ xảy ra:

| Nhóm | Canh điều gì |
|---|---|
| Điều hướng | Bốn tab giữ nguyên bộ lọc; URL mở lại đúng trạng thái để gửi cho người khác; nút Back đóng drawer |
| Tính đúng của số | Đủ đúng 21 khoản; `0`, số âm và "chưa có dữ liệu" là ba thứ khác nhau; waterfall khớp tổng chênh lệch; không sinh `−100%` giả từ dữ liệu thiếu |
| An toàn dữ liệu | Payload sai định dạng bị từ chối; nguồn ngoài không đẩy được mã thực thi vào giao diện; đổi bộ lọc nhanh tay không để lại số của bộ lọc cũ |
| Bố cục | Không tràn ngang ở 390 / 1024 / 1440px; không thẻ nào bị cắt mất nội dung; thẻ cùng hàng cao bằng nhau; một cột số chỉ dùng một đơn vị tiền |

Ý nghĩa với người duyệt: các lỗi kiểu "hai widget cùng nguồn ra hai con số khác nhau" hay
"địa bàn chưa nạp số hiện −100% như thể mất trắng nguồn thu" đã được chặn bằng máy, không
phụ thuộc vào việc ai đó nhớ kiểm tra.

---

## 6. Tích hợp Web và Mobile

Đã triển khai giao thức để ứng dụng Mobile nhúng dashboard vào WebView và điều khiển được
nó: đổi tab, cập nhật bộ lọc, và mở bộ lọc dạng native của app. Dashboard phản hồi lại
trạng thái và chiều cao nội dung để app đồng bộ giao diện. 10/10 tiêu chí nghiệm thu phần
tích hợp đã đạt.

**Phần đội Mobile cần làm:** nhúng URL vào WebView, gửi ngữ cảnh host, mở modal lọc native
khi nhận yêu cầu, và thống nhất danh sách domain được phép trao đổi dữ liệu.

Chi tiết kỹ thuật: `HOST-INTEGRATION.md` · Báo cáo riêng: `REPORT-MOBILE-HOST-INTEGRATION.md`

---

## 7. Cần quyết định để đi tiếp

### 7.1. Giả định nghiệp vụ chưa được xác nhận

Đây là các điểm **chặn việc chốt công thức**. Prototype đang dùng cách hiểu tạm; nếu cách
hiểu chính thức khác đi thì con số sẽ khác.

| Mã | Nội dung cần xác nhận | Ai chốt |
|---|---|---|
| A01 | Công thức chính thức của `Thu thuần` | Nghiệp vụ |
| A02 | Công thức thu xuất nhập khẩu ròng và các khoản hoàn/khấu trừ | Nghiệp vụ |
| A03 | Cấp dữ liệu chính xác của các nhóm IV–VIII | Nghiệp vụ |
| A04 | Điều kiện loại mẫu số quá nhỏ khỏi bảng tăng trưởng | Nghiệp vụ |
| A05 | Ngưỡng tạo cảnh báo tăng, giảm và bất thường | Nghiệp vụ |
| A06 | Quy tắc địa giới lịch sử trước và sau thay đổi hành chính | Nghiệp vụ |
| A07 | Người dùng có được truy cập trực tiếp mọi chế độ so sánh không | Nghiệp vụ |
| A08 | Phạm vi dữ liệu chính thức hiện có theo năm, kỳ và địa bàn | Dữ liệu |

### 7.2. Dữ liệu cần bổ sung từ phía API

| Nội dung | Vì sao cần |
|---|---|
| **Trường dự toán giao đầu năm** | Câu hỏi "đạt bao nhiêu % dự toán" là một trong các câu hỏi chính của lãnh đạo, hiện đang phải dùng số mô phỏng |
| **Phân rã NSĐP theo cấp tỉnh / huyện / xã** | Cần để đối chiếu phần thành phố thực sự điều hành |
| **API `/api/dashboard/*`** | Backend chưa tồn tại; adapter và lớp kiểm tra dữ liệu ở phía giao diện đã sẵn sàng |

### 7.3. Năm điểm cần chốt với đội Mobile

Header native hay header gọn trong dashboard · iOS và Android dùng chung cấu trúc bộ lọc
hay cần bộ chuyển đổi riêng · WebView cố định chiều cao hay tự co giãn · danh sách domain
chính thức · nút Back ưu tiên đóng drawer hay quay lại màn hình trước của app.

---

## 8. Chưa nằm trong phạm vi

Các nội dung sau **cố ý** chưa làm ở giai đoạn prototype, cần quyết định có đưa vào giai
đoạn sau hay không:

| Nội dung | Ghi chú |
|---|---|
| Xuất Excel bảng 21 khoản | Đặc tả có nêu; hiện đã có tìm kiếm và sắp xếp mọi cột |
| Phân tích theo doanh nghiệp | Tài liệu định hướng có nhắc, đặc tả v2 chưa yêu cầu |
| Dự báo thu chính thức | Ngoài phạm vi công cụ phân tích vận hành |
| Nhập/sửa số liệu gốc, phê duyệt quyết toán | Dashboard chỉ đọc, không ghi |
| Quản lý người dùng và phân quyền | Chưa thuộc phạm vi |
| Đăng nhập một lần giữa app và dashboard | Cần thiết kế riêng |

---

## 9. Kiến nghị

1. **Duyệt prototype** về luồng nghiệp vụ, cách trình bày và bộ câu hỏi nó trả lời.
2. **Chốt 8 giả định A01–A08** — đây là việc chặn, làm càng sớm càng đỡ phải sửa công thức
   sau khi đã có số thật.
3. **Xác nhận nguồn dự toán**: có trường này trong hệ thống nguồn không, lấy ở đâu, cập
   nhật theo chu kỳ nào. Nếu chưa có thì thống nhất là tạm ẩn chỉ số tiến độ dự toán thay
   vì để số mô phỏng.
4. **Lên lịch cung cấp API** theo hợp đồng dữ liệu đã mô tả, kèm phân rã NSĐP ba cấp.
5. **Họp chốt 5 điểm tích hợp Mobile** để đội Mobile bắt đầu song song, không phải chờ API.

---

*Tài liệu liên quan: `BA-NSNN.md` (vì sao cần từng quy tắc dữ liệu và từng tiêu chí nghiệm
thu) · `THIET-KE-DASHBOARD-NSNN.md` (đặc tả thiết kế đang triển khai) · `web/README.md`
(hướng dẫn chạy, cách thay API, giả định của dữ liệu mô phỏng)*
