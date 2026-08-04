import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SellerService } from '../../../services/seller.service';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './seller-orders.component.html',
  styleUrls: ['./seller-orders.component.css']
})
export class SellerOrdersComponent implements OnInit, OnDestroy {
  loading = true;
  orders: any[] = [];
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
    { icon: 'orders', label: 'Orders', active: true, route: '/seller/orders' },
    { icon: 'chat', label: 'Messages', disabled: true },
    { icon: 'bell', label: 'Alerts', route: '/seller/alerts' },
    { icon: 'settings', label: 'Settings', route: '/seller/settings' }
  ];

  private sellerIdFromStorage: string | null = null;
  private ordersSub?: Subscription;

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
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.ordersSub?.unsubscribe();
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

  loadOrders(): void {
    if (!this.sellerIdFromStorage) {
      this.errorMessage = 'Seller session not found. Please log in again.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.ordersSub = this.sellerService.getOrders(this.sellerIdFromStorage).subscribe({
      next: (res: any) => {
        this.orders = res.orders || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Fetch orders failed', err);
        this.errorMessage = 'Failed to load orders.';
        this.loading = false;
      }
    });
  }

  updateOrderStatus(order: any, newStatus: string): void {
    if (!this.sellerIdFromStorage) return;
    this.sellerService.updateOrderStatus(this.sellerIdFromStorage, order._id, newStatus).subscribe({
      next: (res: any) => {
        order.status = res.order.status;
        alert('Order status updated!');
      },
      error: (err: any) => {
        console.error('Update status failed', err);
        alert(err.error?.message || 'Failed to update order status');
      }
    });
  }
}
