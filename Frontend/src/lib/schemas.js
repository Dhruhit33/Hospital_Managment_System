import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Email / username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must not exceed 50 characters')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must not exceed 64 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
      .regex(/\d/, 'Must contain at least 1 digit')
      .regex(/[@$!%*?&]/, 'Must contain at least 1 special character (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    otp: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
