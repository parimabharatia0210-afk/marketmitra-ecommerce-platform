import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { SellerRecord, SellerService } from '../../../services/seller.service';
import { environment } from '../../../../environments/environment';

type MenuIcon = 'dashboard' | 'add' | 'products' | 'orders' | 'chat' | 'bell' | 'shop' | 'settings';
type StatIcon = 'box' | 'cart' | 'clock' | 'currency';

type QuickActionId = 'add-product' | 'view-sellers' | 'refresh' | 'support';

interface MenuItem {
  label: string;
  icon: MenuIcon;
  active?: boolean;
  route?: string;
  disabled?: boolean;
}

interface StatCard {
  icon: StatIcon;
  title: string;
  value: string;
  subtext: string;
}

interface QuickAction {
  id: QuickActionId;
  icon: MenuIcon | 'chat';
  title: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', active: true, route: '/seller-dashboard' },
    { icon: 'add', label: 'Add Product', route: '/seller/add-product' },
    { icon: 'products', label: 'My Products', route: '/seller/products' },
    { icon: 'shop', label: 'My Shop Profile', route: '/seller/shop' },
    { icon: 'orders', label: 'Orders', route: '/seller/orders' },
    { icon: 'chat', label: 'Messages', disabled: true },
    { icon: 'bell', label: 'Alerts', route: '/seller/alerts' },
    { icon: 'settings', label: 'Settings', route: '/seller/settings' }
  ];

  quickActions: QuickAction[] = [
    { id: 'add-product', icon: 'add', title: 'Add New Product', description: 'Publish a new SKU in minutes.' },
    { id: 'view-sellers', icon: 'products', title: 'View Seller List', description: 'Jump to the latest registrations.' },
    { id: 'refresh', icon: 'bell', title: 'Sync Data', description: 'Fetch the freshest marketplace activity.' },
    { id: 'support', icon: 'chat', title: 'Contact Support', description: 'Ping the MarketMitra success team.' }
  ];

  statsCards: StatCard[] = this.createEmptyStats();

  loading = true;
  errorMessage = '';

  displayedSellers: SellerRecord[] = [];
  private allSellers: SellerRecord[] = [];
  
  currentSeller: SellerRecord | null = null;
  currentSellerLogoUrl: string | null = null;

  sellerDisplayName = 'Seller';
  sellerRoleLabel = 'Marketplace Seller';
  
  sidebarCollapsed = false;

  get initials(): string {
    if (!this.sellerDisplayName) return 'S';
    const parts = this.sellerDisplayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private sellerIdFromStorage: string | null = null;
  private sellerCodeFromStorage: string | null = null;
  private sellersSubscription?: Subscription;

  constructor(
    private readonly sellerService: SellerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.restoreSellerContext();
    this.loadSellerRecords();
    this.setActiveMenu('/seller-dashboard');
  }

  ngOnDestroy(): void {
    this.sellersSubscription?.unsubscribe();
  }

  handleBackToLogin(): void {
    this.router.navigate(['/seller-login']);
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

  handleMenuSelect(item: MenuItem): void {
    if (item.disabled) {
      return;
    }
    if (item.route) {
      this.setActiveMenu(item.route);
      this.router.navigate([item.route]);
    }
  }

  handleAction(action: { id: QuickActionId } | QuickAction): void {
    switch (action.id) {
      case 'add-product':
        this.navigateToRoute('/seller/add-product');
        break;
      case 'view-sellers':
        this.displayedSellers = this.allSellers.slice(0, 10);
        break;
      case 'refresh':
        this.loadSellerRecords();
        break;
      case 'support':
        if (typeof window !== 'undefined') {
          window.open('mailto:support@marketmitra.com?subject=Seller%20dashboard%20help', '_blank');
        }
        break;
      default:
        break;
    }
  }

  handleEditProfile(): void {
    this.router.navigate(['/seller/shop']);
  }

  trackBySeller(index: number, seller: SellerRecord): string {
    return seller._id || seller.id || seller.sellerCode || String(index);
  }

  formatDate(rawDate?: string): string {
    if (!rawDate) {
      return 'N/A';
    }
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(parsed);
  }

  getSellerLogoUrl(logoPath?: string | null): string | null {
    if (!logoPath) {
      return null;
    }
    if (/^https?:\/\//i.test(logoPath)) {
      return logoPath;
    }
    const normalized = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    return `${this.mediaBaseUrl}${normalized}`;
  }

  private restoreSellerContext(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.sellerDisplayName = localStorage.getItem('sellerName') || 'Seller';
    this.sellerIdFromStorage = localStorage.getItem('sellerId');
    this.sellerCodeFromStorage = localStorage.getItem('sellerCode');
  }

  private loadSellerRecords(): void {
    this.loading = true;
    this.errorMessage = '';
    this.sellersSubscription?.unsubscribe();

    this.sellersSubscription = this.sellerService.getSellers().subscribe({
      next: ({ sellers }) => {
        this.allSellers = Array.isArray(sellers) ? sellers : [];
        this.displayedSellers = this.allSellers.slice(0, 8);
        this.pickCurrentSeller();
        this.updateStatsOverview();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to load seller records right now.';
        this.loading = false;
      }
    });
  }

  private pickCurrentSeller(): void {
    const fromStorage = this.findSellerByIdentity(this.sellerIdFromStorage, this.sellerCodeFromStorage);
    this.currentSeller = fromStorage || this.allSellers[0] || null;
    this.currentSellerLogoUrl = this.getSellerLogoUrl(this.currentSeller?.logo || null);
    
    // Sync sellerCode to storage if it was missing but found in records
    if (this.currentSeller?.sellerCode && !this.sellerCodeFromStorage) {
      this.sellerCodeFromStorage = this.currentSeller.sellerCode;
      localStorage.setItem('sellerCode', this.currentSeller.sellerCode);
    }
  }

  private findSellerByIdentity(id?: string | null, code?: string | null): SellerRecord | undefined {
    if (!this.allSellers.length) {
      return undefined;
    }
    const normalizedCode = (code || '').trim().toUpperCase();
    const normalizedId = (id || '').trim();
    return this.allSellers.find((seller) => {
      return (
        (normalizedId && (seller.id === normalizedId || seller._id === normalizedId)) ||
        (normalizedCode && seller.sellerCode?.toUpperCase() === normalizedCode)
      );
    });
  }

  private updateStatsOverview(): void {
    const total = this.allSellers.length;
    const completed = this.allSellers.filter((seller) => Boolean(seller.logo)).length;
    const pending = Math.max(total - completed, 0);
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    const lastSeller = this.allSellers[0];
    const lastSignup = lastSeller?.createdAt ? new Date(lastSeller.createdAt) : undefined;
    const hoursSince = lastSignup ? Math.max(Math.round((Date.now() - lastSignup.getTime()) / (1000 * 60 * 60)), 0) : null;

    this.statsCards = [
      {
        icon: 'box',
        title: 'Total Sellers',
        value: total.toString(),
        subtext: pending ? `${pending} awaiting profile assets` : 'All profiles completed'
      },
      {
        icon: 'cart',
        title: 'Logo Ready',
        value: completed.toString(),
        subtext: `${completionRate}% completion rate`
      },
      {
        icon: 'clock',
        title: 'Last Signup',
        value: lastSignup ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(lastSignup) : 'N/A',
        subtext: lastSignup ? `${hoursSince}h ago` : 'Waiting for next seller'
      },
      {
        icon: 'currency',
        title: 'Avg. Profiles / Day',
        value: this.estimateDailySignups(total),
        subtext: 'Rolling 7-day velocity'
      }
    ];
  }

  private estimateDailySignups(total: number): string {
    if (!total) {
      return '0';
    }
    const first = this.allSellers[this.allSellers.length - 1]?.createdAt;
    const last = this.allSellers[0]?.createdAt;
    if (!first || !last) {
      return total.toString();
    }
    const firstDate = new Date(first).getTime();
    const lastDate = new Date(last).getTime();
    if (Number.isNaN(firstDate) || Number.isNaN(lastDate) || firstDate === lastDate) {
      return total.toString();
    }
    const days = Math.max(Math.abs(lastDate - firstDate) / (1000 * 60 * 60 * 24), 1);
    return Math.max(1, Math.round(total / days)).toString();
  }

  private createEmptyStats(): StatCard[] {
    return [
      { icon: 'box', title: 'Total Sellers', value: '0', subtext: 'Awaiting data sync' },
      { icon: 'cart', title: 'Logo Ready', value: '0', subtext: '0% completion' },
      { icon: 'clock', title: 'Last Signup', value: 'N/A', subtext: 'No activity yet' },
      { icon: 'currency', title: 'Avg. Profiles / Day', value: '0', subtext: 'Rolling 7-day velocity' }
    ];
  }

  private navigateToRoute(route: string): void {
    this.setActiveMenu(route);
    this.router.navigate([route]);
  }

  private setActiveMenu(route?: string | null): void {
    if (!route) {
      this.menuItems = this.menuItems.map((menu) => ({
        ...menu,
        active: menu.icon === 'dashboard'
      }));
      return;
    }
    this.menuItems = this.menuItems.map((menu) => ({
      ...menu,
      active: menu.route === route
    }));
  }
}
