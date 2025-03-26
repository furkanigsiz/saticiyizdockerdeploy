# System Patterns: Saticiyiz

## Architecture Overview

Saticiyiz follows a modern, containerized microservices architecture with clear separation between frontend and backend components:

```
Saticiyiz
├── Frontend (React SPA)
│   ├── UI Components
│   ├── Context API State Management
│   └── API Service Layer
└── Backend (Node.js/Express)
    ├── API Controllers
    ├── Business Logic Services
    ├── Database Layer (Supabase)
    └── External API Integrations
```

## Key Design Patterns

### Frontend Patterns

1. **Component-Based Architecture**
   - Reusable UI components organized by feature and function
   - Consistent styling through Tailwind CSS utility classes
   - Responsive design principles applied throughout

2. **Context API for State Management**
   - Central stores for authentication, user preferences, and application state
   - Reduces prop drilling and provides clean access to global state
   - Custom hooks for accessing and modifying state

3. **Service Layer Pattern**
   - Abstracted API communication through service modules
   - Consistent error handling and response parsing
   - Authentication token management and request interceptors

### Backend Patterns

1. **MVC Architecture**
   - Controllers handle request/response cycle
   - Service layer contains business logic
   - Models represent data structures and database interactions

2. **Middleware Pattern**
   - Authentication and authorization checks
   - Request validation and sanitization
   - Error handling and logging

3. **Repository Pattern**
   - Abstracted database operations through Supabase client
   - Centralized query management
   - Data transformation and normalization

## Data Flow

1. **Authentication Flow**
   ```
   User → Login Request → JWT Generation → Token Storage → Authenticated Requests
   ```

2. **Product Synchronization Flow**
   ```
   Scheduled Job → Trendyol API Request → Data Normalization → Database Update → Frontend Refresh
   ```

3. **Order Management Flow**
   ```
   Webhook/Poll → Order Detection → Database Storage → Status Updates → Notification
   ```

## Technical Decisions

1. **Supabase as Backend-as-a-Service**
   - PostgreSQL database with real-time capabilities
   - Built-in authentication and storage solutions
   - Row-level security for data protection
   - Reduced need for custom backend code

2. **Docker Containerization**
   - Consistent development and production environments
   - Simplified deployment and scaling
   - Isolated services with clear dependency management
   - Docker Compose for orchestration

3. **JWT Authentication**
   - Stateless authentication mechanism
   - Secure token storage in HTTP-only cookies
   - Refresh token rotation for extended sessions
   - Role-based access control

4. **API-First Design**
   - RESTful API conventions
   - Comprehensive endpoint documentation
   - Versioned API routes
   - Consistent error response formats

## Integration Patterns

1. **Trendyol Integration**
   - API credential management
   - Scheduled data synchronization
   - Webhook handling for real-time updates
   - Rate limit management

2. **Google Sheets Integration**
   - OAuth authentication flow
   - Scheduled export jobs
   - Customizable data mapping
   - Error handling and retry mechanisms

3. **Email Service Integration**
   - SMTP configuration
   - Templated emails
   - Queue-based sending
   - Delivery status tracking 