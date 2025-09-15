
export enum Category {
  Food = 'Food',
  Transport = 'Transport',
  Entertainment = 'Entertainment',
  Shopping = 'Shopping',
  BillPayments = 'Bill Payments',
  Other = 'Other',
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: string; // ISO 8601 format
  merchant: string;
  notes: string;
  receiptImage?: string; // base64 encoded image
  utr?: string; // Unique Transaction Reference
  paymentMethod?: string; // e.g., Google Pay, Credit Card
}

export interface Suggestion {
  title: string;
  description: string;
  category?: Category;
}

export type Theme = 'light' | 'dark' | 'system';

export enum AppTab {
    Dashboard = 'dashboard',
    AddExpense = 'add',
    History = 'history',
    Calendar = 'calendar',
    Reports = 'reports',
}

// --- Types for Advanced AI Reports ---

export interface SpendingChange {
  category: Category;
  currentAmount: number;
  previousAmount: number;
  changePercentage: number;
}

export interface RecurringExpense {
  merchant: string;
  amount: number;
  description: string;
}

export interface SpendingAnomaly {
  description: string;
  amount: number;
  date: string;
}

export interface AIReport {
  spendingChanges: SpendingChange[];
  recurringExpenses: RecurringExpense[];
  anomalies: SpendingAnomaly[];
  summary: string;
}
