import { useProgressStore as useProgressStoreGist } from './useProgressStore'; // Original gist implementation
import { useProgressStore as useProgressStoreFirebase } from './useProgressStoreFirebase';
import { create } from 'zustand';

// Flag to control which implementation to use
const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true';

/**
 * Configuration store to manage which implementation to use
 */
export const useStorageConfigStore = create<{
  useFirebase: boolean;
  setUseFirebase: (value: boolean) => void;
}>((set) => ({
  useFirebase: USE_FIREBASE,
  setUseFirebase: (useFirebase) => set({ useFirebase }),
}));

/**
 * This is the main export that your application should use
 * It will automatically use the right implementation based on the configuration
 */
export const useProgressStore = (selector?: any) => {
  const { useFirebase } = useStorageConfigStore();
  
  if (useFirebase) {
    return selector 
      ? useProgressStoreFirebase(selector) 
      : useProgressStoreFirebase();
  } else {
    return selector 
      ? useProgressStoreGist(selector) 
      : useProgressStoreGist();
  }
};

export default useProgressStore;
