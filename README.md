# Bakecraft - Multitenancy Bakery Management SaaS

A production-ready multitenancy SaaS platform for bakery operations management. Features tenant isolation, team collaboration with role-based access control, real-time notifications, email workflows, and Paystack subscription handling.

## Overview

Bakecraft demonstrates enterprise architecture patterns in a full-stack NestJS application. Built for scalability with tenant-based data isolation, it provides bakeries with tools to manage their operations, teams, and subscriptions through a unified platform.

## Core Features

### Multitenancy Architecture
Complete tenant isolation with dynamic tenant context injection. Each bakery operates in its own isolated environment while sharing the same infrastructure. Tenant identification via slug-based routing ensures clean separation of data and operations.

### Authentication & Authorization
- JWT-based authentication with secure password handling
- Role-based access control system for granular permissions management
- User invitation workflow with token-based account setup
- Supports multiple users per tenant with department-level organization

### Subscription Management
- Full Paystack integration for payment processing
- Automated plan synchronization from Paystack
- Webhook-based subscription lifecycle management
- Support for multiple pricing tiers with feature gating

### Email System
- Configurable SMTP integration with connection pooling
- Automated notification workflows for key events
- Template-based email system for consistent communication

### Real-time Notifications
- Server-sent events (SSE) for live notification streaming
- In-app notification system with read/unread tracking
- Per-user notification channels with tenant isolation

### Team Management
- Department-based organization structure
- Role assignment and management
- User profile management
- Team invitation system

## Tech Stack

- **Backend Framework**: NestJS with TypeScript for type-safe, modular architecture
- **Database**: PostgreSQL with TypeORM for robust data management and migrations
- **Authentication**: JWT tokens with Passport.js integration
- **Payment Processing**: Paystack API integration for subscriptions and billing
- **Email Service**: Nodemailer with Gmail SMTP support and connection pooling
- **Architecture Patterns**: Dependency injection, repository pattern, service layer separation, module-based organization

## Project Structure

The application follows NestJS module architecture with clear separation of concerns. Core modules include:

- Tenant management
- Authentication
- User management
- Subscription handling
- Notification system
- Email service
- Roles and permissions
- Department organization

Each module is self-contained with its own controllers, services, and data access layers.

## API Endpoints

### Tenant Management

- `POST /tenants` - Create new tenant organization
- `GET /tenants/:slug` - Retrieve tenant by slug

### Authentication (Tenant-scoped)

- `POST /tenants/:tenantId/auth/signup` - User registration
- `POST /tenants/:tenantId/auth/login` - User authentication
- `POST /tenants/:tenantId/auth/invite` - Invite team member
- `POST /tenants/:tenantId/auth/resolve-token` - Validate invitation token
- `POST /tenants/:tenantId/auth/set-password` - Set password for invited user

### User Management

- `GET /tenants/:tenantId/profile/personal-details` - Get user profile
- `PATCH /tenants/:tenantId/profile/personal-details` - Update profile

### Subscriptions

- `POST /subscriptions/initialize` - Initialize subscription payment
- `GET /subscriptions/tenant/:tenantId` - Get tenant subscriptions
- `DELETE /subscriptions/:id` - Cancel subscription
- `POST /subscriptions/webhook` - Paystack webhook handler

### Notifications

- `GET /tenants/:tenantId/notifications/stream` - SSE notification stream
- `GET /tenants/:tenantId/notifications` - Get all notifications
- `PATCH /tenants/:tenantId/notifications/:notificationId/read` - Mark as read
- `GET /tenants/:tenantId/notifications/unread-count` - Get unread count

### Organization

- `POST /tenants/:tenantId/roles` - Create role
- `GET /tenants/:tenantId/roles/selections` - Get available roles
- `POST /tenants/:tenantId/departments` - Create department
- `GET /tenants/:tenantId/departments/selections` - Get departments

### Plans

- `GET /plans` - List all subscription plans
- `GET /plans/:code` - Get specific plan
- `POST /plans/sync` - Sync plans from Paystack

## Environment Setup

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONT_END_URL=http://localhost:3001

# Security
SECRET=your_jwt_secret_key_here
API_KEY=your_api_key_here

# Database Configuration
DB_URL=postgresql://username:password@host:port/database?sslmode=require
DB_HOST=your_database_host
DB_PORT=5432
DB_USERNAME=your_database_username
DB_PWD=your_database_password
DB_NAME=your_database_name

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_FROM="Your App Name" <your_email@gmail.com>
EMAIL_PASS=your_app_specific_password
EMAIL_POOL=true
EMAIL_MAX_CONNECTIONS=5
EMAIL_MAX_MESSAGES=100

# Paystack Configuration
PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_CALLBACK_URL=http://localhost:3001/create-account/subscription-success
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
```

## Installation & Running

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run in production mode
npm run build
npm run start:prod
```

The application will start on `http://localhost:3000` (or your configured PORT). You should see module initialization logs followed by "Application is running on port: 3000".

## Key Technical Implementations

### Tenant Context Management
- Custom tenant context provider that injects tenant information throughout the request lifecycle
- Middleware-based tenant resolution from URL parameters
- Global tenant guards ensuring operations stay within tenant boundaries

### Database Architecture
- Shared database with tenant_id foreign keys for data isolation
- TypeORM entities with tenant relationships
- Migration system for schema management

### Security Measures
- JWT token validation on protected routes
- Password hashing with bcrypt
- API key authentication for external integrations
- Rate limiting and CORS configuration

### Scalability Considerations
- Connection pooling for database and email
- Async processing for notifications
- Modular architecture allowing horizontal scaling
- Stateless API design for load balancing

## Development Status

This is a production-ready MVP with core features fully implemented. The multitenancy architecture, authentication system, subscription management, and notification system are all functional and tested. 

---

**License**: MIT  
**Author**: Me
