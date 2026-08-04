import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs';

import { SellerService } from '../../../services/seller.service';

@Component({
  selector: 'app-seller-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-register.component.html',
  styleUrls: ['./seller-register.component.css']
})
export class SellerRegisterComponent implements OnDestroy {

  currentStep = 1;

  sellerForm: FormGroup;

  selectedLogo: string | null = null;
  uploadedLogo: File | null = null;

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

  redirectCountdown = 0;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  defaultLogos: { id: string; src: string }[] = [
    // Add your images from assets/shop-logos (e.g. logo1.png, shop2.jpg)
    { id: 'shop1.svg', src: 'assets/shop-logos/shop1.svg' },
    { id: 'shop2.svg', src: 'assets/shop-logos/shop2.svg' },
    { id: 'shop3.svg', src: 'assets/shop-logos/shop3.svg' },
    { id: 'shop4.svg', src: 'assets/shop-logos/shop4.svg' },
    { id: 'shop5.svg', src: 'assets/shop-logos/shop5.svg' },
    { id: 'shop6.svg', src: 'assets/shop-logos/shop6.svg' }
  ];

  constructor(
    private fb: FormBuilder,
    private sellerService: SellerService,
    private router: Router
  ) {
    this.sellerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      shopName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      shopDescription: ['', [Validators.maxLength(500)]],
      otp: ['']
    });

    this.sellerForm.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.emailExistsError = false;
      this.otpSent = false;
      this.otpVerified = false;
      this.sellerForm.get('otp')?.clearValidators();
      this.sellerForm.get('otp')?.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  checkEmailOnBlur() {
    const email = this.sellerForm.get('email')?.value;
    if (!email || this.sellerForm.get('email')?.errors?.['email']) return;

    this.checkingEmail = true;
    this.emailExistsError = false;
    this.sellerService.checkEmailExists(email).subscribe({
      next: (res) => {
        this.checkingEmail = false;
        this.emailExistsError = res.exists;
      },
      error: () => {
        this.checkingEmail = false;
      }
    });
  }

  get isFormComplete(): boolean {
    const hasLogo = !!this.selectedLogo || !!this.uploadedLogo;
    return this.sellerForm.valid && hasLogo && !this.emailExistsError && this.otpVerified;
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.sellerForm.invalid) {
        this.sellerForm.markAllAsTouched();
        return;
      }
      const email = this.sellerForm.get('email')?.value;
      if (email && !this.checkingEmail) {
        this.checkingEmail = true;
        this.emailExistsError = false;
        this.sellerService.checkEmailExists(email).subscribe({
          next: (res) => {
            this.checkingEmail = false;
            this.emailExistsError = res.exists;
            if (!res.exists && this.otpVerified) this.currentStep++;
          },
          error: () => { this.checkingEmail = false; }
        });
        return;
      }
      if (this.emailExistsError) return;
    }
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  sendOtp() {
    const email = this.sellerForm.get('email')?.value;
    if (!email || this.sellerForm.get('email')?.invalid || this.emailExistsError || this.checkingEmail) return;

    this.isSendingOtp = true;
    this.otpError = '';

    this.sellerService.sendOtp(email).subscribe({
      next: () => {
        this.otpSent = true;
        this.isSendingOtp = false;
        this.sellerForm.get('otp')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        this.sellerForm.get('otp')?.updateValueAndValidity();
      },
      error: (err) => {
        this.otpError = err.error?.message || 'Failed to send OTP.';
        this.isSendingOtp = false;
      }
    });
  }

  verifyOtp() {
    const email = this.sellerForm.get('email')?.value;
    const otp = this.sellerForm.get('otp')?.value;
    
    if (!email || !otp || this.sellerForm.get('otp')?.invalid) return;

    this.isVerifyingOtp = true;
    this.otpError = '';

    this.sellerService.verifyOtp(email, otp).subscribe({
      next: () => {
        this.otpVerified = true;
        this.isVerifyingOtp = false;
        this.sellerForm.get('email')?.disable();
        this.sellerForm.get('otp')?.disable();
      },
      error: (err) => {
        this.otpError = err.error?.message || 'Invalid OTP.';
        this.isVerifyingOtp = false;
      }
    });
  }

  selectLogo(logo: string) {
    this.selectedLogo = logo;
    this.uploadedLogo = null;
  }

  onLogoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadedLogo = input.files[0];
      this.selectedLogo = null;
    }
  }

  triggerFileInput() {
    document.getElementById('logo-file-input')?.click();
  }

  getFieldError(fieldName: string): string {
    const ctrl = this.sellerForm.get(fieldName);
    if (!ctrl?.errors || !ctrl.touched) return '';
    const err = ctrl.errors;
    if (err['required']) return 'This field is required';
    if (err['email']) return 'Enter a valid email';
    if (err['minlength']) return `Min ${err['minlength'].requiredLength} characters`;
    if (err['maxlength']) return `Max ${err['maxlength'].requiredLength} characters`;
    if (err['pattern']) {
      if (fieldName === 'contact') return 'Enter valid 10-digit mobile number';
      if (fieldName === 'pincode') return 'Enter valid 6-digit pincode';
    }
    return 'Invalid value';
  }

  onSubmit() {
    if (!this.isFormComplete || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.sellerForm.getRawValue(); // Include disabled fields
    const payload = {
      ...formValue,
      logo: this.uploadedLogo
        ? null
        : (this.selectedLogo ? `assets/shop-logos/${this.selectedLogo}` : undefined)
    };

    const register$ = this.uploadedLogo
      ? this.sellerService.uploadLogo(this.uploadedLogo).pipe(
          switchMap((res) => this.sellerService.register({ ...formValue, logo: res.logo }))
        )
      : this.sellerService.register(payload);

    register$.subscribe({
      next: () => {
        this.showSuccess = true;
        this.isSubmitting = false;
        this.startRedirectCountdown();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.message || 'Registration failed. Please try again.';
      }
    });
  }

  private startRedirectCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }

    this.redirectCountdown = 4;
    this.countdownTimer = setInterval(() => {
      this.redirectCountdown -= 1;
      if (this.redirectCountdown <= 0) {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        this.router.navigate(['/seller-login']);
      }
    }, 1000);
  }
}
