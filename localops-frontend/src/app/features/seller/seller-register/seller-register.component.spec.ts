import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-seller-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-register.component.html',
  styleUrls: ['./seller-register.component.css']
})
export class SellerRegisterComponent {

  currentStep: number = 1;

  sellerForm: FormGroup;

  selectedLogo: string | null = null;

  uploadedLogo: File | null = null;

  constructor(private fb: FormBuilder) {

    this.sellerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', Validators.required],
      shopName: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', Validators.required],
      password: ['', Validators.required],
      address: ['', Validators.required],
      shopDescription: ['']
    });

  }

  nextStep() {
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  selectLogo(logo: string) {
    this.selectedLogo = logo;
    this.uploadedLogo = null;
  }

  onLogoUpload(event: any) {
    this.uploadedLogo = event.target.files[0];
    this.selectedLogo = null;
  }

  onSubmit() {

    const sellerData = {
      ...this.sellerForm.value,
      logo: this.selectedLogo
    };

    console.log("Seller Data:", sellerData);

    alert("Seller Registered Successfully");

  }

}