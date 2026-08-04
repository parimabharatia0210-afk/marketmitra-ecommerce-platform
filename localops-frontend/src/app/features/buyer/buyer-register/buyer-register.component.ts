import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { BuyerService } from '../../../services/buyer.service';

@Component({
  selector: 'app-buyer-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './buyer-register.component.html',
  styleUrls: ['./buyer-register.component.css']
})
export class BuyerRegisterComponent {

  buyerForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showSuccess = false;
  emailExistsError = false;
  checkingEmail = false;

  otpSent = false;
  otpVerified = false;
  isSendingOtp = false;
  isVerifyingOtp = false;
  otpError = '';

  constructor(
    private fb: FormBuilder,
    private buyerService: BuyerService,
    private router: Router
  ) {
    this.buyerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      otp: [''] // Added dynamically when OTP is sent
    });

    this.buyerForm.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.emailExistsError = false;
      this.otpSent = false;
      this.otpVerified = false;
      this.buyerForm.get('otp')?.clearValidators();
      this.buyerForm.get('otp')?.updateValueAndValidity();
    });
  }

  getFieldError(field: string): string {
    const c = this.buyerForm.get(field);
    if (!c?.touched || !c.errors) return '';
    if (c.errors['required']) return 'This field is required';
    if (c.errors['email']) return 'Enter a valid email';
    if (c.errors['minlength']) return `Min ${c.errors['minlength'].requiredLength} characters`;
    if (c.errors['pattern']) return 'Enter a valid 10-digit mobile number';
    return '';
  }

  checkEmailOnBlur() {
    const email = this.buyerForm.get('email')?.value;
    if (!email || this.buyerForm.get('email')?.errors?.['email']) return;

    this.checkingEmail = true;
    this.emailExistsError = false;
    this.buyerService.checkEmailExists(email).subscribe({
      next: (res) => {
        this.emailExistsError = res.exists;
        this.checkingEmail = false;
      },
      error: () => {
        this.checkingEmail = false;
      }
    });
  }

  sendOtp() {
    const email = this.buyerForm.get('email')?.value;
    if (!email || this.buyerForm.get('email')?.invalid || this.emailExistsError || this.checkingEmail) return;

    this.isSendingOtp = true;
    this.otpError = '';
    
    this.buyerService.sendOtp(email).subscribe({
      next: () => {
        this.otpSent = true;
        this.isSendingOtp = false;
        this.buyerForm.get('otp')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        this.buyerForm.get('otp')?.updateValueAndValidity();
      },
      error: (err) => {
        this.otpError = err.error?.message || 'Failed to send OTP. Please try again.';
        this.isSendingOtp = false;
      }
    });
  }

  verifyOtp() {
    const email = this.buyerForm.get('email')?.value;
    const otp = this.buyerForm.get('otp')?.value;
    
    if (!email || !otp || this.buyerForm.get('otp')?.invalid) return;

    this.isVerifyingOtp = true;
    this.otpError = '';

    this.buyerService.verifyOtp(email, otp).subscribe({
      next: () => {
        this.otpVerified = true;
        this.isVerifyingOtp = false;
        this.buyerForm.get('email')?.disable(); // Prevent changing email after verification
        this.buyerForm.get('otp')?.disable();
      },
      error: (err) => {
        this.otpError = err.error?.message || 'Invalid OTP. Please try again.';
        this.isVerifyingOtp = false;
      }
    });
  }

  onSubmit() {
    if (this.buyerForm.invalid) {
      this.buyerForm.markAllAsTouched();
      return;
    }
    if (this.emailExistsError || this.checkingEmail) return;
    
    if (!this.otpVerified) {
      this.otpError = 'Please verify your email with OTP before registering.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.buyerForm.getRawValue(); // use getRawValue to include disabled fields

    this.buyerService.register(formValue).subscribe({
      next: () => {
        this.showSuccess = true;
        setTimeout(() => this.router.navigate(['/buyer-login']), 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

}
