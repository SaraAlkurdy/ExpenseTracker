export interface Expense {
  id: string;
  category: string;
  amount: number;
  currency: string;
  convertedAmount: number; // Always in USD
  date: Date;
  merchant?: string;
  receipt?: string; // Base64 encoded image or URL
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCreateDto {
  category: string;
  amount: number;
  currency: string;
  date: Date;
  merchant?: string;
  receipt?: string;
}

export interface ExpenseUpdateDto {
  category?: string;
  amount?: number;
  currency?: string;
  date?: Date;
  merchant?: string;
  receipt?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  byCategory: Array<{ category: string; amount: number }>;
}