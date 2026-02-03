import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocalSettingsState {
  showAttendanceBar: boolean;
  setShowAttendanceBar: (show: boolean) => void;
  // Add other local-only settings here if needed
}

export const useLocalSettingsStore = create<LocalSettingsState>()(
  persist(
    set => ({
      showAttendanceBar: false, // Default to false as per current behavior
      setShowAttendanceBar: show => set({ showAttendanceBar: show }),
    }),
    {
      name: 'kiosk-local-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
