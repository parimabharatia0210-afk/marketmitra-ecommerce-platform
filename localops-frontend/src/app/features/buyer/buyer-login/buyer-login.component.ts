import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { BuyerService } from '../../../services/buyer.service';

@Component({
  selector: 'app-buyer-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './buyer-login.component.html',
  styleUrls: ['./buyer-login.component.css']
})
export class BuyerLoginComponent {

  loginForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private buyerService: BuyerService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Please enter valid details';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.buyerService.login(this.loginForm.value).subscribe({
      next: (res) => {
        localStorage.setItem('buyerToken', res.token);
        if (res.buyer) {
          localStorage.setItem('buyerId', res.buyer.id);
          localStorage.setItem('buyerEmail', res.buyer.email);
          localStorage.setItem('buyerName', res.buyer.name);
        }
        this.router.navigate(['/buyer-dashboard']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid email or password';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

}
