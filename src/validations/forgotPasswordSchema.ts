/**
 * Forgot Password Validation Schema
 * Matches dojo-crm-frontend/src/validations/forgotPassword/index.tsx
 */

import { z } from 'zod';

export const forgotPasswordSchema = z.object({
    userName: z.string().min(1, 'Username is required'),
    email: z
        .string()
        .email('Please enter a valid email address')
        .optional()
        .or(z.literal('')),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default forgotPasswordSchema;
