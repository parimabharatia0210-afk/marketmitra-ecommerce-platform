import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;

  constructor(private adminService: AdminService, private router: Router) {}

  login(): void {
    if (!this.email || !this.password) { this.error = 'Please fill in all fields.'; return; }
    this.loading = true;
    this.error = '';
    this.adminService.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        localStorage.setItem('adminToken', res.token);
        localStorage.setItem('adminName', res.admin?.name || 'Admin');
        this.router.navigate(['/admin']);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Login failed. Check your credentials.';
        this.loading = false;
      }
    });
  }
}
