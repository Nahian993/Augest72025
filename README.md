# Crown Watch - Full Stack E-commerce Website

A complete luxury watch e-commerce website built with HTML, CSS, JavaScript (frontend) and Node.js with SQLite (backend).

## What Was Missing and Now Implemented

This repository was originally a frontend-only watch store website. The following full-stack e-commerce functionality has been added:

### Backend Infrastructure
- ✅ **Node.js Express Server** (`server.js`)
- ✅ **SQLite Database** with complete schema
- ✅ **RESTful API endpoints** for all core functionality
- ✅ **Security middleware** (Helmet, CORS, rate limiting)
- ✅ **JWT Authentication** system

### Database Schema
- ✅ **Users table** - Customer registration and authentication
- ✅ **Products table** - Complete product management
- ✅ **Orders table** - Order tracking and management
- ✅ **Order_items table** - Detailed order line items
- ✅ **Cart table** - Persistent shopping cart
- ✅ **Newsletter_subscriptions table** - Email marketing

### E-commerce Core Features
- ✅ **User Authentication** - Registration, login, logout
- ✅ **Product Management** - CRUD operations via API
- ✅ **Shopping Cart** - Add, update, remove items (both guest and logged-in users)
- ✅ **Order Processing** - Complete order creation and tracking
- ✅ **User Accounts** - Order history and profile management
- ✅ **Admin Dashboard** - Product and order management interface

### Frontend Integration
- ✅ **API Integration** (`api.js`) - Connects frontend to backend
- ✅ **Real Shopping Cart** - Functional add-to-cart with notifications
- ✅ **User Authentication UI** - Login/register modals
- ✅ **Dynamic Product Loading** - Products loaded from database
- ✅ **Order Management Page** (`orders.html`)

### Additional Features
- ✅ **Newsletter Subscription** - Backend email collection
- ✅ **Session Management** - JWT-based authentication
- ✅ **Error Handling** - Comprehensive error responses
- ✅ **Data Validation** - Input validation and sanitization
- ✅ **Sample Data** - Pre-populated with watch products

## File Structure

```
├── server.js              # Backend server with all API endpoints
├── api.js                 # Frontend API integration layer
├── package.json           # Node.js dependencies
├── crown_watch.db         # SQLite database (created automatically)
├── index.html             # Updated homepage with backend integration
├── orders.html            # Order management page
├── admin.html             # Admin dashboard
├── cart.html              # Shopping cart page
├── shop.html              # Product catalog
├── user.html              # User account page
├── images/                # Product images directory
└── [other frontend files] # Existing CSS and HTML files
```

## Installation and Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

3. **Access the Website**
   - Main website: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin.html

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product

### Shopping Cart
- `POST /api/cart` - Add item to cart
- `GET /api/cart` - Get cart items
- `PUT /api/cart` - Update cart item
- `DELETE /api/cart/:productId` - Remove from cart

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders

### Newsletter
- `POST /api/newsletter` - Subscribe to newsletter

## Features Implemented

### For Customers
- Browse products with search and filtering
- User registration and login
- Add products to cart (guest and logged-in)
- Complete checkout process
- View order history
- Subscribe to newsletter

### For Administrators
- Admin dashboard with statistics
- Product management interface
- Order management system
- User management tools
- Newsletter subscriber management

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting to prevent abuse
- CORS protection
- Helmet.js security headers
- Input validation and sanitization

## Technologies Used

### Backend
- Node.js
- Express.js
- SQLite3
- JWT (JSON Web Tokens)
- bcryptjs
- CORS
- Helmet.js

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Responsive design
- Modern UI/UX

## What's Still Missing (Future Enhancements)

While this is now a functional full-stack e-commerce website, the following could be added for production:

1. **Payment Integration** - Stripe, PayPal, etc.
2. **Image Upload** - Product image management
3. **Email System** - Order confirmations, newsletters
4. **Inventory Management** - Stock tracking and alerts
5. **Advanced Search** - Elasticsearch integration
6. **Reviews and Ratings** - Customer feedback system
7. **Wishlist** - Save items for later
8. **Coupons and Discounts** - Promotional codes
9. **Multi-language Support** - Internationalization
10. **Advanced Analytics** - Sales reporting and insights

## Development Notes

- Database is automatically initialized on first run
- Sample products are inserted automatically
- All frontend pages are updated to work with the backend
- Admin functionality requires login (basic implementation)
- Cart persists for logged-in users, uses localStorage for guests

This transformation converts the static website into a fully functional e-commerce platform ready for further development and customization.
