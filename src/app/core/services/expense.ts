import { Injectable } from '@angular/core';
import { LocalStorage } from './local-storage';
import { Currency } from './currency';
import {
  catchError,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { Expense as ExpenseInterface } from '../models/expense.model';
@Injectable({
  providedIn: 'root',
})
export class Expense {
  private readonly STORAGE_KEY = 'expense_tracker_expenses';

  constructor(
    private localStorageService: LocalStorage,
    private currencyService: Currency
  ) {}

  /**
   * Get all expenses with optional filtering
   */
  getExpenses(
    filter?: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
    },
    convertToUSD = true
  ): Observable<ExpenseInterface[]> {
    return of(this.getFromLocalStorage()).pipe(
      map((expenses) => this.filterExpenses(expenses, filter)),
      switchMap((expenses) =>
        convertToUSD
          ? this.currencyService.convertExpensesToUSD(expenses)
          : of(expenses)
      )
    );
  }

  /**
   * Get paginated expenses
   */
  getPaginatedExpenses(
    page: number,
    limit: number,
    filter?: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
    }
  ): Observable<{ data: ExpenseInterface[]; total: number }> {
    return this.getExpenses(filter).pipe(
      map((expenses) => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
          data: expenses.slice(start, end),
          total: expenses.length,
        };
      })
    );
  }

  /**
   * Add a new expense with automatic currency conversion
   */
  addExpense(expenseData: {
    category: string;
    amount: number;
    currency: string;
    date: Date;
    merchant?: string;
    receipt?: string;
  }): Observable<ExpenseInterface> {
    const newExpense: Partial<ExpenseInterface> = {
      ...expenseData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.currencyService
      .convertCurrency(expenseData.amount, expenseData.currency, 'USD')
      .pipe(
        map((convertedAmount) => {
          const completeExpense: ExpenseInterface = {
            ...newExpense,
            convertedAmount,
          } as ExpenseInterface;
          return completeExpense;
        }),
        tap((expense) => this.saveExpense(expense)),
        catchError((error) => {
          console.error('Error adding expense:', error);
          return throwError(() => new Error('Failed to add expense'));
        })
      );
  }

  /**
   * Update an existing expense
   */
  updateExpense(
    id: string,
    updates: Partial<ExpenseInterface>
  ): Observable<ExpenseInterface> {
    const expenses = this.getFromLocalStorage();
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) {
      return throwError(() => new Error('Expense not found'));
    }

    const updatedExpense = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date(),
    };

    // Reconvert if amount or currency changed
    if (updates.amount || updates.currency) {
      const amount = updates.amount ?? expenses[index].amount;
      const currency = updates.currency ?? expenses[index].currency;

      return this.currencyService.convertCurrency(amount, currency, 'USD').pipe(
        map((convertedAmount) => {
          updatedExpense.convertedAmount = convertedAmount;
          return updatedExpense;
        }),
        tap((expense) => {
          expenses[index] = expense;
          this.saveAllToLocalStorage(expenses);
        })
      );
    }

    expenses[index] = updatedExpense;
    this.saveAllToLocalStorage(expenses);
    return of(updatedExpense);
  }

  /**
   * Delete an expense
   */
  deleteExpense(id: string): Observable<void> {
    const expenses = this.getFromLocalStorage();
    const filtered = expenses.filter((e) => e.id !== id);

    if (filtered.length === expenses.length) {
      return throwError(() => new Error('Expense not found'));
    }

    this.saveAllToLocalStorage(filtered);
    return of(undefined);
  }
  /**
   * Get expense summary statistics
   */
  getSummary(filter?: { startDate?: Date; endDate?: Date }): Observable<{
    totalExpenses: number;
    totalIncome: number;
    balance: number;
    byCategory: Array<{ category: string; amount: number }>;
  }> {
    return this.getExpenses(filter).pipe(
      map((expenses) => {
        const totalExpenses = expenses.reduce(
          (sum, e) => sum + e.convertedAmount,
          0
        );

        // In a real app, you would have separate income tracking
        const totalIncome = 0; // Placeholder - implement based on your needs

        const byCategory = expenses.reduce((acc, expense) => {
          const existing = acc.find(
            (item) => item.category === expense.category
          );
          if (existing) {
            existing.amount += expense.convertedAmount;
          } else {
            acc.push({
              category: expense.category,
              amount: expense.convertedAmount,
            });
          }
          return acc;
        }, [] as Array<{ category: string; amount: number }>);

        return {
          totalExpenses,
          totalIncome,
          balance: totalIncome - totalExpenses,
          byCategory,
        };
      })
    );
  }

  // Private helper methods

  private getFromLocalStorage(): ExpenseInterface[] {
    const data =
      this.localStorageService.get<ExpenseInterface[]>(this.STORAGE_KEY) || [];
    // Convert string dates back to Date objects
    return data.map((expense) => ({
      ...expense,
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt),
    }));
  }

  private saveExpense(expense: ExpenseInterface): void {
    const expenses = this.getFromLocalStorage();
    expenses.unshift(expense); // Add new expense at beginning
    this.saveAllToLocalStorage(expenses);
  }

  private saveAllToLocalStorage(expenses: ExpenseInterface[]): void {
    this.localStorageService.set(this.STORAGE_KEY, expenses);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private filterExpenses(
    expenses: ExpenseInterface[],
    filter?: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
    }
  ): ExpenseInterface[] {
    if (!filter) return expenses;

    return expenses.filter((expense) => {
      let matches = true;

      if (filter.startDate) {
        matches = matches && new Date(expense.date) >= filter.startDate;
      }

      if (filter.endDate) {
        matches = matches && new Date(expense.date) <= filter.endDate;
      }

      if (filter.category) {
        matches =
          matches &&
          expense.category.toLowerCase() === filter.category.toLowerCase();
      }

      return matches;
    });
  }
}
