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
import { forkJoin, Subject, switchMap, takeUntil } from 'rxjs';
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
  currentFilter = 'This Month';

  totalBalance = 2548;
  totalIncome = 10840;
  totalExpenses = 1884;

  currentTime = '';
  displayName = '';
  username = '';
  

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private expenseService: Expense,
    private authService: Auth,
    private currencyService: Currency
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.updateTime();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user information
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
   * Extract display name from email
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
   * Capitalize first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  /**
   * Update current time
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
   * Get date range based on current filter
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
   * Load all dashboard data in a single optimized call
   */
  loadDashboardData(): void {
    this.loading = true;
    const { startDate, endDate } = this.getDateRange();

    forkJoin({
      expenses: this.expenseService.getExpenses({ startDate, endDate }),
      summary: this.expenseService.getSummary({ startDate, endDate }),
    })
      .pipe(
        switchMap(({ expenses, summary }) => {
          this.expenses = expenses || [];
          this.summary = summary;

          return this.currencyService.convertExpensesToUSD(this.expenses);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (convertedExpenses) => {
          this.expenses = convertedExpenses;
          this.applyFilter();
          this.updateSummaryTotals();
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
   * Apply current filter to expenses
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

    // Apply pagination
    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;
    this.filteredExpenses = filtered.slice(startIndex, endIndex);
    this.hasMoreExpenses = this.filteredExpenses.length < filtered.length;

    this.updateTotals(filtered);
  }

  /**
   * Update financial totals
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
    if (this.summary) {
      this.totalIncome = this.summary.totalIncome;
    }

    this.totalBalance = this.totalIncome - this.totalExpenses;
  }

  /**
   * Update summary totals from service
   */
  private updateSummaryTotals(): void {
    if (this.summary) {
      this.totalExpenses = this.summary.totalExpenses;
      this.totalIncome = this.summary.totalIncome;
      this.totalBalance = this.summary.balance;
    }
  }

  /**
   * Load more expenses (pagination)
   */
  loadMoreExpenses(): void {
    this.currentPage++;
    this.applyFilter();
  }

  /**
   * Change filter and reload data
   */
  changeFilter(filter: string): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.loadDashboardData();
  }

  /**
   * Navigate to add expense page
   */
  navigateToAddExpense(): void {
    this.router.navigate(['/add-expense']);
  }

  /**
   * Handle logout
   */
  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
