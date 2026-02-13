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

export const useDesign = () => useContext(DesignContext);
