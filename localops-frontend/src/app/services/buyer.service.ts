import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BuyerRegistration {
  name: string;
  email: string;
  contact: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuyerService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/buyers/check-email`, {
      params: { email }
    });
  }

  sendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/otp/send`, { email, role: 'buyer' });
  }

  verifyOtp(email: string, code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/otp/verify`, { email, code });
  }

  register(buyerData: BuyerRegistration): Observable<{ message: string; buyer?: any }> {
    return this.http.post<{ message: string; buyer?: any }>(`${this.apiUrl}/buyers`, buyerData);
  }

  login(data: any): Observable<{ message: string; token: string; buyer: any }> {
    return this.http.post<{ message: string; token: string; buyer: any }>(`${this.apiUrl}/buyer/login`, data);
  }

  getBuyerProfile(buyerId: string): Observable<{ buyer: any }> {
    return this.http.get<{ buyer: any }>(`${this.apiUrl}/buyers/${buyerId}`);
  }

  updateBuyerProfile(buyerId: string, data: any): Observable<{ message: string; buyer: any }> {
    return this.http.put<{ message: string; buyer: any }>(`${this.apiUrl}/buyers/${buyerId}`, data);
  }

  getProducts(): Observable<{ products: any[] }> {
    return this.http.get<{ products: any[] }>(`${this.apiUrl}/products`);
  }

  placeOrder(orderData: any): Observable<{ message: string; orderId: string }> {
    return this.http.post<{ message: string; orderId: string }>(`${this.apiUrl}/orders`, orderData);
  }

  getOrders(buyerId: string): Observable<{ orders: any[] }> {
    return this.http.get<{ orders: any[] }>(`${this.apiUrl}/orders/buyer/${buyerId}`);
  }
}
