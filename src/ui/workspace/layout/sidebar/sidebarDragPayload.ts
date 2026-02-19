export const SIDEBAR_DRAG_PAYLOAD_MIME = "application/x-montage-sidebar-item";

export type SidebarDragPayload =
  | {
      kind: "module";
      moduleId: string;
    }
  | {
      kind: "template";
      templateId: string;
    };

export function hasSidebarDragPayload(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.types).includes(SIDEBAR_DRAG_PAYLOAD_MIME);
}

export function setSidebarDragPayload(
  dataTransfer: DataTransfer,
  payload: SidebarDragPayload
) {
  const serialized = JSON.stringify(payload);
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(SIDEBAR_DRAG_PAYLOAD_MIME, serialized);
  dataTransfer.setData("text/plain", serialized);
}

export function getSidebarDragPayload(dataTransfer: DataTransfer) {
  const serialized =
    dataTransfer.getData(SIDEBAR_DRAG_PAYLOAD_MIME) ||
    dataTransfer.getData("text/plain");

  if (!serialized) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    return toSidebarDragPayload(parsed);
  } catch {
    return null;
  }
}

function toSidebarDragPayload(value: unknown): SidebarDragPayload | null {
  if (!isObject(value)) {
    return null;
  }

  if (value.kind === "module" && typeof value.moduleId === "string") {
    return { kind: value.kind, moduleId: value.moduleId };
  }

  if (value.kind === "template" && typeof value.templateId === "string") {
    return { kind: value.kind, templateId: value.templateId };
  }

  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
