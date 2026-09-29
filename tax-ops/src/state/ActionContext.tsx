import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";

type Notify = (message: string) => void;
const ActionContext = createContext<Notify>(() => undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [giu, setGiu] = useState(false);
  const dem = useRef<number | null>(null);

  /* Hẹn giờ phải huỷ được: rê chuột hoặc đưa focus vào toast thì nó dừng đếm.
     Một thông báo nói "đã duyệt lúc 10:14, người duyệt X" là thứ người ta cần
     đọc kỹ, không phải thứ biến mất giữa chừng. */
  const dat = useCallback(() => {
    if (dem.current) window.clearTimeout(dem.current);
    dem.current = window.setTimeout(() => setMessage(null), 4200);
  }, []);
  const notify = useCallback((next: string) => { setMessage(next); setGiu(false); dat(); }, [dat]);
  useEffect(() => () => { if (dem.current) window.clearTimeout(dem.current); }, []);
  useEffect(() => {
    if (!message) return;
    if (giu && dem.current) window.clearTimeout(dem.current);
    if (!giu) dat();
  }, [giu, message, dat]);
  const value = useMemo(() => notify, [notify]);
  return <ActionContext.Provider value={value}>
    {children}
    {message && <div className="toast" role="status" aria-live="polite" onMouseEnter={() => setGiu(true)} onMouseLeave={() => setGiu(false)} onFocusCapture={() => setGiu(true)} onBlurCapture={() => setGiu(false)}><Icon name="check"/><span>{message}</span><button type="button" onClick={() => setMessage(null)} aria-label="Đóng thông báo"><Icon name="close" size={17}/></button></div>}
  </ActionContext.Provider>;
}

export function useAction() { return useContext(ActionContext); }
