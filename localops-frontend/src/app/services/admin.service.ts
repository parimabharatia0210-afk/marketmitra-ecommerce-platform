import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.api}/admin/login`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.api}/admin/register`, data);
  }

  addAdmin(data: any): Observable<any> {
    return this.http.post(`${this.api}/admin/add`, data, { headers: this.headers });
  }

  sendOtp(data: { email: string; role: string }): Observable<any> {
    return this.http.post(`${this.api}/otp/send`, data);
  }

  verifyOtp(data: { email: string; code: string }): Observable<any> {
    return this.http.post(`${this.api}/otp/verify`, data);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.api}/admin/dashboard-stats`, { headers: this.headers });
  }

  // Users
  getUsers(search = ''): Observable<any> {
    return this.http.get(`${this.api}/admin/users?search=${search}`, { headers: this.headers });
  }
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.api}/admin/users/${id}`, { headers: this.headers });
  }
  toggleBlockUser(id: string): Observable<any> {
    return this.http.put(`${this.api}/admin/users/${id}/block`, {}, { headers: this.headers });
  }

  // Sellers
  getSellers(search = ''): Observable<any> {
    return this.http.get(`${this.api}/admin/sellers?search=${search}`, { headers: this.headers });
  }
  toggleApproveSeller(id: string): Observable<any> {
    return this.http.put(`${this.api}/admin/sellers/${id}/approve`, {}, { headers: this.headers });
  }
  deleteSeller(id: string): Observable<any> {
    return this.http.delete(`${this.api}/admin/sellers/${id}`, { headers: this.headers });
  }

  // Products
  getProducts(search = ''): Observable<any> {
    return this.http.get(`${this.api}/admin/products?search=${search}`, { headers: this.headers });
  }
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.api}/admin/products/${id}`, { headers: this.headers });
  }

  // Orders
  getOrders(): Observable<any> {
    return this.http.get(`${this.api}/admin/orders`, { headers: this.headers });
  }
  updateOrderStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.api}/admin/orders/${id}/status`, { status }, { headers: this.headers });
  }

  // Settings
  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.api}/admin/change-password`, data, { headers: this.headers });
  }
}
