import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SellerService } from '../../../services/seller.service';

@Component({
  selector: 'app-seller-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SellerSettingsComponent implements OnInit {
  sidebarCollapsed = false;

  sellerId: string | null = null;
  sellerDisplayName = 'Seller';
  sellerRoleLabel = 'Marketplace Seller';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/seller-dashboard' },
    { icon: 'add', label: 'Add Product', route: '/seller/add-product' },
    { icon: 'products', label: 'My Products', route: '/seller/products' },
    { icon: 'shop', label: 'My Shop Profile', route: '/seller/shop' },
    { icon: 'orders', label: 'Orders', route: '/seller/orders' },
    { icon: 'chat', label: 'Messages', disabled: true },
    { icon: 'bell', label: 'Alerts', route: '/seller/alerts' },
    { icon: 'settings', label: 'Settings', active: true, route: '/seller/settings' }
  ];

  constructor(private router: Router, private sellerService: SellerService) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.sellerId = localStorage.getItem('sellerId');
      this.sellerDisplayName = localStorage.getItem('sellerName') || 'Seller';
      if (!this.sellerId) {
        this.router.navigate(['/seller-login']);
      }
    }
  }

  get initials(): string {
    if (!this.sellerDisplayName) return 'S';
    const parts = this.sellerDisplayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  handleMenuSelect(item: any): void {
    if (item.disabled) return;
    this.router.navigate([item.route]);
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerId');
      localStorage.removeItem('sellerName');
      localStorage.removeItem('sellerCode');
    }
    this.router.navigate(['/seller-login']);
  }

  changePassword(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all password fields.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New passwords do not match.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    if (!this.sellerId) return;

    this.isSubmitting = true;
    this.sellerService.changePassword(this.sellerId, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.successMessage = 'Password updated successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update password.';
        this.isSubmitting = false;
      }
    });
  }
}
