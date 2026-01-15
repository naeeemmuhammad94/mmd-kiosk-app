/**
 * Login Validation Schema
 */

import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .max(50, 'Email is too long'),
    password: z
        .string()
        .min(1, 'Password is required')
        .max(50, 'Password is too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export default loginSchema;
