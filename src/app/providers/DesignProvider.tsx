import React, { createContext, useContext, useEffect } from "react";
import { DesignController } from "../controllers/DesignController";

const controller = new DesignController();

const DesignContext = createContext(controller);

export const DesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    void controller.loadModulesFromBackend();
  }, []);

  return (
    <DesignContext.Provider value={controller}>
      {children}
    </DesignContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDesign = () => useContext(DesignContext);
