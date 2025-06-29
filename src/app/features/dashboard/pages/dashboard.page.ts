import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Expense } from '../../../core/services/expense';
import {
  Expense as ExpenseInterface,
  ExpenseSummary,
} from '../../../core/models/expense.model';
import { Auth } from '../../../core/services/auth';
import { Header } from '../components/header/header';
import { BottomNav } from '../components/bottom-nav/bottom-nav';
import { ExpensesList } from '../components/expenses-list/expenses-list';
import { BalanceCards } from '../components/balance-cards/balance-cards';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';
import { Currency } from '../../../core/services/currency';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [Header, BottomNav, ExpensesList, BalanceCards],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  expenses: ExpenseInterface[] = [];
  summary: ExpenseSummary | null = null;
  filteredExpenses: ExpenseInterface[] = [];
  loading = false;
  hasMoreExpenses = true;
  currentPage = 1;
  itemsPerPage = 10;
  
  private filterSubject = new BehaviorSubject<string>('This Month');
  currentFilter = this.filterSubject.value;

  totalBalance = 0;
  totalIncome = 0;
  totalExpenses = 0;

  currentTime = '';
  displayName = '';
  username = '';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private expenseService: Expense,
    private authService: Auth,
    private currencyService: Currency
  ) {
    this.setupFilterSubscription();
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.updateTime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sets up subscription to filter changes and handles expense data loading
   * Converts expenses to USD and applies filtering
   */
private setupFilterSubscription(): void {
  this.filterSubject
    .pipe(
      takeUntil(this.destroy$),
      switchMap(filter => {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.loading = true;
        const { startDate, endDate } = this.getDateRange();

        return this.expenseService.getExpenses({ startDate, endDate });
      })
    )
    .subscribe({
      next: (convertedExpenses) => {
        this.expenses = convertedExpenses;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.expenses = [];
        this.filteredExpenses = [];
        this.loading = false;
      },
    });
}

  /**
   * Loads user information from the auth service
   * Sets username and display name based on the email
   */
  loadUserInfo(): void {
    const fullEmail = this.authService.getUsername();

    if (fullEmail) {
      this.username = fullEmail;
      this.displayName = this.extractDisplayName(fullEmail);
    } else {
      this.username = 'User';
      this.displayName = 'User';
    }
  }

  /**
   * Extracts a display name from an email address
   * Handles different email formats with dots, underscores, or hyphens
   * @param email The email address to extract the display name from
   * @returns Formatted display name
   */
  private extractDisplayName(email: string): string {
    if (!email || !email.includes('@')) {
      return email || 'User';
    }

    const namePart = email.split('@')[0];

    if (namePart.includes('.')) {
      return namePart
        .split('.')
        .map((part) => this.capitalizeFirstLetter(part))
        .join(' ');
    } else if (namePart.includes('_')) {
      return namePart
        .split('_')
        .map((part) => this.capitalizeFirstLetter(part))
        .join(' ');
    } else if (namePart.includes('-')) {
      return namePart
        .split('-')
        .map((part) => this.capitalizeFirstLetter(part))
        .join(' ');
    } else {
      return this.capitalizeFirstLetter(namePart);
    }
  }

  /**
   * Capitalizes the first letter of a string
   * @param str String to capitalize
   * @returns Capitalized string
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Updates the current time display
   * Sets up an interval to update time every minute
   */
  updateTime(): void {
    this.currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }, 60000);
  }

  /**
   * Calculates date range based on current filter
   * @returns Object containing start and end dates
   */
  private getDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (this.currentFilter) {
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Last 7 Days':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'All':
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }

  /**
   * Applies the current filter to expenses and updates totals
   * Handles pagination and updates filtered expenses list
   */
  applyFilter(): void {
    const now = new Date();
    let filtered: ExpenseInterface[] = [];

    switch (this.currentFilter) {
      case 'This Month':
        filtered = this.expenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        });
        break;
      case 'Last 7 Days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        filtered = this.expenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= sevenDaysAgo && expenseDate <= now;
        });
        break;
      case 'All':
        filtered = [...this.expenses];
        break;
      default:
        filtered = [...this.expenses];
    }

    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;
    this.filteredExpenses = filtered.slice(startIndex, endIndex);
    this.hasMoreExpenses = this.filteredExpenses.length < filtered.length;

    if (this.summary) {
      this.totalExpenses = this.summary.totalExpenses;
      this.totalIncome = this.summary.totalIncome;
      this.totalBalance = this.summary.balance;
    } else {
      this.updateTotals(filtered);
    }
  }

  /**
   * Updates total expenses, income, and balance based on filtered expenses
   * @param expenses Array of filtered expenses to calculate totals from
   */
  private updateTotals(expenses: ExpenseInterface[]): void {
    this.totalExpenses = expenses.reduce(
      (sum, expense) => sum + (expense.convertedAmount || expense.amount),
      0
    );

    const incomeExpenses = expenses.filter(
      (expense) => (expense.convertedAmount || expense.amount) < 0
    );
    this.totalIncome = Math.abs(
      incomeExpenses.reduce(
        (sum, expense) => sum + (expense.convertedAmount || expense.amount),
        0
      )
    );

    this.totalBalance = this.totalIncome - this.totalExpenses;
  }

  /**
   * Loads more expenses by incrementing the current page
   * and applying the filter again
   */
  loadMoreExpenses(): void {
    this.currentPage++;
    this.applyFilter();
  }

  /**
   * Changes the current filter and triggers data reload
   * @param filter New filter to apply
   */
  changeFilter(filter: string): void {
    this.filterSubject.next(filter);
  }

  /**
   * Navigates to the add expense page
   */
  navigateToAddExpense(): void {
    this.router.navigate(['/add-expense']);
  }

  /**
   * Handles user logout with confirmation
   */
  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
