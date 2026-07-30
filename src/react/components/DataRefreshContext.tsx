/*
  Purpose:
  Provide a minimal mechanism to trigger re-renders after data mutations.

  Why this exists:
  - Our cache layer stores Promises, not reactive state
  - After a call to forget(), React does not know data has changed
  - This context bridges cache invalidation with React re-rendering

  Design notes:
  - refreshCounter is an opaque counter, not meaningful data
  - Consumers should depend on refreshCounter to re-suspend after invalidation
*/

import { createContext, type ReactNode, useContext, useState } from "react";

/* ************************************************************************ */
/* Context                                                                  */
/* ************************************************************************ */

type DataRefreshContextType = {
  refresh: () => void;
  refreshCounter: number;
};

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(
  undefined,
);

/* ************************************************************************ */
/* Provider                                                                 */
/* ************************************************************************ */

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = () => setRefreshCounter((counter) => counter + 1);

  return (
    <DataRefreshContext.Provider value={{ refresh, refreshCounter }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

/* ************************************************************************ */
/* Hooks                                                                    */
/* ************************************************************************ */

/*
  useRefresh():
  - Returns { refreshCounter, refresh }
  - refreshCounter: include in dependency arrays to re-suspend after mutations
  - refresh: call after forget() to trigger re-render
*/
export function useRefresh() {
  const context = useContext(DataRefreshContext);

  if (context === undefined) {
    throw new Error("useRefresh must be used within a DataRefreshProvider");
  }

  return context;
}
