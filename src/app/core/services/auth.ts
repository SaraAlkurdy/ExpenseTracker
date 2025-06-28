import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { LocalStorage } from './local-storage';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private readonly AUTH_KEY = 'auth_token';
  private readonly USERNAME_KEY = 'auth_username';
  private readonly PASSWORD_KEY = 'auth_password';

  constructor(
    private router: Router,
    private localStorage: LocalStorage
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.localStorage.get<string>(this.AUTH_KEY);
    this.isAuthenticatedSubject.next(!!token);
  }

  login(email: string, password: string): Observable<{ success: boolean }> {
    // Mock authentication - replace with actual API call
    const mockToken = 'mock_jwt_token';
    this.localStorage.set(this.AUTH_KEY, mockToken);
    this.localStorage.set(this.USERNAME_KEY, email);
    this.localStorage.set(this.PASSWORD_KEY, password);
    this.isAuthenticatedSubject.next(true);
    return of({ success: true }).pipe(delay(1000));
  }

  logout(): void {
    this.localStorage.remove(this.AUTH_KEY);
    this.localStorage.remove(this.USERNAME_KEY);
    this.localStorage.remove(this.PASSWORD_KEY);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.localStorage.get(this.AUTH_KEY) || this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return this.localStorage.get<string>(this.AUTH_KEY);
  }

  getUsername(): string | null {
    return this.localStorage.get<string>(this.USERNAME_KEY);
  }

  getPassword(): string | null {
    return this.localStorage.get<string>(this.PASSWORD_KEY);
  }
}