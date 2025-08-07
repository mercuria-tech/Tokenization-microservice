import { PrismaClient, UserStatus } from '../generated/prisma';

export type UserRole = 'admin' | 'issuer' | 'investor' | 'auditor';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  roles: UserRole[];
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const prisma = new PrismaClient();
