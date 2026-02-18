import { observer } from "mobx-react-lite";
import { useWorkspaceUi } from "../../../app/providers/WorkspaceUiProvider";
import { DesignSidebar } from "./DesignSidebar";
import { ModulesSidebar } from "./ModulesSidebar";

export const WorkspaceSidebar = observer(() => {
  const { activeSidebarTab } = useWorkspaceUi();

  if (activeSidebarTab === "modules") {
    return <ModulesSidebar />;
  }

  if (activeSidebarTab === "templates") {
    return <ModulesSidebar catalog="templates" />;
  }

  return <DesignSidebar />;
});
