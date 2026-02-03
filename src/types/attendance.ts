/**
 * Attendance & Kiosk Types
 * Ported from dojo-crm-frontend
 */

// Kiosk Settings
export interface KioskSettings {
  _id: string;
  dojoId: string;
  imageLink?: string;
  showStudentImages: boolean;
  powerSavingMode: boolean;
  allowMultipleClasses: boolean;
  allowContact: boolean;
  signInTime: number;
  pin?: string;
  sortByRank?: boolean;
  showAttendanceBar?: boolean;
  newSetting?: boolean;
}

// Student/Contact for attendance
export interface AttendanceContact {
  _id: string;
  contact: string;
  name: string;
  profilePicURL?: string;
  program: string;
  programName: string;
  rank?: string;
  rankName?: string;
  rankColor?: string;
  classSlot?: string;
  totalClasses: number;
  totalPresentCount: number;
  todayPresent: boolean;
  isPresent: boolean;
  accountStatus?: boolean;
}

// Program with contacts
export interface ProgramAttendance {
  id: string;
  name: string;
  contacts: AttendanceContact[];
}

// Program for selection
export interface Program {
  _id: string;
  name: string;
  type: string;
}

// Mark attendance payload
export interface MarkAttendancePayload {
  id: string;
  contact: string;
  rank?: string;
  program: string;
  classSlot?: string;
  date: string;
  present: boolean;
  startTime?: string;
  endTime?: string;
  day?: string;
}

// Confirm PIN payload
export interface ConfirmPinPayload {
  pin: string;
}

// API responses
export interface AttendanceResponse {
  allAttendance: AttendanceContact[];
}

export interface KioskSettingsResponse {
  data: KioskSettings;
}

export interface ProgramsResponse {
  items: Program[];
}
