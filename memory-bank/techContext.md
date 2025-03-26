# Technical Context: Saticiyiz

## Technology Stack

### Frontend Technologies
- **React.js**: Core UI library for building component-based interfaces
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Context API**: State management across components
- **Axios**: Promise-based HTTP client for API requests
- **Supabase Client SDK**: Real-time database connection

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Supabase**: Backend-as-a-Service platform
- **JWT**: Authentication mechanism
- **Nodemailer**: Email sending capability
- **Google API**: Integration with Google services

### Database
- **PostgreSQL**: Via Supabase, providing relational database capabilities
- **RLS (Row Level Security)**: For database access control

### Infrastructure
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container Docker applications

## Development Environment

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose
- Supabase account

### Local Setup
1. Clone the repository
2. Set up environment variables in `.env` files
3. Run with Docker Compose
4. Access Frontend at http://localhost:3000
5. Access Backend API at http://localhost:5000

### Environment Variables

#### Core Variables
```
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

#### Frontend-specific Variables
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:5000/api
```

#### Backend-specific Variables
```
PORT=5000
NODE_ENV=development
TRENDYOL_API_BASE_URL=https://api.trendyol.com/sapigw
EMAIL_SERVICE=smtp.example.com
EMAIL_USER=your-email
EMAIL_PASS=your-password
```

## External Integrations

### Trendyol Marketplace API
- **Purpose**: Product and order synchronization
- **Authentication**: API key and secret
- **Rate Limits**: Varies by endpoint, typically 100 requests per minute
- **Documentation**: Available from Trendyol Partner API docs

### Google Sheets API
- **Purpose**: Data export and reporting
- **Authentication**: OAuth 2.0
- **Scopes Required**: 
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`

### Email Service
- **Purpose**: Notifications and alerts
- **Protocol**: SMTP
- **Configuration**: Service provider, credentials, port

## Technical Constraints

### Performance Requirements
- API response times under 500ms for critical operations
- Support for at least 100 concurrent users
- Handling of up to 10,000 products per seller
- Daily synchronization of product data

### Security Requirements
- HTTPS for all communications
- JWT tokens with appropriate expiration
- Password hashing with bcrypt
- Environment variable protection
- Row-level security in database

### Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design
- Minimum screen resolution of 1280x720

## Deployment Model

### Development
- Local Docker environment
- Supabase development project

### Staging
- Docker containers on test server
- Separate Supabase staging project
- Integration with test API accounts

### Production
- Cloud-hosted Docker containers
- Production Supabase project
- SSL certificates
- CDN for static assets
- Database backups 