import type { DemoUser } from "@/auth/demoAuth";
import type { ReportStatus } from "@/domain/types";

/*
  Vòng đời báo cáo — BC-06 và bảng 13.2 của FRS.

      Nháp ──gửi rà soát──▶ Đã rà soát ──duyệt──▶ Đã duyệt
        ▲                        │                   │
        └────── trả lại ─────────┘      tạo điều chỉnh│
        ▲                                            │
        └────────── Điều chỉnh ◀─────────────────────┘

  Hai điều FRS nói mà bản trước chưa có:

  1. "Đã duyệt" KHÔNG phải điểm cuối. 13.2 ghi rõ từ đó mở được bản **Điều
     chỉnh** kèm lý do, và bản đã duyệt cũ vẫn giữ, đánh dấu "đã thay thế" khi
     bản mới được duyệt. Báo cáo thuế bị sửa sau khi đã trình là chuyện có
     thật; không có đường ấy thì người dùng sẽ sửa ngoài hệ rồi gửi file tay.
  2. **QR-03 (Phải):** "người lập báo cáo không tự duyệt báo cáo của mình."
     Đây là luật phân nhiệm, không phải luật vai trò — một người vừa là chuyên
     viên vừa kiêm quản trị nghiệp vụ vẫn không được duyệt bản chính mình gửi.
     Nên phép kiểm so TÊN người gửi, không chỉ so vai.
*/

export type ApprovalAction = "send" | "approve" | "return" | "amend";

/** Ai đẩy được trạng thái nào. Bảng này là bản dịch thẳng của 13.2. */
const BUOC: Record<ApprovalAction, { tu: ReportStatus[]; den: ReportStatus }> = {
  send: { tu: ["DRAFT", "AMEND"], den: "REVIEWED" },
  approve: { tu: ["REVIEWED"], den: "APPROVED" },
  return: { tu: ["REVIEWED"], den: "DRAFT" },
  amend: { tu: ["APPROVED"], den: "AMEND" },
};

/** Vai nào được làm hành động nào, theo ma trận quyền 3.2 (cột "Rà soát, duyệt báo cáo"). */
const VAI: Record<ApprovalAction, DemoUser["vaiTro"][]> = {
  send: ["CV"],
  approve: ["TP"],
  return: ["TP"],
  /* 13.2: "Điều chỉnh — VT-02 mở, ghi lý do". Vai quản trị nghiệp vụ trong bản
     demo do trưởng phòng kiêm, nên quyền mở điều chỉnh nằm ở TP. */
  amend: ["TP"],
};

export interface BoiCanhDuyet {
  status: ReportStatus;
  /** Người đã gửi bản đang chờ; dùng cho QR-03. */
  guiBoi: string | null;
}

/**
 * Chốt chặn phía trình duyệt cho bản demo. Bản thật phải áp cùng chính sách ở
 * máy chủ — màn hình giấu nút không phải là phân quyền.
 */
export function canChangeApproval(
  user: Pick<DemoUser, "phong" | "vaiTro" | "name">,
  key: string,
  boiCanh: BoiCanhDuyet | ReportStatus,
  action: ApprovalAction,
) {
  /* QR-01: mọi thao tác lọc theo phạm vi dữ liệu của người dùng trước đã. */
  if (!user.phong || !key.startsWith(`${user.phong}|`)) return false;

  const { status, guiBoi } = typeof boiCanh === "string" ? { status: boiCanh, guiBoi: null } : boiCanh;
  if (!BUOC[action].tu.includes(status)) return false;
  if (!VAI[action].includes(user.vaiTro)) return false;

  /* QR-03: người lập không tự duyệt bản của mình. */
  if (action === "approve" && guiBoi !== null && guiBoi === user.name) return false;

  return true;
}

export const buocDen = (action: ApprovalAction) => BUOC[action].den;
