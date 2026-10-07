/*
  Dữ liệu mô phỏng cho phiên bản báo cáo.

  Mọi con số ở đây là **số mô phỏng tất định** — cùng một lần mở cho ra cùng một
  kết quả, nhưng không phải số nghiệp vụ thật.
*/
import type { ReportVersion } from "@/domain/types";

export const reportVersions: ReportVersion[] = [
  { id: "v1", runId: "b1", version: "v3", createdAt: "27/09 – 17:20", createdBy: "Trần Quang Dương", guiBoi: "Trần Quang Dương", chotBoi: "Phạm Thanh Vy", note: "Chạy lại sau khi bổ sung file Thuế cơ sở 6" },
  { id: "v2", runId: "b1", version: "v2", createdAt: "26/09 – 09:05", createdBy: "Trần Quang Dương", guiBoi: null, chotBoi: null, note: "Thiếu một file nguồn, số chưa đủ" },
  { id: "v3", runId: "b1", version: "v1", createdAt: "25/09 – 16:40", createdBy: "Trần Quang Dương", guiBoi: null, chotBoi: null, note: "Bản chạy đầu tiên của kỳ" },
];
