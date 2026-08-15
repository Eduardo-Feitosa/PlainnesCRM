import React, { createContext, useContext } from 'react';

const SearchContext = createContext<string>('');

export function SearchProvider({ value, children }: {value: string;children: React.ReactNode;}) {
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useGlobalSearch(): string {
  return useContext(SearchContext);
}