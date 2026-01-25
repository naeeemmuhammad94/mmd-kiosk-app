/**
 * Kiosk Store
 * State management for kiosk attendance
 */

import { create } from 'zustand';
import type {
  KioskSettings,
  AttendanceContact,
  ProgramAttendance,
  Program,
} from '@/types/attendance';

interface KioskState {
  // Settings
  settings: KioskSettings | null;
  isSettingsLoading: boolean;
  isSettingsModalOpen: boolean;

  // Attendance data
  attendanceData: ProgramAttendance[];
  isAttendanceLoading: boolean;

  // Programs
  programs: Program[];
  selectedProgram: string | null;

  // Search
  searchQuery: string;

  // Selected student for attendance
  selectedStudent: AttendanceContact | null;
  isAttendanceModalOpen: boolean;
  isConfirmModalOpen: boolean;
  lastAttendanceResult: { success: boolean; present: boolean } | null;

  // PIN modal
  isPinModalOpen: boolean;
  pinPurpose: 'settings' | 'logout' | null;

  // Confirm modal type
  confirmType: 'checkIn' | 'checkOut' | null;

  // Actions
  setSettings: (settings: KioskSettings | null) => void;
  setSettingsLoading: (loading: boolean) => void;
  toggleSettingsModal: () => void;

  setAttendanceData: (data: ProgramAttendance[]) => void;
  setAttendanceLoading: (loading: boolean) => void;

  setPrograms: (programs: Program[]) => void;
  setSelectedProgram: (programId: string | null) => void;

  setSearchQuery: (query: string) => void;

  setSelectedStudent: (student: AttendanceContact | null) => void;
  toggleAttendanceModal: () => void;
  toggleConfirmModal: () => void;
  setLastAttendanceResult: (result: { success: boolean; present: boolean } | null) => void;
  setConfirmType: (type: 'checkIn' | 'checkOut' | null) => void;
  closeAllModals: () => void;

  openPinModal: (purpose: 'settings' | 'logout') => void;
  closePinModal: () => void;

  reset: () => void;
}

const initialState = {
  settings: null,
  isSettingsLoading: false,
  isSettingsModalOpen: false,
  attendanceData: [],
  isAttendanceLoading: false,
  programs: [],
  selectedProgram: null,
  searchQuery: '',
  selectedStudent: null,
  isAttendanceModalOpen: false,
  isConfirmModalOpen: false,
  lastAttendanceResult: null,
  isPinModalOpen: false,
  pinPurpose: null,
  confirmType: null,
};

export const useKioskStore = create<KioskState>(set => ({
  ...initialState,

  setSettings: settings => {
    let newSettings = settings;
    if (settings) {
      // Fix API mismatch: API returns allowContact but app uses allowNonMembers
      if (settings.allowContact !== undefined && settings.allowNonMembers === undefined) {
        // Clone to avoid mutating the original object (e.g. from React Query cache)
        newSettings = { ...settings, allowNonMembers: settings.allowContact };
      }
    }
    set({ settings: newSettings });
  },
  setSettingsLoading: loading => set({ isSettingsLoading: loading }),
  toggleSettingsModal: () => set(state => ({ isSettingsModalOpen: !state.isSettingsModalOpen })),

  setAttendanceData: data => set({ attendanceData: data }),
  setAttendanceLoading: loading => set({ isAttendanceLoading: loading }),

  setPrograms: programs => set({ programs }),
  setSelectedProgram: programId => set({ selectedProgram: programId }),

  setSearchQuery: query => set({ searchQuery: query }),

  setSelectedStudent: student => set({ selectedStudent: student }),
  toggleAttendanceModal: () =>
    set(state => ({ isAttendanceModalOpen: !state.isAttendanceModalOpen })),
  toggleConfirmModal: () => set(state => ({ isConfirmModalOpen: !state.isConfirmModalOpen })),
  setLastAttendanceResult: result => set({ lastAttendanceResult: result }),
  setConfirmType: type => set({ confirmType: type }),
  closeAllModals: () =>
    set({
      isAttendanceModalOpen: false,
      isConfirmModalOpen: false,
      selectedStudent: null,
      confirmType: null,
    }),

  openPinModal: purpose => set({ isPinModalOpen: true, pinPurpose: purpose }),
  closePinModal: () => set({ isPinModalOpen: false, pinPurpose: null }),

  reset: () => set(initialState),
}));
