/**
 * Authentication Service
 * API calls for login, logout, and password reset
 */

import { AxiosError } from 'axios';
import axiosInstance from './axios';
import { ApiEndpoints } from '@/config/apiEndpoints';
import type { ApiResponse, CurrentUser, LoginPayload, ForgotPasswordPayload } from '@/types/auth';

/**
 * Login user with email and password
 */
export async function loginUser(payload: LoginPayload): Promise<ApiResponse<CurrentUser>> {
  try {
    const response = await axiosInstance.post<ApiResponse<CurrentUser>>(
      ApiEndpoints.Login,
      payload
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<null>>;
    throw {
      success: false,
      error: true,
      message: axiosError.response?.data?.message || 'Login failed. Please check your credentials.',
      data: null,
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<CurrentUser>> {
  try {
    const response = await axiosInstance.get<ApiResponse<CurrentUser>>(ApiEndpoints.CurrentUser);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<null>>;
    throw {
      success: false,
      error: true,
      message: axiosError.response?.data?.message || 'Failed to fetch user data.',
      data: null,
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  payload: ForgotPasswordPayload
): Promise<ApiResponse<void>> {
  try {
    const response = await axiosInstance.post<ApiResponse<void>>(
      ApiEndpoints.SendEmailToResetPassword,
      payload
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<null>>;
    throw {
      success: false,
      error: true,
      message: axiosError.response?.data?.message || 'Failed to send password reset email.',
      data: null,
    };
  }
}

/**
 * Logout user (optional server-side logout)
 */
export async function logoutUser(): Promise<void> {
  try {
    await axiosInstance.get(ApiEndpoints.Logout);
  } catch (error) {
    // Silently fail - we'll clear local storage anyway
    // console.error('Logout API call failed:', error);
  }
}

export const authService = {
  loginUser,
  getCurrentUser,
  sendPasswordResetEmail,
  logoutUser,
};

export default authService;
