import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

    if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
};
