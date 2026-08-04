import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SellerService } from '../../../services/seller.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-products.component.html',
  styleUrls: ['./my-products.component.css']
})
export class MyProductsComponent implements OnInit, OnDestroy {
  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  
  loading = true;
  products: any[] = [];
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
    { icon: 'products', label: 'My Products', active: true, route: '/seller/products' },
    { icon: 'shop', label: 'My Shop Profile', route: '/seller/shop' },
    { icon: 'orders', label: 'Orders', route: '/seller/orders' },
    { icon: 'chat', label: 'Messages', disabled: true },
    { icon: 'bell', label: 'Alerts', route: '/seller/alerts' },
    { icon: 'settings', label: 'Settings', route: '/seller/settings' }
  ];

  private sellerCodeFromStorage: string | null = null;
  private productsSub?: Subscription;

  constructor(
    private readonly sellerService: SellerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.sellerCodeFromStorage = localStorage.getItem('sellerCode');
      const storedName = localStorage.getItem('sellerName');
      if (storedName) {
        this.sellerDisplayName = storedName;
      }
    }
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.productsSub?.unsubscribe();
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

  handleAddProduct(): void {
    this.router.navigate(['/seller/add-product']);
  }

  loadProducts(): void {
    if (!this.sellerCodeFromStorage) {
      this.errorMessage = 'Seller session not found. Please log in again.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.productsSub = this.sellerService.getProducts(this.sellerCodeFromStorage).subscribe({
      next: (res: any) => {
        this.products = res.products || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Fetch products failed', err);
        this.errorMessage = 'Failed to load products.';
        this.loading = false;
      }
    });
  }

  handleUpdateProduct(product: any): void {
    const payload = {
      price: product.price,
      discountPercentage: product.discountPercentage,
      stock: product.stock
    };
    this.sellerService.updateProduct(product._id || product.id, payload).subscribe({
      next: (res: any) => {
        product.finalPrice = res.product.finalPrice;
        alert('Product updated successfully!');
      },
      error: (err: any) => {
        console.error('Failed to update product', err);
        alert(err.error?.message || 'Failed to update product.');
      }
    });
  }

  handleDeleteProduct(productId: string): void {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this product?')) {
      this.sellerService.deleteProduct(productId).subscribe({
        next: () => {
          this.products = this.products.filter(p => (p._id || p.id) !== productId);
        },
        error: (err: any) => {
          console.error('Failed to delete product', err);
          alert(err.error?.message || 'Failed to delete product.');
        }
      });
    }
  }

  formatDate(rawDate?: string): string {
    if (!rawDate) return 'N/A';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(parsed);
  }

  getSellerLogoUrl(logoPath?: string | null): string | null {
    if (!logoPath) return null;
    if (/^https?:\/\//i.test(logoPath)) return logoPath;
    const normalized = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    return `${this.mediaBaseUrl}${normalized}`;
  }
}
