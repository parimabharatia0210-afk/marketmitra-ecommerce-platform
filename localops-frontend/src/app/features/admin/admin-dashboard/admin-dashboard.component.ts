import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

type Panel = 'overview' | 'users' | 'sellers' | 'products' | 'orders' | 'settings' | 'add-admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  activePanel: Panel = 'overview';
  adminName = '';
  sidebarCollapsed = false;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  // Stats
  stats: any = {};
  loadingStats = false;

  // Users
  users: any[] = [];
  userSearch = '';
  loadingUsers = false;

  // Sellers
  sellers: any[] = [];
  sellerSearch = '';
  loadingSellers = false;

  // Products
  products: any[] = [];
  productSearch = '';
  loadingProducts = false;

  // Orders
  orders: any[] = [];
  loadingOrders = false;
  orderStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  // Settings
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingPassword = false;
  settingsMsg = '';
  settingsErr = '';

  // Add Admin
  newAdmin = { name: '', email: '', password: '' };
  addingAdmin = false;
  addAdminMsg = '';
  addAdminErr = '';
  otpSent = false;
  otpCode = '';
  verifyingOtp = false;

  // Confirm delete modal
  confirmTarget: any = null;
  confirmAction: string = '';
  confirmLabel: string = '';

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      this.adminName = localStorage.getItem('adminName') || 'Admin';
      if (!token) { this.router.navigate(['/login']); return; }
    }
    this.loadStats();
  }

  setPanel(panel: Panel): void {
    this.activePanel = panel;
    if (panel === 'users' && !this.users.length) this.loadUsers();
    if (panel === 'sellers' && !this.sellers.length) this.loadSellers();
    if (panel === 'products' && !this.products.length) this.loadProducts();
    if (panel === 'orders' && !this.orders.length) this.loadOrders();
  }

  // ─── STATS ──────────────────────────────────────
  loadStats(): void {
    this.loadingStats = true;
    this.adminService.getDashboardStats().subscribe({
      next: (res: any) => { this.stats = res; this.loadingStats = false; },
      error: () => { this.loadingStats = false; this.handleAuthError(); }
    });
  }

  // ─── USERS ──────────────────────────────────────
  loadUsers(): void {
    this.loadingUsers = true;
    this.adminService.getUsers(this.userSearch).subscribe({
      next: (res: any) => { this.users = res.users; this.loadingUsers = false; },
      error: () => { this.loadingUsers = false; }
    });
  }

  deleteUser(user: any): void {
    this.adminService.deleteUser(user._id).subscribe({
      next: () => { this.users = this.users.filter(u => u._id !== user._id); this.toast('User deleted', 'success'); },
      error: () => this.toast('Failed to delete user', 'error')
    });
  }

  toggleBlock(user: any): void {
    this.adminService.toggleBlockUser(user._id).subscribe({
      next: (res: any) => { user.isBlocked = res.isBlocked; this.toast(`User ${user.isBlocked ? 'blocked' : 'unblocked'}`, 'success'); },
      error: () => this.toast('Action failed', 'error')
    });
  }

  // ─── SELLERS ────────────────────────────────────
  loadSellers(): void {
    this.loadingSellers = true;
    this.adminService.getSellers(this.sellerSearch).subscribe({
      next: (res: any) => { this.sellers = res.sellers; this.loadingSellers = false; },
      error: () => { this.loadingSellers = false; }
    });
  }

  toggleApprove(seller: any): void {
    this.adminService.toggleApproveSeller(seller._id).subscribe({
      next: (res: any) => { seller.isApproved = res.isApproved; this.toast(`Seller ${seller.isApproved ? 'approved' : 'rejected'}`, 'success'); },
      error: () => this.toast('Action failed', 'error')
    });
  }

  deleteSeller(seller: any): void {
    this.adminService.deleteSeller(seller._id).subscribe({
      next: () => { this.sellers = this.sellers.filter(s => s._id !== seller._id); this.toast('Seller deleted', 'success'); },
      error: () => this.toast('Failed to delete seller', 'error')
    });
  }

  // ─── PRODUCTS ───────────────────────────────────
  loadProducts(): void {
    this.loadingProducts = true;
    this.adminService.getProducts(this.productSearch).subscribe({
      next: (res: any) => { this.products = res.products; this.loadingProducts = false; },
      error: () => { this.loadingProducts = false; }
    });
  }

  deleteProduct(product: any): void {
    this.adminService.deleteProduct(product._id).subscribe({
      next: () => { this.products = this.products.filter(p => p._id !== product._id); this.toast('Product deleted', 'success'); },
      error: () => this.toast('Failed to delete product', 'error')
    });
  }

  // ─── ORDERS ─────────────────────────────────────
  loadOrders(): void {
    this.loadingOrders = true;
    this.adminService.getOrders().subscribe({
      next: (res: any) => { this.orders = res.orders; this.loadingOrders = false; },
      error: () => { this.loadingOrders = false; }
    });
  }

  updateStatus(order: any, status: string): void {
    this.adminService.updateOrderStatus(order._id, status).subscribe({
      next: () => { order.status = status; this.toast('Status updated', 'success'); },
      error: () => this.toast('Failed to update status', 'error')
    });
  }

  // ─── SETTINGS ───────────────────────────────────
  changePassword(): void {
    this.settingsMsg = ''; this.settingsErr = '';
    if (!this.currentPassword || !this.newPassword) { this.settingsErr = 'Fill in all fields.'; return; }
    if (this.newPassword !== this.confirmPassword) { this.settingsErr = 'New passwords do not match.'; return; }
    if (this.newPassword.length < 6) { this.settingsErr = 'Password must be at least 6 characters.'; return; }
    this.savingPassword = true;
    this.adminService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.settingsMsg = 'Password updated successfully!';
        this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = '';
        this.savingPassword = false;
      },
      error: (err: any) => { this.settingsErr = err.error?.message || 'Failed to update password.'; this.savingPassword = false; }
    });
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.setPanel('add-admin');
  }

  // ─── ADD ADMIN ──────────────────────────────────
  submitAddAdmin(): void {
    this.addAdminMsg = ''; this.addAdminErr = '';

    if (!this.otpSent) {
      if (!this.newAdmin.name || !this.newAdmin.email || !this.newAdmin.password) {
        this.addAdminErr = 'Please fill in all fields.';
        return;
      }
      if (this.newAdmin.password.length < 6) {
        this.addAdminErr = 'Password must be at least 6 characters.';
        return;
      }
      this.addingAdmin = true;
      this.adminService.sendOtp({ email: this.newAdmin.email, role: 'admin' }).subscribe({
        next: () => {
          this.otpSent = true;
          this.addingAdmin = false;
          this.addAdminMsg = 'OTP sent to ' + this.newAdmin.email;
        },
        error: (err: any) => {
          this.addAdminErr = err.error?.message || 'Failed to send OTP.';
          this.addingAdmin = false;
        }
      });
      return;
    }

    if (!this.otpCode) {
      this.addAdminErr = 'Please enter the OTP.';
      return;
    }

    this.verifyingOtp = true;
    this.addingAdmin = true;
    this.adminService.verifyOtp({ email: this.newAdmin.email, code: this.otpCode }).subscribe({
      next: () => {
        this.adminService.addAdmin(this.newAdmin).subscribe({
          next: (res: any) => {
            this.addAdminMsg = res.message || 'Admin added successfully!';
            this.newAdmin = { name: '', email: '', password: '' };
            this.otpCode = '';
            this.otpSent = false;
            this.verifyingOtp = false;
            this.addingAdmin = false;
          },
          error: (err: any) => {
            this.addAdminErr = err.error?.message || 'Failed to add admin.';
            this.verifyingOtp = false;
            this.addingAdmin = false;
          }
        });
      },
      error: (err: any) => {
        this.addAdminErr = err.error?.message || 'Invalid OTP.';
        this.verifyingOtp = false;
        this.addingAdmin = false;
      }
    });
  }

  // ─── HELPERS ────────────────────────────────────
  toast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 3500);
  }

  private handleAuthError(): void {
    this.toast('Session expired. Please login again.', 'error');
    setTimeout(() => this.logout(), 2000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Placed': return 'status-placed';
      case 'Processing': return 'status-processing';
      case 'Shipped': return 'status-shipped';
      case 'Delivered': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  get initials(): string {
    return this.adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
