import { SubscriptionPlan, SubscriptionStatus, CakePreference, DeliveryWindow, OrderStatus, UserRole } from "@prisma/client";

export type { SubscriptionPlan, SubscriptionStatus, CakePreference, DeliveryWindow, OrderStatus, UserRole };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
}

export interface UpcomingBirthday {
  id: string;
  name: string;
  dateOfBirth: string;
  daysUntil: number;
  branchName: string;
  cakePreference: CakePreference;
}

export interface DashboardStats {
  totalEmployees: number;
  upcomingBirthdays: number;
  deliveredThisMonth: number;
  monthlySpend: number;
}

export interface CSVEmployee {
  name: string;
  email: string;
  dob: string;
  branch: string;
  cake_preference: string;
}

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}
