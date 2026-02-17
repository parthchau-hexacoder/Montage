import axios from "axios";
import type { BackendModule } from "../models/backendModule";

type ModulesApiResponse =
  | BackendModule[]
  | { data?: unknown; modules?: unknown };

type BackendModuleEnvelope = {
  module: BackendModule;
};

export async function fetchBackendModules(): Promise<BackendModule[]> {
  const modulesUrl = buildModulesUrl();
  const response = await axios.get(modulesUrl,{
    headers:{
      Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNzU5NTlhMGYtMmEyMS00YzYxLWFkMzgtMzQ4NjE4ZjM3OWU3IiwidXNlcklkIjoiYTlhOWM5MWUtNDBhMS03MDFlLWY0ZTEtOWZhMTQxYzRhY2E1Iiwic3RyaXBlSWQiOiJjdXNfUnlDSjRwcllyRzd4SDQiLCJzdWJzY3JpcHRpb25TdGF0dXMiOiJ0cmlhbGluZyIsInN0cmlwZVN1YnNjcmlwdGlvbklkIjpudWxsLCJzdHJpcGVTY2hlZHVsZUlkIjpudWxsLCJ1c2VyUm9sZSI6MywicHJvZHVjdEluZm8iOmZhbHNlLCJlbWFpbCI6ImhleGFjb2RlcnRlc3RAZ21haWwuY29tIiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIiLCJvcmdhbml6YXRpb24iOiJoZXhhYSIsInVzZXJOYW1lIjpudWxsLCJjb21wYW55TmV3cyI6ZmFsc2UsIm9mZmVycyI6ZmFsc2UsImNyZWF0ZWRBdCI6IjIwMjUtMDMtMDdUMTA6MjY6MjMuNzE0WiIsInVwZGF0ZWRBdCI6IjIwMjUtMDMtMTlUMDY6MTY6MTYuNTEzWiIsInN1YnNjcmlwdGlvbklkIjoiNGNkNjI0YmQtYjUzNS00Y2YyLTgwNDYtZWM5MWJlZjdiMzcwIiwiaW1hZ2UiOiJodHRwczovL21vbnRhZ2UtZGF0YS1kZXYuczMudXMtd2VzdC0xLmFtYXpvbmF3cy5jb20vdXNlci83NTk1OWEwZi0yYTIxLTRjNjEtYWQzOC0zNDg2MThmMzc5ZTcvcHJvZmlsZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ29udGVudC1TaGEyNTY9VU5TSUdORUQtUEFZTE9BRCZYLUFtei1DcmVkZW50aWFsPUFLSUEyTElQWlpDSFZPUDNETjVQJTJGMjAyNjAyMTYlMkZ1cy13ZXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMjE2VDEyMjIyMVomWC1BbXotRXhwaXJlcz04NjQwMCZYLUFtei1TaWduYXR1cmU9YTMyMmNjNmZmMzRlNTYxYTg1MWEzZmY5ZjA1OWIzMmY4OTQ1Mjc4NDliYzM4OWMzNGVjMTYxNTJiNzU5YmE2ZCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmeC1pZD1HZXRPYmplY3QifSwidXNlcklkIjoiYTlhOWM5MWUtNDBhMS03MDFlLWY0ZTEtOWZhMTQxYzRhY2E1IiwiaXNBZG1pbiI6ZmFsc2UsImhhc0FkbWluUGFuZWxBY2Nlc3MiOmZhbHNlLCJjb2duaXRvIjp7ImN1c3RvbTpvcmdhbml6YXRpb24iOiJoZXhhYSIsInN1YiI6ImE5YTljOTFlLTQwYTEtNzAxZS1mNGUxLTlmYTE0MWM0YWNhNSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLXdlc3QtMS5hbWF6b25hd3MuY29tL3VzLXdlc3QtMV9CNGdQQm9Rc1UiLCJjb2duaXRvOnVzZXJuYW1lIjoiYTlhOWM5MWUtNDBhMS03MDFlLWY0ZTEtOWZhMTQxYzRhY2E1IiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSGV4YWNvZGVyRGV2Iiwib3JpZ2luX2p0aSI6IjM4YTgwNDAwLTU0MWUtNDM2Yy04MWYxLWQzYjJiOWEzOWM1NSIsImF1ZCI6IjJvbnJ0Nm12YWs5MTBnZzVhcHAzcGh0c3U5IiwiZXZlbnRfaWQiOiIyNTJiNzhhYS00MWUyLTRiMzItODBlZC1iNDVkZDNiNTZmNWMiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTc3MTI0NDU0MCwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6MTc3MTI0ODE0MCwiaWF0IjoxNzcxMjQ0NTQwLCJqdGkiOiI2ZDAyY2E3Ny1jMWFhLTRlZGItYjhiZi0xMWU3YzhjZTNjNWYiLCJlbWFpbCI6ImhleGFjb2RlcnRlc3RAZ21haWwuY29tIn0sImlhdCI6MTc3MTI0NDU0MSwiZXhwIjoxNzcyMTA4NTQxfQ.90xff9fioGIksBxqGgsQ3ipvQRJru97So1tu9MuxNsg'
    }
  });
  return extractModules(response.data);
}

function buildModulesUrl() {
  const explicitUrl = (import.meta.env.VITE_MODULES_API_URL as string | undefined)?.trim();
  if (explicitUrl) {
    return ensureModulesPath(explicitUrl);
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!baseUrl) {
    return "/modules";
  }

  return `${baseUrl.replace(/\/+$/, "")}/modules`;
}

function extractModules(payload: ModulesApiResponse): BackendModule[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.modules)) {
    return normalizeModulesArray(payload.modules);
  }

  if (Array.isArray(payload.data)) {
    return normalizeModulesArray(payload.data);
  }

  throw new Error("Unexpected modules response shape.");
}

function normalizeModulesArray(modules: unknown[]): BackendModule[] {
  if (modules.length === 0) {
    return [];
  }

  const first = modules[0];
  if (isModuleEnvelope(first)) {
    return (modules as BackendModuleEnvelope[]).map((item) => item.module);
  }

  return modules as BackendModule[];
}

function isModuleEnvelope(value: unknown): value is BackendModuleEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "module" in value;
}

function ensureModulesPath(url: string) {
  const normalized = url.replace(/\/+$/, "");
  const modulesSuffix = "/modules";

  try {
    const parsed = new URL(normalized);
    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = modulesSuffix;
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return normalized.endsWith(modulesSuffix)
      ? normalized
      : `${normalized}${modulesSuffix}`;
  }
}
