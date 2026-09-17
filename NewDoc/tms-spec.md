# TMS-SPEC

**Mã:** `TMS-SPEC`

**File gốc:**

[Lay du lieu thu NSNN theo KV, NNKD (TMS).XLSX 66457](attachments/479cdb1c-c71e-4796-b5fc-c9efbb74bb50.xlsx)

\n**Vai trò:** Đặc tả yêu cầu gốc — 6 bước nghiệp vụ, nguyên tắc lấy số, 8 mẫu báo cáo

## Mục đích & tóm tắt nội dung

Đây là tài liệu đặc tả gốc của toàn bộ yêu cầu "Lấy dữ liệu thu NSNN theo khu vực, ngành nghề kinh doanh (NNKD) từ TMS". 

**Lưu ý định hướng quan trọng:** mục tiêu của luồng TMS **không phải** để ra số thu tổng thể toàn địa bàn — số đó đã có sẵn và chuẩn hơn từ `csdltc.mof.gov.vn` (xem [KB-THUNSNN](https://uat-outline.thehegeo.com/doc/thu-nsnn_kho-bac-WDk70grxA2)). Mục tiêu thật là phân tích chuyên sâu ba chiều mà KBNN không có: **ngành nghề kinh doanh, người nộp thuế (NNT), khu vực kinh tế**.

## Cấu trúc dữ liệu

Workbook có 10 sheet:

| Sheet | Số dòng | Nội dung |
|-------|---------|----------|
| `Chung` | 2 (1 dòng dữ liệu) | Toàn bộ 6 bước nghiệp vụ nằm trong ô B2; sản phẩm đầu ra ở C2; đề xuất tự động hóa ở E2 |
| `Nguyen tac lay so` | 121 (113 chỉ tiêu) | Quy tắc lọc cho từng chỉ tiêu báo cáo |
| `Mau BC theo phuong xa` / `theo CQT` / `theo nganh nghe` | 121 mỗi sheet | Mẫu báo cáo 1 chiều |
| `Mau BC theo CQT+Dia ban` | 121     | Mẫu báo cáo 2 chiều (CQT ⊃ địa bàn) |
| `Mau bao cao nganh+Dia ban (1)/(2)` | 121 mỗi sheet | Mẫu 2 chiều ngành×địa bàn, hai thứ tự lồng khác nhau |
| `Mau bao cao nganh+CQT (1)/(2)` | 121 mỗi sheet | Mẫu 2 chiều ngành×CQT, hai thứ tự lồng khác nhau |

## Data Dictionary — sheet `Nguyen tac lay so`

| Trường | Vị trí | Ý nghĩa |
|--------|--------|---------|
| STT    | cột A  | Số thứ tự chỉ tiêu (A, A\*, I, 1, 1.1, a, b...) |
| CHỈ TIÊU | cột B  | Tên chỉ tiêu báo cáo |
| CÔNG THỨC / điều kiện Chương | cột C  | Công thức tổng hợp, hoặc điều kiện lọc theo Chương (dạng văn bản tự do) |
| TIỂU MỤC | cột D  | Danh sách mã tiểu mục áp dụng cho chỉ tiêu |
| KÝ HIỆU GD | cột E  | Ghi chú cách lọc theo ký hiệu giao dịch (chỉ có ở một số dòng mốc: A, B, C, D) |

113 chỉ tiêu (dòng 9–121), chia 4 phần: **A** Tổng thu nội địa, **B** Hoàn thuế, **C** Trả lãi cho NNT, **D** Thu hồi hoàn thuế.

## Sáu bước nghiệp vụ (ô B2)


1. Tra cứu danh sách giao dịch báo cáo kế toán (chức năng `8.9.1.12` trên TMS), tham số CQT 0101–0157, ngày hạch toán trọn năm, niên độ 01.
2. Tra cứu riêng chứng từ của CCT Doanh nghiệp lớn phát sinh trên địa bàn (tick "Tra cứu chứng từ của CT DNL ps trên địa bàn").
3. Chiết ra Excel — thường phải chiết theo CQT hoặc theo tháng vì hệ thống không cho chiết một lần.
4. Tổng hợp toàn bộ các file chiết được.
5. Từ dữ liệu chuẩn hóa ngành nghề, thêm trường "ngành nghề" cho từng chứng từ theo MST — xem [DANHBA](https://uat-outline.thehegeo.com/doc/danh_ba_mst-38Q0XbA8f8).
6. Tổng hợp vào báo cáo theo mẫu (BC3_KVKT, BC3_Loại thuế): cộng theo hàng ngang; địa bàn lấy cột "ĐBHC 2 cấp", CQT lấy cột "Cơ quan thuế", ngành nghề lấy kết quả Bước 5.

## Liên kết với file khác

* [DANHBA](https://uat-outline.thehegeo.com/doc/danh_ba_mst-38Q0XbA8f8) — nguồn danh mục ngành nghề dùng ở Bước 5.
* [MAP-BC](https://uat-outline.thehegeo.com/doc/map-su-dung-bao-cao-6D7gaIC3wi) — bảng đối chiếu 113 chỉ tiêu này với 189 dòng báo cáo KBNN (dùng ở Bước 6).
* [MLNS](https://uat-outline.thehegeo.com/doc/danh-muc-chuong-tieu-muc-mlns-zp2DYzBgFb) — danh mục Chương/Tiểu mục tham chiếu cho cột điều kiện.

## Vấn đề / Lưu ý

* **Mâu thuẫn nội tại:** ô E9 nói phần A "lấy toàn bộ các giao dịch", nhưng ô E114 lại dành riêng `C5` và `HC` (hủy C4/C5) cho phần B. Chênh lệch đo được trên một file điều chỉnh là **6,63 tỷ đồng** — cần Business xác nhận phần A có bao gồm C5/HC hay không.
* Điều kiện Chương ở cột C nhiều dòng viết dạng văn bản tự do và tự lặp (ví dụ dòng 29: "từ 402 đến 989, từ 802 đến 989..." — vế sau đã nằm trong vế trước). Cần chuyển thành bảng tham số có cấu trúc trước khi lập trình.
* Chỉ tiêu B.2 "Hoàn nộp thừa" ghi điều kiện tiểu mục là "Tất cả các tiểu mục" — khác biệt bất thường so với 112 chỉ tiêu còn lại đều liệt kê tiểu mục cụ thể.
* 8 sheet mẫu chỉ minh họa 2–3 cột rồi ghi "…" — số cột thực tế của báo cáo ngành×địa bàn có thể lên tới 13×126 = 1.638 cột, cần chốt cơ chế lọc/giới hạn.