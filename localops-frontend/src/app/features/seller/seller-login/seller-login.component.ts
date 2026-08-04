import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SellerService } from '../../../services/seller.service';

@Component({
  selector: 'app-seller-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-login.component.html',
  styleUrls: ['./seller-login.component.css']
})
export class SellerLoginComponent {

  loginForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private sellerService: SellerService,
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
      this.errorMessage = "Please enter valid details";
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.sellerService.login(this.loginForm.value)
      .subscribe({
        next: (res) => {
          localStorage.setItem("sellerToken", res.token);
          if (res.seller?.id) {
            localStorage.setItem("sellerId", res.seller.id);
          }
          if (res.seller?.name) {
            localStorage.setItem("sellerName", res.seller.name);
          }
          if (res.seller?.sellerCode) {
            localStorage.setItem('sellerCode', res.seller.sellerCode);
          }
          this.router.navigate(['/seller-dashboard']);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || "Invalid email or password";
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });

  }

}
