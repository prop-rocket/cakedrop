import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getDaysUntilBirthday(dob: Date | string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  const nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDeliveryDate(birthday: Date): Date {
  const deliveryDate = new Date(birthday);
  const day = deliveryDate.getDay();

  // If Saturday (6), deliver Friday
  if (day === 6) {
    deliveryDate.setDate(deliveryDate.getDate() - 1);
  }
  // If Sunday (0), deliver preceding Friday
  else if (day === 0) {
    deliveryDate.setDate(deliveryDate.getDate() - 2);
  }

  return deliveryDate;
}
