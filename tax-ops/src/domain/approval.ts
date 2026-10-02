import type { DemoUser } from "@/auth/demoAuth";
import type { ReportStatus } from "@/domain/types";

export type ApprovalAction = "send" | "approve" | "return";

/** Client-side prototype guard. Production must enforce the same policy on the server. */
export function canChangeApproval(user: Pick<DemoUser, "phong" | "vaiTro">, key: string, status: ReportStatus, action: ApprovalAction) {
  if (!user.phong || !key.startsWith(`${user.phong}|`)) return false;
  return action === "send"
    ? user.vaiTro === "CV" && status === "DRAFT"
    : user.vaiTro === "TP" && status === "PENDING";
}
