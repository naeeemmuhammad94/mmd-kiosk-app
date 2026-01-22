/**
 * Auth Types
 * Ported from dojo-crm-frontend/src/types/index.ts and validations/login/index.ts
 */

export interface User {
    _id: string;
    firstName: string;
    lastName?: string;
    email: string;
    country: string;
}

export interface UserRole {
    _id: string;
    role: {
        _id: string;
        name: string;
        isSubRole?: boolean;
    };
}

export interface CurrentUser {
    user: User;
    userRole: UserRole;
    accessToken?: string;
    refreshToken?: string;
}

export interface LoginPayload {
    userName: string;
    password: string;
    rememberMe?: boolean;
}

export interface ForgotPasswordPayload {
    userName: string;
    email?: string;
}

export interface ApiResponse<T> {
    message?: string;
    success: boolean;
    error: boolean;
    errorCode?: string;
    subCode?: string;
    data: T;
}

export interface AuthState {
    user: CurrentUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
}

export interface OnboardingState {
    isOnboardingComplete: boolean;
    notificationPermissionGranted: boolean;
    isInitialized: boolean;
}

export interface OnboardingSlideData {
    id: string;
    title: string;
    description: string;
    imageSource: string;
}

/**
 * PIN State for quick login feature
 */
export interface PinState {
    isPinSet: boolean;
    isPinVerified: boolean;
    showPinModal: boolean;
    pinMode: 'create' | 'verify';
    isPinLoading: boolean;
    pinError: string | null;
}
