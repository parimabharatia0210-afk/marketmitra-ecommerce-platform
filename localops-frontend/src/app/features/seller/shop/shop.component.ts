import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SellerService, SellerRecord } from '../../../services/seller.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit, OnDestroy {
  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  shopForm!: FormGroup;
  sellerId: string | null = null;
  currentSeller: SellerRecord | null = null;
  
  loading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  selectedFile: File | null = null;
  imagePreview: string | null = null;

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
    { icon: 'add', label: 'Add Product', route: '/seller/add-product' },
    { icon: 'products', label: 'My Products', route: '/seller/products' },
    { icon: 'shop', label: 'My Shop Profile', active: true, route: '/seller/shop' },
    { icon: 'orders', label: 'Orders', route: '/seller/orders' },
    { icon: 'chat', label: 'Messages', disabled: true },
    { icon: 'bell', label: 'Alerts', route: '/seller/alerts' },
    { icon: 'settings', label: 'Settings', route: '/seller/settings' }
  ];

  private subs = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private sellerService: SellerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.sellerId = localStorage.getItem('sellerId');
      const storedName = localStorage.getItem('sellerName');
      if (storedName) {
        this.sellerDisplayName = storedName;
      }
    }

    this.shopForm = this.formBuilder.group({
      shopDescription: ['', [Validators.maxLength(500)]]
    });

    this.loadSellerData();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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

  loadSellerData(): void {
    if (!this.sellerId) {
      this.errorMessage = 'Seller session expired. Please log in.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.subs.add(
      this.sellerService.getSellers().subscribe({
        next: (res) => {
          const sellers = res.sellers || [];
          this.currentSeller = sellers.find((s: any) => s._id === this.sellerId || s.id === this.sellerId) || null;
          
          if (this.currentSeller) {
            this.shopForm.patchValue({
              shopDescription: this.currentSeller.shopDescription || ''
            });
            if (this.currentSeller.logo) {
               this.imagePreview = this.getSellerLogoUrl(this.currentSeller.logo);
            }
          } else {
            this.errorMessage = 'Unable to fetch your seller profile.';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Error loading profile data.';
          this.loading = false;
        }
      })
    );
  }

  getSellerLogoUrl(logoPath?: string | null): string | null {
    if (!logoPath) return null;
    if (/^https?:\/\//i.test(logoPath)) return logoPath;
    const normalized = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    return `${this.mediaBaseUrl}${normalized}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Only image files are allowed.';
        return;
      }
      this.selectedFile = file;
      this.errorMessage = '';
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  cancel(): void {
    this.router.navigate(['/seller-dashboard']);
  }

  handleSubmit(): void {
    if (this.shopForm.invalid || !this.sellerId) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    const desc = this.shopForm.get('shopDescription')?.value;
    
    if (desc) formData.append('shopDescription', desc);
    if (this.selectedFile) formData.append('logo', this.selectedFile);

    this.subs.add(
      this.sellerService.updateSellerProfile(this.sellerId, formData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMessage = 'Profile updated successfully!';
          if (res.seller) {
            this.currentSeller = res.seller;
          }
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Failed to update profile.';
          this.isSubmitting = false;
        }
      })
    );
  }
}
