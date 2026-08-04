import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SellerService } from '../../../services/seller.service';

@Component({
  selector: 'app-seller-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './seller-alerts.component.html',
  styleUrls: ['./seller-alerts.component.css']
})
export class SellerAlertsComponent implements OnInit, OnDestroy {
  loading = true;
  alerts: any[] = [];
  errorMessage = '';

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
    { icon: 'shop', label: 'My Shop Profile', route: '/seller/shop' },
    { icon: 'orders', label: 'Orders', route: '/seller/orders' },
    { icon: 'chat', label: 'Messages', disabled: true },
    { icon: 'bell', label: 'Alerts', active: true, route: '/seller/alerts' },
    { icon: 'settings', label: 'Settings', route: '/seller/settings' }
  ];

  private sellerIdFromStorage: string | null = null;
  private alertsSub?: Subscription;

  constructor(
    private readonly sellerService: SellerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.sellerIdFromStorage = localStorage.getItem('sellerId');
      const storedName = localStorage.getItem('sellerName');
      if (storedName) {
        this.sellerDisplayName = storedName;
      }
    }
    this.loadAlerts();
  }

  ngOnDestroy(): void {
    this.alertsSub?.unsubscribe();
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

  loadAlerts(): void {
    if (!this.sellerIdFromStorage) {
      this.errorMessage = 'Seller session not found. Please log in again.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.alertsSub = this.sellerService.getNotifications(this.sellerIdFromStorage).subscribe({
      next: (res: any) => {
        this.alerts = res.notifications || [];
        this.loading = false;
        this.markAlertsRead(); // Mark as read once they load them
      },
      error: (err: any) => {
        console.error('Fetch alerts failed', err);
        this.errorMessage = 'Failed to load alerts.';
        this.loading = false;
      }
    });
  }

  markAlertsRead(): void {
    if (!this.sellerIdFromStorage) return;
    const hasUnread = this.alerts.some(a => !a.read);
    if (hasUnread) {
      this.sellerService.markNotificationsRead(this.sellerIdFromStorage).subscribe({
        next: () => {
          this.alerts.forEach(a => a.read = true);
        },
        error: (err: any) => console.error('Failed to mark read', err)
      });
    }
  }
}
