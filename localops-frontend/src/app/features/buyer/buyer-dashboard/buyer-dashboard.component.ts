import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BuyerService } from '../../../services/buyer.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './buyer-dashboard.component.html',
  styleUrl: './buyer-dashboard.component.css'
})
export class BuyerDashboardComponent implements OnInit, OnDestroy {
  currentTab: 'home' | 'cart' | 'favorites' | 'orders' | 'profile' | 'product-details' = 'home';
  searchQuery: string = '';
  products: any[] = [];
  filteredProducts: any[] = [];
  loadingProducts: boolean = false;
  
  cart: any[] = [];
  favorites: any[] = [];
  orders: any[] = [];
  loadingOrders: boolean = false;
  
  selectedProduct: any = null;
  selectedImageIndex: number = 0;
  
  buyerId: string | null = null;
  buyerData: any = null;
  loadingProfile: boolean = false;
  profileForm!: FormGroup;
  isSubmittingProfile: boolean = false;
  profileMessage: string = '';
  profileError: string = '';
  
  toastMessage: string = '';
  private toastTimer: any;
  private subs = new Subscription();
  private apiUrl = environment.apiUrl;

  constructor(
    private buyerService: BuyerService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.buyerId = localStorage.getItem('buyerId');
      
      const savedFavs = localStorage.getItem('buyerFavorites');
      if (savedFavs) {
        try { this.favorites = JSON.parse(savedFavs); } catch(e) {}
      }
      
      const savedCart = localStorage.getItem('buyerCart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          // Ensure each item has a quantity field
          this.cart = parsed.map((item: any) => ({ ...item, quantity: item.quantity || 1 }));
        } catch(e) {}
      }
    }

    if (!this.buyerId) {
      this.router.navigate(['/buyer-login']);
      return;
    }

    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      contact: ['', Validators.required],
      address: [''],
      city: [''],
      state: [''],
      pincode: ['']
    });

    this.loadProducts();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  setTab(tab: any): void {
    this.currentTab = tab;
    if (tab === 'orders') {
      this.loadOrders();
    }
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.subs.add(
      this.buyerService.getProducts().subscribe({
        next: (res: any) => {
          let all = res.products || [];
          all = all.filter((p: any) => !p.isDeleted && p.stock > 0);
          
          for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
          }
          
          this.products = all;
          this.filteredProducts = all;
          this.loadingProducts = false;
        },
        error: (err: any) => {
          console.error('Failed to load products', err);
          this.loadingProducts = false;
        }
      })
    );
  }

  loadOrders(): void {
    if (!this.buyerId) return;
    this.loadingOrders = true;
    this.subs.add(
      this.buyerService.getOrders(this.buyerId).subscribe({
        next: (res: any) => {
          this.orders = res.orders || [];
          this.loadingOrders = false;
        },
        error: () => { this.loadingOrders = false; }
      })
    );
  }

  filterProducts(): void {
    if (!this.searchQuery.trim()) {
      this.filteredProducts = this.products;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredProducts = this.products.filter((p: any) => 
        p.name?.toLowerCase().includes(q) || 
        p.seller?.shopName?.toLowerCase().includes(q) ||
        p.sellerCode?.toLowerCase().includes(q)
      );
    }
  }

  getMediaUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = this.apiUrl.replace('/api', '');
    return `${baseUrl}${normalized}`;
  }

  viewProduct(product: any): void {
    this.selectedProduct = product;
    this.selectedImageIndex = 0;
    this.currentTab = 'product-details';
  }

  backToHome(): void {
    this.selectedProduct = null;
    this.currentTab = 'home';
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }

  isFavorite(product: any): boolean {
    const id = product._id || product.id;
    return this.favorites.some(f => (f._id || f.id) === id);
  }

  toggleFavorite(product: any, event?: Event): void {
    if (event) event.stopPropagation();
    const idx = this.favorites.findIndex(f => (f._id || f.id) === (product._id || product.id));
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
      this.showToast('Removed from favorites');
    } else {
      this.favorites.push(product);
      this.showToast('Added to favorites');
    }
    this.saveToStorage();
  }

  addToCart(product: any, event?: Event): void {
    if (event) event.stopPropagation();
    const exists = this.cart.some(p => (p._id || p.id) === (product._id || product.id));
    if (exists) {
      this.showToast('Product already in cart');
    } else {
      this.cart.push({ ...product, quantity: 1 });
      this.showToast('Product added to cart');
      this.saveToStorage();
    }
  }

  removeFromCart(product: any, event?: Event): void {
    if (event) event.stopPropagation();
    const idx = this.cart.findIndex(p => (p._id || p.id) === (product._id || product.id));
    if (idx >= 0) {
      this.cart.splice(idx, 1);
      this.showToast('Removed from cart');
      this.saveToStorage();
    }
  }

  incrementQty(item: any): void {
    if (item.quantity < (item.stock || 99)) {
      item.quantity++;
      this.saveToStorage();
    }
  }

  decrementQty(item: any): void {
    if (item.quantity > 1) {
      item.quantity--;
      this.saveToStorage();
    }
  }

  buyNow(product: any): void {
    const existing = this.cart.find(p => (p._id || p.id) === (product._id || product.id));
    if (!existing) {
      this.cart.push({ ...product, quantity: 1 });
      this.saveToStorage();
    }
    this.router.navigate(['/checkout']);
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  getCartTotal(): number {
    const total = this.cart.reduce((sum, item) => sum + (item.finalPrice * (item.quantity || 1)), 0);
    return Number(total.toFixed(2));
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('buyerFavorites', JSON.stringify(this.favorites));
      localStorage.setItem('buyerCart', JSON.stringify(this.cart));
    }
  }

  loadProfile(): void {
    if (!this.buyerId) return;
    this.loadingProfile = true;
    this.subs.add(
      this.buyerService.getBuyerProfile(this.buyerId).subscribe({
        next: (res: any) => {
          this.buyerData = res.buyer;
          this.profileForm.patchValue({
            name: this.buyerData.name,
            contact: this.buyerData.contact,
            address: this.buyerData.address || '',
            city: this.buyerData.city || '',
            state: this.buyerData.state || '',
            pincode: this.buyerData.pincode || ''
          });
          this.loadingProfile = false;
        },
        error: (err: any) => {
          console.error('Failed to load profile', err);
          this.loadingProfile = false;
        }
      })
    );
  }

  updateProfile(): void {
    if (this.profileForm.invalid || !this.buyerId) return;
    this.isSubmittingProfile = true;
    this.profileMessage = '';
    this.profileError = '';
    
    this.subs.add(
      this.buyerService.updateBuyerProfile(this.buyerId, this.profileForm.value).subscribe({
        next: (res: any) => {
          this.profileMessage = 'Profile updated successfully!';
          this.buyerData = { ...this.buyerData, ...this.profileForm.value };
          this.isSubmittingProfile = false;
        },
        error: (err: any) => {
          this.profileError = err.error?.message || 'Failed to update profile';
          this.isSubmittingProfile = false;
        }
      })
    );
  }

  get initials(): string {
    if (!this.buyerData?.name) return 'B';
    return this.buyerData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  }

  logout(): void {
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('buyerId');
    this.router.navigate(['/buyer-login']);
  }
}
