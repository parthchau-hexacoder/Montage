import { makeAutoObservable } from "mobx";
import type {
  SidebarTab,
  SidebarViewMode,
} from "../../ui/workspace/layout/sidebar/types";

type ZoomDirection = "in" | "out";

export type ZoomCommand = {
  id: number;
  direction: ZoomDirection;
} | null;

export class WorkspaceUiController {
  viewMode: "2d" | "3d" = "2d";
  activeSidebarTab: SidebarTab = "modules";
  private zoomSequence = 0;
  zoomCommand: ZoomCommand = null;
  private sidebarViewModeByTab: Record<SidebarTab, SidebarViewMode> = {
    design: "grid",
    modules: "grid",
    templates: "grid",
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get designViewMode() {
    return this.sidebarViewModeByTab.design;
  }

  get modulesViewMode() {
    return this.sidebarViewModeByTab.modules;
  }

  get templatesViewMode() {
    return this.sidebarViewModeByTab.templates;
  }

  setViewMode(mode: "2d" | "3d") {
    this.viewMode = mode;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === "2d" ? "3d" : "2d";
  }

  issueZoom(direction: ZoomDirection) {
    this.zoomSequence += 1;
    this.zoomCommand = { id: this.zoomSequence, direction };
  }

  setActiveSidebarTab(tab: SidebarTab) {
    this.activeSidebarTab = tab;
  }

  openModulesTab() {
    this.activeSidebarTab = "modules";
  }

  setDesignViewMode(mode: SidebarViewMode) {
    this.sidebarViewModeByTab.design = mode;
  }

  setModulesViewMode(mode: SidebarViewMode) {
    this.sidebarViewModeByTab.modules = mode;
  }

  setTemplatesViewMode(mode: SidebarViewMode) {
    this.sidebarViewModeByTab.templates = mode;
  }
}
