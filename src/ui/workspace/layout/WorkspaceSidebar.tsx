import { DesignSidebar } from "./DesignSidebar";
import { ModulesSidebar } from "./ModulesSidebar";
import type { SidebarTab, SidebarViewMode } from "./sidebar/types";

type Props = {
  activeTab: SidebarTab;
  designViewMode: SidebarViewMode;
  modulesViewMode: SidebarViewMode;
  onChangeDesignViewMode: (mode: SidebarViewMode) => void;
  onChangeModulesViewMode: (mode: SidebarViewMode) => void;
  onOpenModulesTab: () => void;
};

export function WorkspaceSidebar({
  activeTab,
  designViewMode,
  modulesViewMode,
  onChangeDesignViewMode,
  onChangeModulesViewMode,
  onOpenModulesTab,
}: Props) {
  if (activeTab === "modules") {
    return (
      <ModulesSidebar
        viewMode={modulesViewMode}
        onChangeViewMode={onChangeModulesViewMode}
      />
    );
  }

  return (
    <DesignSidebar
      viewMode={designViewMode}
      onChangeViewMode={onChangeDesignViewMode}
      onOpenModulesTab={onOpenModulesTab}
    />
  );
}
