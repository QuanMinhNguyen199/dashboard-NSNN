import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type HostSource = "web" | "mobile";
export type HostPlatform = "desktop" | "ios" | "android";
export type HostDisplayMode = "dashboard" | "report";

export interface HostCapabilities {
  /** Host mở bộ lọc native thay cho panel HTML trong dashboard. */
  openFilterModal: boolean;
  /** Host muốn nhận các thay đổi điều hướng để đồng bộ route native. */
  navigation: boolean;
}

export interface DashboardHostContext {
  source: HostSource;
  platform: HostPlatform;
  displayMode: HostDisplayMode;
  capabilities: HostCapabilities;
}

export interface HostCommand {
  sequence: number;
  type: "NSNN_SET_FILTERS" | "NSNN_NAVIGATE";
  payload: unknown;
}

interface HostContextValue {
  host: DashboardHostContext;
  embedded: boolean;
  commands: readonly HostCommand[];
  postToHost: (type: string, payload?: unknown) => void;
}

const HostCtx = createContext<HostContextValue | null>(null);

const HOST_SOURCES = ["web", "mobile"] as const;
const HOST_PLATFORMS = ["desktop", "ios", "android"] as const;
const DISPLAY_MODES = ["dashboard", "report"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === "string" && allowed.includes(value as T);

function queryFallback(): DashboardHostContext {
  const query = new URLSearchParams(window.location.search);
  const source = oneOf(query.get("host"), HOST_SOURCES) ? query.get("host") as HostSource : "web";
  const requestedPlatform = query.get("platform");
  const platform = oneOf(requestedPlatform, HOST_PLATFORMS)
    ? requestedPlatform
    : source === "mobile"
      ? "android"
      : "desktop";
  return {
    source,
    platform,
    displayMode: source === "mobile" ? "report" : "dashboard",
    // URL fallback dùng panel HTML để prototype vẫn hoạt động độc lập. App thật
    // bật capability này trong NSNN_HOST_CONTEXT khi đã có modal native.
    capabilities: { openFilterModal: false, navigation: false },
  };
}

function readHostContext(payload: unknown): DashboardHostContext | null {
  if (!isRecord(payload) || !oneOf(payload.source, HOST_SOURCES)) return null;
  const source = payload.source;
  const platform = oneOf(payload.platform, HOST_PLATFORMS)
    ? payload.platform
    : source === "mobile"
      ? "android"
      : "desktop";
  const displayMode = oneOf(payload.displayMode, DISPLAY_MODES)
    ? payload.displayMode
    : source === "mobile"
      ? "report"
      : "dashboard";
  const capabilities = isRecord(payload.capabilities) ? payload.capabilities : {};
  return {
    source,
    platform,
    displayMode,
    capabilities: {
      openFilterModal: capabilities.openFilterModal === true,
      navigation: capabilities.navigation === true,
    },
  };
}

const configuredOrigins = (import.meta.env.VITE_HOST_ORIGINS ?? "")
  .split(",")
  .map((origin: string) => origin.trim())
  .filter(Boolean);

/**
 * Cầu nối duy nhất giữa dashboard và Web host/Mobile WebView.
 *
 * Production có thể đặt VITE_HOST_ORIGINS=https://web.example,https://app.example.
 * Khi chưa cấu hình, dashboard chỉ nhận message trực tiếp từ parent đang nhúng nó;
 * parent vốn đã kiểm soát iframe nên đây là fallback phù hợp cho prototype/WebView.
 */
export function HostProvider({ children }: { children: ReactNode }) {
  const embedded = window.self !== window.top;
  const [host, setHost] = useState<DashboardHostContext>(queryFallback);
  const [commands, setCommands] = useState<HostCommand[]>([]);
  const sequence = useRef(0);
  const trustedOrigin = useRef<string | null>(null);

  const originAllowed = useCallback((origin: string) => {
    if (configuredOrigins.length === 0) return true;
    return configuredOrigins.includes(origin);
  }, []);

  const postToHost = useCallback((type: string, payload?: unknown) => {
    if (!embedded) return;
    window.parent.postMessage(
      { type, payload, protocolVersion: 1 },
      trustedOrigin.current ?? "*",
    );
  }, [embedded]);

  useEffect(() => {
    if (!embedded) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !originAllowed(event.origin) || !isRecord(event.data)) return;
      const type = event.data.type;
      if (typeof type !== "string") return;

      if (type === "NSNN_HOST_CONTEXT") {
        const next = readHostContext(event.data.payload);
        if (!next) return;
        trustedOrigin.current = event.origin === "null" ? "*" : event.origin;
        setHost(next);
        return;
      }

      if (type === "NSNN_SET_FILTERS" || type === "NSNN_NAVIGATE") {
        const next = { sequence: ++sequence.current, type, payload: event.data.payload } as HostCommand;
        // Giữ một hàng đợi ngắn để hai lệnh liên tiếp trong cùng event loop không
        // ghi đè nhau. Consumer tự bỏ qua sequence đã xử lý.
        setCommands((current) => [...current.slice(-19), next]);
      }
    };

    window.addEventListener("message", onMessage);
    postToHost("NSNN_DASHBOARD_READY", {
      supportedProtocolVersion: 1,
      accepts: ["NSNN_HOST_CONTEXT", "NSNN_SET_FILTERS", "NSNN_NAVIGATE"],
      emits: ["NSNN_OPEN_FILTER", "NSNN_STATE_CHANGE", "NSNN_RESIZE"],
    });
    return () => window.removeEventListener("message", onMessage);
  }, [embedded, originAllowed, postToHost]);

  useEffect(() => {
    document.documentElement.dataset.host = host.source;
    document.documentElement.dataset.platform = host.platform;
    return () => {
      delete document.documentElement.dataset.host;
      delete document.documentElement.dataset.platform;
    };
  }, [host.platform, host.source]);

  const value = useMemo(
    () => ({ host, embedded, commands, postToHost }),
    [commands, embedded, host, postToHost],
  );

  return <HostCtx.Provider value={value}>{children}</HostCtx.Provider>;
}

export function useHostContext(): HostContextValue {
  const context = useContext(HostCtx);
  if (!context) throw new Error("useHostContext() phải gọi trong <HostProvider>");
  return context;
}
