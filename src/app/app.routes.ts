import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard.page').then(
        (m) => m.DashboardPage
      ),
  },
  {
    path: 'add-expense',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/dashboard/components/expense-form/expense-form').then(
        (m) => m.ExpenseForm
      ),
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
