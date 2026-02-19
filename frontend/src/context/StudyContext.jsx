import React, { createContext, useContext, useState } from "react";

const StudyContext = createContext({
  workspaceId: null,
  resourceId: null,
  viewType: null,
  setWorkspaceId: () => {},
  setResourceId: () => {},
  setViewType: () => {},
});

export function StudyProvider({ children }) {
  const [workspaceId, setWorkspaceId] = useState(
    () => sessionStorage.getItem("workspaceId") || null,
  );
  const [resourceId, setResourceId] = useState(
    () => sessionStorage.getItem("resourceId") || null,
  );
  const [viewType, setViewType] = useState(
    () => sessionStorage.getItem("viewType") || null,
  );

  const handleSetWorkspaceId = (id) => {
    setWorkspaceId(id);
    sessionStorage.setItem("workspaceId", id ?? "");
  };
  const handleSetResourceId = (id) => {
    setResourceId(id);
    sessionStorage.setItem("resourceId", id ?? "");
  };
  const handleSetViewType = (type) => {
    setViewType(type);
    sessionStorage.setItem("viewType", type ?? "");
  };

  return (
    <StudyContext.Provider
      value={{
        workspaceId,
        resourceId,
        viewType,
        setWorkspaceId: handleSetWorkspaceId,
        setResourceId: handleSetResourceId,
        setViewType: handleSetViewType,
      }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext() {
  return useContext(StudyContext);
}

export { StudyContext };
