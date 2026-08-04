# MarketMitra – Hyper-Local eCommerce Platform

A hyper-local eCommerce platform connecting local shopkeepers with customers, built with a scalable MongoDB architecture and secure merchant onboarding.

## Overview
MarketMitra enables local sellers to list products and manage orders through a secure, verified onboarding process, while ensuring transactional data integrity across the platform.

## Key Features
- Scalable MongoDB architecture across eight core collections with denormalized document structures to preserve historical order integrity
- Automated seller-code generation for merchant identification
- Secure merchant onboarding with OTP email verification, admin approval, and geographic validation to prevent fraudulent registrations
- 20 end-to-end API validation scenarios verifying backend workflows and real-time database integrity

## Tech Stack
- **Frontend:** Angular
- **Backend:** Node.js, Express.js
- **Database:** MongoDB

## Project Structure
- `localops-frontend/` — Angular client application
- `localops-backend/` — Node.js/Express API server

## Core Modules
- Merchant onboarding and verification
- Order management with historical integrity
- Admin approval workflows
