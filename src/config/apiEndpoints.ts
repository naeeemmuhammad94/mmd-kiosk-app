/**
 * API Endpoints configuration
 * Ported from dojo-crm-frontend/src/config/apiUrls.ts
 */

export enum ApiEndpoints {
    // Auth endpoints
    Login = '/user/login',
    Logout = '/user/logout',
    CurrentUser = '/user/current-user',
    SendEmailToResetPassword = '/user/send-email-to-reset-password',

    // Kiosk-specific endpoints
    GetKioskSettingsByDojo = '/attendance-setting/getByDojo',
    UpdateKioskSettings = '/attendance-setting',
    ConfirmKioskPin = '/attendance-setting/confirmPin',

    // Attendance endpoints
    GetAttendance = '/attendance',
    MarkAttendance = '/attendance',

    // Programs
    GetPrograms = '/program-tag-club',
}
