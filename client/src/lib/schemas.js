import { z } from 'zod';

/** Form schemas. They mirror the server's express-validator rules so users see the same messages. */

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z.object({
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/, 'Username must be 3-20 letters, numbers or underscores'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\+?\d{10,15}$/.test(v), 'Phone must be 10-15 digits'),
  password: z
    .string()
    .min(8, 'Password must be 8-72 characters')
    .max(72, 'Password must be 8-72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number'),
});

export const tradeSchema = z.object({
  side: z.enum(['BUY', 'SELL']),
  quantity: z.coerce
    .number({ message: 'Enter a quantity' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(1_000_000, 'Quantity is too large'),
});

export const simulationSchema = z.object({
  symbol: z.string().trim().min(1, 'Pick a stock'),
  amount: z.coerce.number({ message: 'Enter an amount' }).min(1000, 'Minimum is 1,000').max(1e9, 'Maximum is 1,000,000,000'),
  horizonDays: z.coerce.number().int().min(5, 'At least 5 trading days').max(756, 'At most 756 trading days (3 years)'),
  paths: z.coerce.number().int().min(100, 'At least 100 paths').max(10_000, 'At most 10,000 paths'),
  lookback: z.enum(['1y', '2y']),
});
