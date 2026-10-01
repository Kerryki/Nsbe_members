import { z } from 'zod';

export const MemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  studentId: z.string().min(1, 'Student ID is required').max(50),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[0-9\-\+\s\(\)]{0,20}$/, 'Invalid phone format').optional().default(''),
  major: z.string().min(1, 'Major is required').max(255),
  dateJoined: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).default('Active'),
});

export const MemberUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  studentId: z.string().min(1, 'Student ID is required').max(50).optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[0-9\-\+\s\(\)]{0,20}$/, 'Invalid phone format').optional(),
  major: z.string().min(1, 'Major is required').max(255).optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional(),
});

export const EventSchema = z.object({
  name: z.string().min(1, 'Event name required').max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: z.string().max(1000).optional().default(''),
});

export const AttendanceSchema = z.object({
  email: z.string().email('Invalid email'),
  eventName: z.string().min(1, 'Event name required').max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  attended: z.boolean().default(false),
});

export function validateMember(data) {
  return MemberSchema.parse(data);
}

export function validateMemberUpdate(data) {
  return MemberUpdateSchema.parse(data);
}

export function validateEvent(data) {
  return EventSchema.parse(data);
}

export function validateAttendance(data) {
  return AttendanceSchema.parse(data);
}
