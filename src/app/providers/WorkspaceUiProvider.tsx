import React, { createContext, useContext } from "react";
import { WorkspaceUiController } from "../controllers/WorkspaceUiController";

const controller = new WorkspaceUiController();
const WorkspaceUiContext = createContext(controller);

export const WorkspaceUiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <WorkspaceUiContext.Provider value={controller}>
      {children}
    </WorkspaceUiContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspaceUi = () => useContext(WorkspaceUiContext);
