import { CommonModule } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';

@Component({
  selector: 'app-balance-cards',
  imports: [CommonModule],
  templateUrl: './balance-cards.html',
  styleUrl: './balance-cards.scss'
})
export class BalanceCards {
  totalBalance: InputSignal<number> = input(0);
  totalIncome: InputSignal<number> = input(0);
  totalExpenses: InputSignal<number> = input(0);
}
