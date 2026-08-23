markdown
# Kharch Authentication API

Complete authentication system with OTP verification, JWT tokens, and password reset functionality.

## 🚀 Features

- ✅ User Registration with OTP Verification
- ✅ Secure Login with OTP Verification
- ✅ JWT Access & Refresh Tokens
- ✅ Password Reset with OTP
- ✅ Resend OTP Functionality
- ✅ Redis-based OTP Storage
- ✅ Email Notifications
- ✅ Comprehensive Error Handling
- ✅ Input Validation

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Password Hashing**: Bcrypt
- **OTP Storage**: Redis

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- npm or yarn

### Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kharch-api.git
cd kharch-api
Install dependencies:

bash
npm install
Set up environment variables:

bash
cp .env.example .env
# Edit .env with your configurations
Set up database:

bash
# Create database
createdb kharch

# Run migrations
npm run migrate
Start Redis server:

bash
redis-server
Start the application:

bash
# Development
npm run dev

# Production
npm start
🔐 Environment Variables
Create a .env file in the root directory:

env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/kharch
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=kharch

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_SECURE=false
EMAIL_FROM=noreply@yourdomain.com

# OTP Configuration
OTP_TTL_SECONDS=300
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
📌 API Endpoints
Base URL
text
http://localhost:3000/api/v1/auth
1. User Registration
POST /signup
Register a new user account.

Request Body:

json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
Success Response (201):

json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "userId": 1,
    "email": "john@example.com"
  }
}
2. Verify Signup OTP
POST /verify-signup-otp
Verify OTP after signup.

Request Body:

json
{
  "email": "john@example.com",
  "otp": "123456"
}
Success Response (200):

json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "is_email_verified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "abc123def456...",
    "accessTokenExpiresIn": "15m",
    "refreshTokenExpiresAt": "2026-09-20T10:00:00.000Z"
  }
}
3. User Login
POST /login
Login with credentials.

Request Body:

json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
Success Response (200):

json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "userId": 1,
    "email": "john@example.com"
  }
}
4. Verify Login OTP
POST /verify-login-otp
Verify OTP after login.

Request Body:

json
{
  "email": "john@example.com",
  "otp": "117063"
}
Success Response (200):

json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "email": "john@example.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "xyz789abc123...",
    "accessTokenExpiresIn": "15m",
    "refreshTokenExpiresAt": "2026-09-20T10:00:00.000Z"
  }
}
5. Refresh Token
POST /refresh
Get new access token using refresh token.

Request Body:

json
{
  "refreshToken": "abc123def456..."
}
Success Response (200):

json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "newRefreshToken123...",
    "accessTokenExpiresIn": "15m",
    "refreshTokenExpiresAt": "2026-09-20T10:00:00.000Z"
  }
}
6. Logout
POST /logout
Logout user and revoke refresh token.

Request Body:

json
{
  "refreshToken": "abc123def456..."
}
Success Response (200):

json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
7. Forgot Password
POST /forgot-password
Request password reset OTP.

Request Body:

json
{
  "email": "john@example.com"
}
Success Response (200):

json
{
  "success": true,
  "message": "Password reset OTP sent to your email",
  "data": {
    "email": "john@example.com"
  }
}
8. Verify Reset OTP
POST /verify-reset-otp
Verify OTP for password reset.

Request Body:

json
{
  "email": "john@example.com",
  "otp": "789012"
}
Success Response (200):

json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "message": "OTP verified successfully"
  }
}
9. Reset Password
POST /reset-password
Reset password after OTP verification.

Request Body:

json
{
  "email": "john@example.com",
  "otp": "789012",
  "password": "NewSecurePass456"
}
Success Response (200):

json
{
  "success": true,
  "message": "Password reset successfully",
  "data": null
}
10. Resend OTP
POST /resend-otp
Resend OTP for signup, login, or reset.

Request Body:

json
{
  "email": "john@example.com",
  "type": "signup"  // Options: "signup", "login", "reset"
}
Success Response (200):

json
{
  "success": true,
  "message": "OTP resent successfully for signup",
  "data": {
    "email": "john@example.com",
    "expiresIn": 300
  }
}
🗄️ Database Schema
Users Table
sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Refresh Tokens Table
sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
🧪 Testing
Running Tests
bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
Test API with cURL
Signup
bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123"}'
Verify OTP
bash
curl -X POST http://localhost:3000/api/v1/auth/verify-signup-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","otp":"123456"}'
Login
bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'
📊 Error Codes Reference
Code	HTTP Status	Description
USER_ALREADY_EXISTS	409	User already registered
INVALID_CREDENTIALS	401	Invalid email or password
EMAIL_NOT_VERIFIED	403	Email not verified
EMAIL_ALREADY_VERIFIED	400	Email already verified
INVALID_VERIFICATION	400	Invalid verification request
OTP_EXPIRED	400	OTP has expired
INVALID_OTP	400	Invalid OTP code
OTP_ATTEMPTS_EXCEEDED	400	Too many failed attempts
OTP_RESEND_COOLDOWN	429	Resend cooldown active
USER_NOT_FOUND	404	User not found
INVALID_REFRESH_TOKEN	401	Invalid refresh token
REFRESH_TOKEN_REVOKED	401	Refresh token revoked
REFRESH_TOKEN_EXPIRED	401	Refresh token expired
🚢 Deployment
Docker Deployment
dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
Docker Compose
yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    env_file:
      - .env

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: kharch
      POSTGRES_USER: kharch_user
      POSTGRES_PASSWORD: kharch_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
Deploy to Production
Set up environment variables:

bash
# Production environment variables
NODE_ENV=production
PORT=3000
JWT_ACCESS_SECRET=your_secure_secret_key
JWT_REFRESH_SECRET=your_secure_refresh_key
# ... other variables
Build and start:

bash
# Using Docker
docker-compose up -d

# Without Docker
npm run build
npm start
🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

Commit Convention
text
feat: add new authentication endpoint
fix: resolve OTP verification bug
docs: update API documentation
style: format code with prettier
refactor: restructure auth service
test: add integration tests for login
chore: update dependencies
📝 License
This project is licensed under the MIT License.

📞 Support
For support, email support@kharch.com or create an issue in the GitHub repository.

Version: 1.0.0
Last Updated: August 2026
Author: Kharch Development Team

text
