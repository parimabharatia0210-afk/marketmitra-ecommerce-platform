import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  error = '';
  loading = false;

  constructor(private fb: FormBuilder, private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    const { email, password } = this.loginForm.value;

    this.adminService.login({ email, password }).subscribe({
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