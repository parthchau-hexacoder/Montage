import axios from "axios";
import type { BackendTemplate } from "../models/backendTemplate";
import { API_AUTH_HEADERS } from "./modulesApi";

type TemplatesApiResponse =
  | BackendTemplate[]
  | { data?: unknown; templates?: unknown };

type BackendTemplateEnvelope = {
  template: BackendTemplate;
};

export async function fetchBackendTemplates(): Promise<BackendTemplate[]> {
  const templatesUrl = buildTemplatesUrl();
  const response = await axios.get(templatesUrl, {
    headers: API_AUTH_HEADERS,
  });
  return extractTemplates(response.data);
}

function buildTemplatesUrl() {
  const explicitUrl = (import.meta.env.VITE_TEMPLATES_API_URL as string | undefined)?.trim();
  if (explicitUrl && !isInsecureHttpUrlOnHttpsPage(explicitUrl)) {
    return ensureTemplatesPath(explicitUrl);
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!baseUrl || isInsecureHttpUrlOnHttpsPage(baseUrl)) {
    return "/api/templates";
  }

  return `${baseUrl.replace(/\/+$/, "")}/templates`;
}

function isInsecureHttpUrlOnHttpsPage(url: string) {
  if (typeof window === "undefined" || window.location.protocol !== "https:") {
    return false;
  }

  return /^http:\/\//i.test(url);
}

function extractTemplates(payload: TemplatesApiResponse): BackendTemplate[] {
  if (Array.isArray(payload)) {
    return normalizeTemplatesArray(payload);
  }

  if (Array.isArray(payload.templates)) {
    return normalizeTemplatesArray(payload.templates);
  }

  if (Array.isArray(payload.data)) {
    return normalizeTemplatesArray(payload.data);
  }

  throw new Error("Unexpected templates response shape.");
}

function normalizeTemplatesArray(templates: unknown[]): BackendTemplate[] {
  if (templates.length === 0) {
    return [];
  }

  const first = templates[0];
  if (isTemplateEnvelope(first)) {
    return (templates as BackendTemplateEnvelope[]).map((item) => item.template);
  }

  return templates as BackendTemplate[];
}

function isTemplateEnvelope(value: unknown): value is BackendTemplateEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "template" in value;
}

function ensureTemplatesPath(url: string) {
  const normalized = url.replace(/\/+$/, "");
  const templatesSuffix = "/templates";

  try {
    const parsed = new URL(normalized);
    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = templatesSuffix;
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return normalized.endsWith(templatesSuffix)
      ? normalized
      : `${normalized}${templatesSuffix}`;
  }
}
