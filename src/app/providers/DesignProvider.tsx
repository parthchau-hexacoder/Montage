import React, { createContext, useContext } from "react";
import { DesignController } from "../controllers/DesignController";

const controller = new DesignController();
controller.initializeDefaults();

const DesignContext = createContext(controller);

export const DesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DesignContext.Provider value={controller}>
      {children}
    </DesignContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDesign = () => useContext(DesignContext);
