import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Currency } from '../../../../core/services/currency';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Expense } from '../../../../core/services/expense';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.html',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  styleUrls: ['./expense-form.scss'],
})
export class ExpenseForm implements OnInit {
  currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
  categories = [
    { value: 'Groceries', icon: 'shopping_cart' },
    { value: 'Entertainment', icon: 'sports_esports' },
    { value: 'Transportation', icon: 'directions_car' },
    { value: 'Rent', icon: 'home' },
    { value: 'Dining', icon: 'restaurant' },
  ];

  form!: FormGroup;
  receiptPreview: string | null = null;
  isLoading = false;
  loadingCurrencies = false;

  constructor(
    private expenseService: Expense,
    private router: Router,
    private fb: FormBuilder,
    private currencyService: Currency,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.loadingCurrencies = true;
    this.currencyService.getCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
        this.loadingCurrencies = false;
      },
      error: () => {
        this.snackBar.open(
          'Failed to load currencies. Using default set.',
          'Close',
          { duration: 3000 }
        );
        this.loadingCurrencies = false;
      },
    });
  }

  initializeForm(): void {
    this.form = this.fb.group({
      category: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currency: ['USD', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      merchant: [''],
      notes: [''],
      receipt: [null],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.receiptPreview = reader.result as string;
        this.form.patchValue({ receipt: file });
      };
      reader.readAsDataURL(file);
    }
  }

  removeReceipt(): void {
    this.receiptPreview = null;
    this.form.patchValue({ receipt: null });
    const fileInput = document.getElementById('receipt') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.form.value;

    if (formValue.currency === 'USD') {
      this.saveExpense(formValue, formValue.amount);
      return;
    }

    this.currencyService
      .convertCurrency(formValue.amount, formValue.currency, 'USD')
      .subscribe({
        next: (convertedAmount) => {
          this.saveExpense(formValue, convertedAmount);
        },
        error: () => {
          this.snackBar.open(
            'Currency conversion failed. Using original amount',
            'Close',
            { duration: 5000 }
          );
          this.saveExpense(formValue, formValue.amount);
        },
      });
  }

  private saveExpense(formValue: any, convertedAmount: number): void {
    const expenseData = {
      ...formValue,
      date: new Date(formValue.date),
      convertedAmount: convertedAmount,
      receipt: this.receiptPreview,
    };

    this.expenseService.addExpense(expenseData).subscribe({
      next: () => {
        this.snackBar.open('Expense saved successfully', 'Close', {
          duration: 2000,
        });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.snackBar.open('Failed to save expense', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
