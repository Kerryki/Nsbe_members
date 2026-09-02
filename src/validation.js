import { z } from 'zod';

export const MemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[0-9\-\+\s\(\)]{0,20}$/, 'Invalid phone format').optional().default(''),
  dateJoined: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).default('Active'),
});

export const EventSchema = z.object({
  name: z.string().min(1, 'Event name required').max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: z.string().max(1000).optional().default(''),
});

export function validateMember(data) {
  return MemberSchema.parse(data);
}

export function validateEvent(data) {
  return EventSchema.parse(data);
}
