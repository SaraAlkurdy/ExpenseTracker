import { Component, EventEmitter, Output, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  currentTime = input('');
  displayName = input('');
  currentFilter = input('This Month');
  
  @Output() logout = new EventEmitter<void>();
  @Output() filterChanged = new EventEmitter<string>();

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  onLogout(): void {
    this.logout.emit();
  }

   onFilterChange(filter: string): void {
    this.filterChanged.emit(filter);
  }
}
