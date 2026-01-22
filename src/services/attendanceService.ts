/**
 * Attendance Service
 * API calls for kiosk attendance management
 * Ported from dojo-crm-frontend/src/services/attendanceServices.ts
 */

import { axiosInstance } from './axios';
import { ApiEndpoints } from '@/config/apiEndpoints';
import type {
    AttendanceResponse,
    KioskSettings,
    MarkAttendancePayload,
    ConfirmPinPayload,
    ProgramsResponse,
} from '@/types/attendance';

/**
 * Get attendance list for current date
 */
export const getAttendance = async (params: { startingDate: string }) => {
    const response = await axiosInstance.get<{ data: AttendanceResponse }>(
        ApiEndpoints.GetAttendance,
        { params }
    );
    return response.data;
};

/**
 * Get kiosk settings for current dojo
 */
export const getKioskSettingsByDojo = async () => {
    const response = await axiosInstance.get<{ data: KioskSettings }>(
        ApiEndpoints.GetKioskSettingsByDojo
    );
    return response.data;
};

/**
 * Update kiosk settings
 */
export const updateKioskSettings = async (id: string, data: any) => {
    const response = await axiosInstance.put<{ data: KioskSettings }>(
        `${ApiEndpoints.UpdateKioskSettings}/${id}`,
        data
    );
    return response.data;
};

/**
 * Confirm kiosk PIN
 */
export const confirmKioskPin = async (data: ConfirmPinPayload) => {
    const response = await axiosInstance.post<{ success: boolean }>(
        ApiEndpoints.ConfirmKioskPin,
        data
    );
    return response.data;
};

/**
 * Mark attendance (check-in/check-out)
 * Uses PUT method to match CRM kiosk implementation
 */
export const markKioskAttendance = async (id: string, data: MarkAttendancePayload) => {
    const response = await axiosInstance.put<{ data: { present: boolean } }>(
        `${ApiEndpoints.MarkAttendance}/${id}`,
        data
    );
    return response.data;
};

/**
 * Get programs list
 */
export const getPrograms = async (params?: { type?: string }) => {
    const response = await axiosInstance.get<{ data: ProgramsResponse }>(
        ApiEndpoints.GetPrograms,
        { params }
    );
    return response.data;
};

export const attendanceService = {
    getAttendance,
    getKioskSettingsByDojo,
    updateKioskSettings,
    confirmKioskPin,
    markKioskAttendance,
    getPrograms,
};
