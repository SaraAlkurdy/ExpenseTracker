import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Expense } from '../../../../core/models/expense.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { input } from '@angular/core';

@Component({
  selector: 'app-expenses-list',
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './expenses-list.html',
  styleUrl: './expenses-list.scss',
})
export class ExpensesList {
  expenses = input<Expense[]>([]);
  loading = input<boolean>(false);
  hasMoreExpenses = input<boolean>(false);
  currentFilter = input<string>('This Month');

  @Output() loadMore = new EventEmitter<void>();

  onLoadMore(): void {
    this.loadMore.emit();
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      Groceries: 'shopping_cart',
      Entertainment: 'sports_esports',
      Transportation: 'directions_car',
      Rent: 'home',
    };
    return icons[category] || 'receipt';
  }
}
