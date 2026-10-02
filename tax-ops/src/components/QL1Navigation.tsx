import { createContext, useContext, useState, type ReactNode } from "react";

export const QL1_SECTIONS = [
  { id: "tongquan", label: "Tổng quan" },
  { id: "no", label: "So sánh nợ" },
  { id: "cc", label: "Kết quả cưỡng chế" },
  { id: "th", label: "Tạm hoãn xuất cảnh" },
  { id: "t06", label: "Tạm hoãn XC · trạng thái 06" },
  { id: "quytac", label: "Quy tắc và nguồn" },
  { id: "nguon", label: "Dữ liệu gốc" },
] as const;

export type QL1SectionId = (typeof QL1_SECTIONS)[number]["id"];

interface QL1NavigationValue {
  activeSection: QL1SectionId;
  setActiveSection: (section: QL1SectionId) => void;
}

const QL1NavigationContext = createContext<QL1NavigationValue | null>(null);

export function QL1NavigationProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<QL1SectionId>("tongquan");
  return <QL1NavigationContext.Provider value={{ activeSection, setActiveSection }}>{children}</QL1NavigationContext.Provider>;
}

export function useQL1Navigation() {
  const navigation = useContext(QL1NavigationContext);
  if (!navigation) throw new Error("QL1NavigationProvider is missing.");
  return navigation;
}

export function QL1SidebarItems({ visible, onNavigate }: { visible: boolean; onNavigate: () => void }) {
  const { activeSection, setActiveSection } = useQL1Navigation();
  if (!visible) return null;

  return <div className="ql1-nav-items" role="group" aria-label="Mục của báo cáo nợ">
    {QL1_SECTIONS.map((section) => <button
      key={section.id}
      type="button"
      className={`ql1-nav-item${activeSection === section.id ? " is-active" : ""}`}
      aria-current={activeSection === section.id ? "page" : undefined}
      onClick={() => { setActiveSection(section.id); onNavigate(); }}
    >{section.label}</button>)}
  </div>;
}