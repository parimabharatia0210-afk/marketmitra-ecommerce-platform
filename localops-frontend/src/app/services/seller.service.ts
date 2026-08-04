import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SellerRegistration {
  name: string;
  email: string;
  contact: string;
  shopName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  password: string;
  shopDescription?: string;
  logo?: string;
}

export interface SellerRecord {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  contact: string;
  shopName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  shopDescription?: string;
  logo?: string | null;
  sellerCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  discountPercentage?: number;
  minPurchase?: number;
  buyInMultiples?: number;
  sellerCode?: string;
  sellerId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SellerService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadLogo(file: File): Observable<{ logo: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ logo: string }>(`${this.apiUrl}/upload/logo`, formData);
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/sellers/check-email`, {
      params: { email }
    });
  }

  sendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/otp/send`, { email, role: 'seller' });
  }

  verifyOtp(email: string, code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/otp/verify`, { email, code });
  }

  register(sellerData: SellerRegistration): Observable<{ message: string; seller?: any }> {
    return this.http.post<{ message: string; seller?: any }>(`${this.apiUrl}/sellers`, sellerData);
  }

  login(credentials: { email: string; password: string }): Observable<{ message: string; token: string; seller: any }> {
    return this.http.post<{ message: string; token: string; seller: any }>(`${this.apiUrl}/seller/login`, credentials);
  }

  changePassword(id: string, passwords: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sellers/${id}/password`, passwords);
  }

  getSellers(): Observable<{ sellers: SellerRecord[] }> {
    return this.http.get<{ sellers: SellerRecord[] }>(`${this.apiUrl}/sellers`);
  }

  addProduct(formData: FormData): Observable<{ message: string; product: any }> {
    return this.http.post<{ message: string; product: any }>(`${this.apiUrl}/products`, formData);
  }

  getProducts(sellerCode?: string): Observable<{ products: any[] }> {
    const params: any = {};
    if (sellerCode) {
      params.sellerCode = sellerCode;
    }
    return this.http.get<{ products: any[] }>(`${this.apiUrl}/products`, { params });
  }

  updateProduct(productId: string, data: any): Observable<{ message: string; product: any }> {
    return this.http.put<{ message: string; product: any }>(`${this.apiUrl}/products/${productId}`, data);
  }

  deleteProduct(productId: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.apiUrl}/products/${productId}`);
  }

  updateSellerProfile(sellerId: string, formData: FormData): Observable<{ message: string; seller: SellerRecord }> {
    return this.http.put<{ message: string; seller: SellerRecord }>(`${this.apiUrl}/sellers/${sellerId}`, formData);
  }

  // ─── ORDERS & NOTIFICATIONS ─────────────────────
  getOrders(sellerId: string): Observable<{ orders: any[] }> {
    return this.http.get<{ orders: any[] }>(`${this.apiUrl}/sellers/${sellerId}/orders`);
  }

  updateOrderStatus(sellerId: string, orderId: string, status: string): Observable<{ message: string; order: any }> {
    return this.http.put<{ message: string; order: any }>(`${this.apiUrl}/sellers/${sellerId}/orders/${orderId}/status`, { status });
  }

  getNotifications(sellerId: string): Observable<{ notifications: any[] }> {
    return this.http.get<{ notifications: any[] }>(`${this.apiUrl}/sellers/${sellerId}/notifications`);
  }

  markNotificationsRead(sellerId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/sellers/${sellerId}/notifications/mark-read`, {});
  }
}
