# MAP danh bạ theo ngành nghề kinh doanh

**Mã:** `DANHBA`

**File gốc:** 

[MAP Danh ba theo NNKD.xlsx 46822903](attachments/0a6b0ee2-ab92-4afd-b867-4ee70c47932d.xlsx)

**Vai trò:** Danh bạ người nộp thuế kèm mã ngành nghề đã chuẩn hóa — nguồn duy nhất cho Bước 5

## Mục đích & tóm tắt nội dung

Cung cấp ba chiều phân tích đích của TMS: ngành nghề kinh doanh, khu vực kinh tế, và địa bàn hiện hành của từng người nộp thuế.

## Cấu trúc dữ liệu

| Sheet | Số dòng | Tình trạng |
|-------|---------|------------|
| `DN Trongdiem` | 473\.622 (473.618 dòng dữ liệu, dòng 5 trở đi; dòng 2–4 trống) | Danh bạ chính, 14 cột |
| `NNKD` | 1\.835 (1.834 mã VSIC) | Danh mục ngành nghề, quy về 13 nhóm `PL_NNKD` |
| `DN Trongdiem (P-TCS)` | 35      | **Hỏng hoàn toàn** — toàn bộ 20 cột số là `#REF!` |

## Data Dictionary — sheet `DN Trongdiem`

| Trường | Kiểu | Ý nghĩa / độ phủ |
|--------|------|------------------|
| STT    | integer | Số thứ tự dòng.  |
| CQT    | text(4) | Chỉ điền cho 5.978 DNTĐ (98,7% rỗng) — không dùng làm chiều CQT chung. |
| Mã số thuế | text(10\|14) | **Khóa join của Bước 5.** 473.606 giá trị phân biệt (12 MST trùng, không mâu thuẫn `PL_NNKD`). |
| Tên NNT | text | Tên người nộp thuế. |
| ĐVQL NNT | text | Đơn vị quản lý (`TCS05`, `TP -Thuế`...) — **có khoảng trắng đuôi không đồng nhất**, cần `TRIM()`. |
| Mã NNKD chính | text | Mã VSIC, join sang sheet `NNKD`. Rỗng ở 6.965 dòng. |
| Tên NNKD chính | text | Tên ngành cấp chi tiết. Rỗng cùng 6.965 dòng trên. |
| **PL_NNKD** | text | **Chiều ngành nghề của báo cáo** — 13 nhóm hợp lệ + `#N/A` ở 6.965 dòng. |
| **Xã/phường đặt trụ sở chính** | text | **Địa bàn hiện hành của NNT** — dùng để gán lại địa bàn. 99,89% sạch (473.083/473.618 thuộc đúng 126 phường/xã); rác 359 dòng (336 kèm `(Hết hiệu lực)` + 23 tên lạ) + 176 dòng trống. |
| Chương | text | **Ghi TÊN Chương** (vd "Kinh tế tư nhân"), không phải mã số — không join trực tiếp được với cột Chương của [TMS-02](tms-du-lieu-02-2026.md). |
| Loại NNT | text | 4 loại đăng ký thuế; **toàn bộ đều là tổ chức, không có cá nhân/hộ kinh doanh.** |
| PHÂN LOẠI DN | text | **Hỏng** — `#REF!` ở 467.640/473.618 dòng (98,7%). |
| **Khu vực kinh tế** | text | Một trong ba chiều đích, nhưng chỉ điền ở 5.978 dòng DNTĐ = **1,26%**. |
| Nhóm xác định DNTĐ | text | Chỉ 3.237 dòng có giá trị. |

## Data Dictionary — sheet `NNKD`

3 cột: `Mã NNKD chính` (1.834 mã, không trùng), `Tên NNKD chính`, `PL_NNKD` (13 nhóm: Thương mại, Dịch vụ, Xây dựng, Khoa học/Y tế/Giáo dục, Công nghiệp chế biến-chế tạo, Thông tin-Truyền thông, Bất động sản, Vận tải, Tài chính-Ngân hàng-Bảo hiểm, Khác, Nông-Lâm-Thủy sản, Sản xuất, Khai khoáng).

## Liên kết với file khác

* [TMS-SPEC](https://uat-outline.thehegeo.com/doc/tms-spec-bGSdzjvKQa) — Bước 5 mô tả việc dùng danh bạ này.
* [MAP-6334](https://uat-outline.thehegeo.com/doc/map-6334-K6wqTViUx0) — dùng để xác thực tên 126 phường/xã trong cột "Xã/phường đặt trụ sở chính" (khớp 100% với `MAP DBHC`).

## Vấn đề / Lưu ý

* **Join MST → chứng từ chỉ đạt 27,18% số dòng** vì danh bạ không có cá nhân/ hộ kinh doanh — đây là giới hạn thiết kế, không phải lỗi dữ liệu, và là nút thắt chính của toàn bộ luồng TMS (ba chiều đích đều phụ thuộc phép join này).
* **Khu vực kinh tế chỉ phủ 1,26%.** Cách suy thay thế (từ mã Chương) phủ 100% nhưng lệch 35,4% với danh bạ trên phần dữ liệu kiểm chứng được, vì Chương 557/757/857 còn mang thuế TNCN do tổ chức nộp thay — không chỉ hộ cá thể.
* Cột `PHÂN LOẠI DN` và sheet `DN Trongdiem (P-TCS)` bị lỗi công thức Excel đứt liên kết (`#REF!`) — cần xuất lại dưới dạng giá trị từ nguồn.
* 12 MST xuất hiện 2 lần trong danh bạ (đã kiểm tra: không có MST nào mang 2 giá trị `PL_NNKD` khác nhau — khử trùng an toàn).