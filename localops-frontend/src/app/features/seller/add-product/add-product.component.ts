import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SellerService } from '../../../services/seller.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {
  productForm: FormGroup;
  images: File[] = [];
  previews: string[] = [];
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  submissionAttempted = false;
  readonly maxImages = 6;

  sidebarCollapsed = false;

  get initials(): string {
    if (!this.sellerDisplayName) return 'S';
    const parts = this.sellerDisplayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  sellerDisplayName = 'Seller';
  sellerRoleLabel = 'Marketplace Seller';

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/seller-dashboard' },
    { icon: 'add', label: 'Add Product', active: true, route: '/seller/add-product' },
    { icon: 'products', label: 'My Products', route: '/seller/products' },
    { icon: 'shop', label: 'My Shop Profile', route: '/seller/shop' },
    { icon: 'orders', label: 'Orders', route: '/seller/orders' },
    { icon: 'chat', label: 'Messages', disabled: true },
    { icon: 'bell', label: 'Alerts', route: '/seller/alerts' },
    { icon: 'settings', label: 'Settings', route: '/seller/settings' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly sellerService: SellerService,
    private readonly router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      price: [null, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(90)]],
      minPurchase: [1, [Validators.min(1)]],
      buyInMultiples: [1, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('sellerName');
      if (storedName) {
        this.sellerDisplayName = storedName;
      }
    }
  }

  handleMenuSelect(item: any): void {
    if (item.disabled) return;
    if (item.route) this.router.navigate([item.route]);
  }

  handleLogout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerId');
      localStorage.removeItem('sellerName');
      localStorage.removeItem('sellerCode');
    }
    this.router.navigate(['/seller-login']);
  }

  get finalPrice(): number {
    const price = Number(this.productForm.get('price')?.value || 0);
    const discount = Number(this.productForm.get('discountPercentage')?.value || 0);
    const computed = price - (price * discount) / 100;
    return Number.isNaN(computed) ? 0 : Math.max(0, Number(computed.toFixed(2)));
  }

  get hasImages(): boolean {
    return this.images.length > 0;
  }

  get canPublish(): boolean {
    return this.productForm.valid && this.hasImages && !this.isSubmitting;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.clearMessages();
    const selectedFiles = Array.from(input.files);

    for (const file of selectedFiles) {
      if (this.images.length >= this.maxImages) {
        this.errorMessage = `You can upload up to ${this.maxImages} images.`;
        break;
      }
      this.images.push(file);
      const reader = new FileReader();
      reader.onload = () => this.previews.push(String(reader.result));
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeImage(index: number): void {
    this.images.splice(index, 1);
    this.previews.splice(index, 1);
  }

  handleSubmit(): void {
    this.submissionAttempted = true;

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    if (!this.hasImages) {
      this.errorMessage = 'Please upload at least one product image.';
      return;
    }

    const sellerCode = localStorage.getItem('sellerCode');
    const sellerId = localStorage.getItem('sellerId');
    if (!sellerCode && !sellerId) {
      this.errorMessage = 'Missing seller identity. Please log in again.';
      return;
    }

    const formData = new FormData();
    Object.entries(this.productForm.value).forEach(([key, value]) => {
      if (value !== null && typeof value !== 'undefined') {
        formData.append(key, String(value));
      }
    });
    if (sellerCode) formData.append('sellerCode', sellerCode);
    if (sellerId) formData.append('sellerId', sellerId);
    this.images.forEach((image) => formData.append('images', image));

    this.isSubmitting = true;
    this.clearMessages();

    this.sellerService.addProduct(formData).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Product listed successfully.';
        this.productForm.reset({
          discountPercentage: 0,
          minPurchase: 1,
          buyInMultiples: 1
        });
        this.images = [];
        this.previews = [];
        this.submissionAttempted = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to create product. Please try again.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancel(): void {
    this.router.navigate(['/seller-dashboard']);
  }
}
