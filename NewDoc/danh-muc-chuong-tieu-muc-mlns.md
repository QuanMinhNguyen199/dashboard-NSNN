# Danh mục Chương & Tiểu mục MLNS

**Mã:** `MLNS`\n**Vai trò:** Danh mục Chương & Tiểu mục MLNS (rút gọn) kèm cảnh báo hiệu lực văn bản

File gốc

[Danh_muc_Chuong_Tieu_muc_MLNS.xlsx 26685](attachments/e767b7d3-8bad-405a-b2e8-cd62ca431984.xlsx)


## Mục đích & tóm tắt nội dung

Danh mục Mục lục ngân sách nhà nước (MLNS) rút gọn, dùng để tra cứu ý nghĩa mã Chương/Tiểu mục xuất hiện trong dữ liệu TMS. **Đây là bảng tham chiếu mô tả, không phải danh mục kiểm soát** — không dùng để validate và loại bỏ bản ghi.

## Cấu trúc dữ liệu

| Sheet | Số dòng | Nội dung |
|-------|---------|----------|
| `Chuong` | 105 (104 mã) | Mã Chương, tên, cấp quản lý, căn cứ pháp lý |
| `Tieu muc` | 181 (180 mã) | Mã Tiểu mục, tên, Mục cha, phân loại (Thuế/Phí...) |
| `Canh bao` | 22      | **Đọc trước khi dùng** — nguồn gốc số liệu và rủi ro hiệu lực văn bản |

## Data Dictionary

`**Chuong**`**:** STT, Mã Chương (3 ký tự), Tên Chương, Cấp quản lý (Trung ương 001-399 / Cấp tỉnh 400-599 / Cấp huyện 600-799 / Cấp xã 800-989), Căn cứ pháp lý, Ghi chú.

`**Tieu muc**`**:** STT, Mã Tiểu mục, Tên Tiểu mục, Mã Mục cha, Tên Mục, Phân loại, Căn cứ pháp lý, Ghi chú.

## Nội dung sheet `Canh bao` (quan trọng)

* Tên Chương lấy từ Phụ lục I – TT 324/2016/TT-BTC, đã cập nhật theo TT 84/2024 (Chương 208) và TT 41/2025 (Chương 830, 831, 832).
* **TT 130/2025/TT-BTC** (ban hành 24/12/2025) **thay thế toàn bộ** TT 324/2016 và các văn bản sửa đổi, hiệu lực từ **01/01/2026, áp dụng từ năm ngân sách 2026**.
* TT 130/2025 **bãi bỏ hoàn toàn nhóm mã Chương cấp huyện (600–799)**; chuyển 754/755/756/757 → 854/855/856/857.
* **Xung đột chưa giải quyết:** Khoản 6 Điều 3 TT 41/2025 nói TNCN do cơ quan chi trả/cá nhân nộp hạch toán 557/757 (không phải 857); Mục 2.5 CV 9682/BTC-KBNN (30/6/2025) nói nếu Thuế cấp cơ sở quản lý thì hạch toán 857.

## Liên kết với file khác

* Dữ liệu chứng từ mang mã Chương/Tiểu mục cần tra ở danh mục này.
* [TMS-SPEC](https://uat-outline.thehegeo.com/doc/tms-spec-bGSdzjvKQa) — điều kiện Chương/Tiểu mục của 113 chỉ tiêu cần rà theo danh mục và văn bản hiệu lực tại đây.

## Vấn đề / Lưu ý

* **Danh mục chưa đầy đủ:** 5 mã Chương (`145`, `187`, `48`, `119`, `49`) và 7 mã Tiểu mục (`3949`, `2703`, `2324`, `2637`, `2861`, `4904`, `3351`) có phát sinh trong [TMS-02](tms-du-lieu-02-2026.md) nhưng không có trong danh mục 104 Chương / 180 Tiểu mục. Đáng chú ý, Tiểu mục `2324` mang khoản 400 tỷ đồng lớn nhất trong dữ liệu chứng từ.
* Nếu báo cáo trải nhiều năm, cần bảng ánh xạ Chương theo thời gian (mã cấp huyện hiệu lực đến 30/6/2025, mã cấp xã mới từ 01/7/2025) — **không dùng một danh mục tĩnh duy nhất.**