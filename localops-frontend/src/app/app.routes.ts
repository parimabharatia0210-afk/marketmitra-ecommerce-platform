import { Routes } from '@angular/router';

import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { BuyerLoginComponent } from './features/buyer/buyer-login/buyer-login.component';
import { BuyerRegisterComponent } from './features/buyer/buyer-register/buyer-register.component';
import { BuyerDashboardComponent } from './features/buyer/buyer-dashboard/buyer-dashboard.component';
import { CheckoutComponent } from './features/buyer/checkout/checkout.component';

import { SellerLoginComponent } from './features/seller/seller-login/seller-login.component';
import { SellerRegisterComponent } from './features/seller/seller-register/seller-register.component';
import { DashboardComponent } from './features/seller/dashboard/dashboard.component';
import { AddProductComponent } from './features/seller/add-product/add-product.component';
import { ShopComponent } from './features/seller/shop/shop.component';
import { MyProductsComponent } from './features/seller/my-products/my-products.component';
import { SellerSettingsComponent } from './features/seller/settings/settings.component';
import { SellerOrdersComponent } from './features/seller/seller-orders/seller-orders.component';
import { SellerAlertsComponent } from './features/seller/seller-alerts/seller-alerts.component';

import { AdminLoginComponent } from './features/admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [

  { path: '', component: HomeComponent },

  { path: 'login', component: LoginComponent },
  { path: 'buyer-login', component: BuyerLoginComponent },
  { path: 'buyer-dashboard', component: BuyerDashboardComponent },
  { path: 'register', component: BuyerRegisterComponent },
  { path: 'checkout', component: CheckoutComponent },

  { path: 'seller-login', component: SellerLoginComponent },
  { path: 'seller-register', component: SellerRegisterComponent },

  { path: 'seller-dashboard', component: DashboardComponent },
  { path: 'seller/products', component: MyProductsComponent },
  { path: 'seller/add-product', component: AddProductComponent },
  { path: 'seller/shop', component: ShopComponent },
  { path: 'seller/settings', component: SellerSettingsComponent },
  { path: 'seller/orders', component: SellerOrdersComponent },
  { path: 'seller/alerts', component: SellerAlertsComponent },

  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'admin', component: AdminDashboardComponent }

];
