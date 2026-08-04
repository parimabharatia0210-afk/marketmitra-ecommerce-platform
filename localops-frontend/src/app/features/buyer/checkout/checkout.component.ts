import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BuyerService } from '../../../services/buyer.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  cart: any[] = [];
  buyerId: string | null = null;
  buyerData: any = null;
  private apiUrl = environment.apiUrl;

  // Delivery address form
  addressLine: string = '';
  city: string = '';
  state: string = '';
  pincode: string = '';
  contact: string = '';

  // UI state
  isPlacingOrder: boolean = false;
  orderPlaced: boolean = false;
  orderId: string = '';
  errorMsg: string = '';

  constructor(
    private buyerService: BuyerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.buyerId = localStorage.getItem('buyerId');
      const savedCart = localStorage.getItem('buyerCart');
      if (savedCart) {
        try { this.cart = JSON.parse(savedCart); } catch (e) {}
      }
    }

    if (!this.buyerId) {
      this.router.navigate(['/buyer-login']);
      return;
    }

    if (!this.cart.length) {
      this.router.navigate(['/buyer-dashboard']);
      return;
    }

    // Load profile to pre-fill address
    this.buyerService.getBuyerProfile(this.buyerId).subscribe({
      next: (res: any) => {
        this.buyerData = res.buyer;
        this.addressLine = res.buyer?.address || '';
        this.city = res.buyer?.city || '';
        this.state = res.buyer?.state || '';
        this.pincode = res.buyer?.pincode || '';
        this.contact = res.buyer?.contact || '';
      }
    });
  }

  getMediaUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = this.apiUrl.replace('/api', '');
    return `${baseUrl}${normalized}`;
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.finalPrice * (item.quantity || 1)), 0);
  }

  isFormValid(): boolean {
    return !!(this.addressLine.trim() && this.city.trim() && this.state.trim() && this.pincode.trim() && this.contact.trim());
  }

  placeOrder(): void {
    if (!this.isFormValid() || this.isPlacingOrder) return;
    this.isPlacingOrder = true;
    this.errorMsg = '';

    const orderData = {
      buyerId: this.buyerId,
      buyerEmail: this.buyerData?.email || '',
      buyerName: this.buyerData?.name || '',
      deliveryAddress: {
        addressLine: this.addressLine.trim(),
        city: this.city.trim(),
        state: this.state.trim(),
        pincode: this.pincode.trim(),
        contact: this.contact.trim()
      },
      items: this.cart.map(item => ({
        productId: item._id || item.id,
        name: item.name,
        price: item.finalPrice,
        quantity: item.quantity || 1,
        image: item.images?.[0] || '',
        sellerName: item.seller?.shopName || item.sellerCode || ''
      })),
      totalAmount: this.getCartTotal()
    };

    this.buyerService.placeOrder(orderData).subscribe({
      next: (res: any) => {
        this.orderId = res.orderId;
        this.orderPlaced = true;
        this.isPlacingOrder = false;
        // Clear cart
        if (typeof window !== 'undefined') {
          localStorage.setItem('buyerCart', JSON.stringify([]));
        }
      },
      error: (err: any) => {
        this.errorMsg = err.error?.message || 'Failed to place order. Please try again.';
        this.isPlacingOrder = false;
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/buyer-dashboard']);
  }

  goBack(): void {
    this.router.navigate(['/buyer-dashboard']);
  }
}
