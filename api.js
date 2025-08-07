// Crown Watch Frontend API Integration
// This file provides functions to interact with the backend API

class CrownWatchAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('crownWatchToken');
    }

    // Helper method to make API requests
    async apiRequest(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        const data = await this.apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('crownWatchToken', data.token);
            localStorage.setItem('userId', data.userId);
        }
        
        return data;
    }

    async login(credentials) {
        const data = await this.apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('crownWatchToken', data.token);
            localStorage.setItem('userId', data.userId);
        }
        
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('crownWatchToken');
        localStorage.removeItem('userId');
        window.location.href = '/';
    }

    isLoggedIn() {
        return !!this.token;
    }

    // Product methods
    async getProducts(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/products?${queryParams}` : '/products';
        return await this.apiRequest(endpoint);
    }

    async getProduct(id) {
        return await this.apiRequest(`/products/${id}`);
    }

    // Cart methods
    async addToCart(productId, quantity = 1) {
        return await this.apiRequest('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }

    async getCart() {
        return await this.apiRequest('/cart');
    }

    async updateCartItem(productId, quantity) {
        return await this.apiRequest('/cart', {
            method: 'PUT',
            body: JSON.stringify({ productId, quantity })
        });
    }

    async removeFromCart(productId) {
        return await this.apiRequest(`/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    // Order methods
    async createOrder(orderData) {
        return await this.apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders() {
        return await this.apiRequest('/orders');
    }

    // Newsletter subscription
    async subscribeNewsletter(email, name = '') {
        return await this.apiRequest('/newsletter', {
            method: 'POST',
            body: JSON.stringify({ email, name })
        });
    }
}

// Global API instance
const crownAPI = new CrownWatchAPI();

// Enhanced cart functionality
class CartManager {
    constructor() {
        this.cart = [];
        this.loadCart();
    }

    async loadCart() {
        try {
            if (crownAPI.isLoggedIn()) {
                this.cart = await crownAPI.getCart();
            } else {
                // Load from localStorage for guest users
                const localCart = localStorage.getItem('guestCart');
                this.cart = localCart ? JSON.parse(localCart) : [];
            }
            this.updateCartDisplay();
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    }

    async addToCart(productId, quantity = 1) {
        try {
            if (crownAPI.isLoggedIn()) {
                await crownAPI.addToCart(productId, quantity);
                await this.loadCart();
            } else {
                // Handle guest cart
                const existingItem = this.cart.find(item => item.product_id == productId);
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    // For guest users, we need to fetch product details
                    const product = await crownAPI.getProduct(productId);
                    this.cart.push({
                        product_id: productId,
                        quantity,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        brand: product.brand
                    });
                }
                localStorage.setItem('guestCart', JSON.stringify(this.cart));
                this.updateCartDisplay();
            }
            
            this.showCartNotification('Item added to cart!');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            this.showCartNotification('Failed to add item to cart', 'error');
        }
    }

    updateCartDisplay() {
        const cartIcon = document.querySelector('.cart-icon');
        const cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
        
        if (cartIcon) {
            // Update cart icon with count
            let badge = cartIcon.querySelector('.cart-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                cartIcon.appendChild(badge);
            }
            badge.textContent = cartCount > 0 ? cartCount : '';
            badge.style.display = cartCount > 0 ? 'block' : 'none';
        }

        // Update cart page if we're on it
        if (window.location.pathname.includes('cart.html')) {
            this.renderCartPage();
        }
    }

    renderCartPage() {
        const cartContainer = document.getElementById('cartContainer');
        const subtotalElement = document.getElementById('cartSubtotal');
        const totalElement = document.getElementById('cartTotal');
        
        if (!cartContainer) return;

        if (this.cart.length === 0) {
            cartContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (subtotalElement) subtotalElement.textContent = '$0.00';
            if (totalElement) totalElement.textContent = '$20.00'; // Shipping cost
            return;
        }

        const cartHTML = this.cart.map(item => `
            <div class="cart-item" data-product-id="${item.product_id}">
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-brand">${item.brand}</p>
                    <p class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="cartManager.changeQuantity(${item.product_id}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="cartManager.changeQuantity(${item.product_id}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="cartManager.removeItem(${item.product_id})">Remove</button>
            </div>
        `).join('');

        cartContainer.innerHTML = cartHTML;

        // Calculate totals
        const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = 20; // Fixed shipping cost
        const total = subtotal + shipping;

        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
    }

    async changeQuantity(productId, change) {
        const item = this.cart.find(item => item.product_id == productId);
        if (!item) return;

        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
            await this.removeItem(productId);
            return;
        }

        try {
            if (crownAPI.isLoggedIn()) {
                await crownAPI.updateCartItem(productId, newQuantity);
                await this.loadCart();
            } else {
                item.quantity = newQuantity;
                localStorage.setItem('guestCart', JSON.stringify(this.cart));
                this.updateCartDisplay();
            }
        } catch (error) {
            console.error('Failed to update quantity:', error);
        }
    }

    async removeItem(productId) {
        try {
            if (crownAPI.isLoggedIn()) {
                await crownAPI.removeFromCart(productId);
                await this.loadCart();
            } else {
                this.cart = this.cart.filter(item => item.product_id != productId);
                localStorage.setItem('guestCart', JSON.stringify(this.cart));
                this.updateCartDisplay();
            }
        } catch (error) {
            console.error('Failed to remove item:', error);
        }
    }

    showCartNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global cart manager instance
const cartManager = new CartManager();

// Authentication UI helpers
function showAuthModal(mode = 'login') {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <span class="auth-close">&times;</span>
            <h2>${mode === 'login' ? 'Login' : 'Register'}</h2>
            <form id="authForm">
                ${mode === 'register' ? `
                    <input type="text" id="firstName" placeholder="First Name" required>
                    <input type="text" id="lastName" placeholder="Last Name" required>
                ` : ''}
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">${mode === 'login' ? 'Login' : 'Register'}</button>
            </form>
            <p class="auth-switch">
                ${mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <a href="#" onclick="switchAuthMode('${mode === 'login' ? 'register' : 'login'}')">${mode === 'login' ? 'Register' : 'Login'}</a>
            </p>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.auth-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    document.getElementById('authForm').onsubmit = async (e) => {
        e.preventDefault();
        await handleAuth(mode);
    };
}

function switchAuthMode(newMode) {
    document.querySelector('.auth-modal').remove();
    showAuthModal(newMode);
}

async function handleAuth(mode) {
    const form = document.getElementById('authForm');
    const formData = new FormData(form);
    
    try {
        if (mode === 'login') {
            await crownAPI.login({
                email: formData.get('email'),
                password: formData.get('password')
            });
        } else {
            await crownAPI.register({
                email: formData.get('email'),
                password: formData.get('password'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName')
            });
        }
        
        document.querySelector('.auth-modal').remove();
        updateAuthUI();
        cartManager.loadCart(); // Reload cart after login
    } catch (error) {
        alert('Authentication failed: ' + error.message);
    }
}

function updateAuthUI() {
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        if (crownAPI.isLoggedIn()) {
            userIcon.innerHTML = '👤✓';
            userIcon.onclick = () => showUserMenu();
        } else {
            userIcon.innerHTML = '👤';
            userIcon.onclick = () => showAuthModal('login');
        }
    }
}

function showUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-content">
            <a href="/user.html">My Account</a>
            <a href="/orders.html">My Orders</a>
            <a href="#" onclick="crownAPI.logout()">Logout</a>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
}

// Enhanced product loading
async function loadProducts(filters = {}) {
    try {
        const products = await crownAPI.getProducts(filters);
        return products;
    } catch (error) {
        console.error('Failed to load products:', error);
        return [];
    }
}

// Newsletter subscription handler
async function subscribeNewsletter(email, name = '') {
    try {
        await crownAPI.subscribeNewsletter(email, name);
        alert('Successfully subscribed to our newsletter!');
    } catch (error) {
        alert('Subscription failed: ' + error.message);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    // Add event listeners to existing buttons
    document.querySelectorAll('.add-to-cart-button, .arrival-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Try to get product ID from data attributes or closest product element
            const productElement = button.closest('.product, .arrival-card, .product-item');
            let productId = null;
            
            if (productElement) {
                productId = productElement.dataset.productId || 
                           productElement.querySelector('img')?.dataset.productId ||
                           1; // Default fallback
            }
            
            if (productId) {
                await cartManager.addToCart(productId, 1);
            }
        });
    });

    // Newsletter form handler
    const newsletterForm = document.querySelector('.contact-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            const name = newsletterForm.querySelector('input[type="text"]').value;
            await subscribeNewsletter(email, name);
        });
    }

    // User icon click handler
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.addEventListener('click', (e) => {
            e.preventDefault();
            if (crownAPI.isLoggedIn()) {
                showUserMenu();
            } else {
                showAuthModal('login');
            }
        });
    }
});

// CSS for auth modal and cart notifications
const style = document.createElement('style');
style.textContent = `
    .auth-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }

    .auth-modal-content {
        background: white;
        padding: 30px;
        border-radius: 10px;
        width: 90%;
        max-width: 400px;
        position: relative;
    }

    .auth-close {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 28px;
        cursor: pointer;
    }

    .auth-modal-content input {
        width: 100%;
        padding: 12px;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-sizing: border-box;
    }

    .auth-modal-content button {
        width: 100%;
        padding: 12px;
        background: #333;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
    }

    .auth-switch {
        text-align: center;
        margin-top: 15px;
    }

    .auth-switch a {
        color: #333;
        text-decoration: none;
        font-weight: bold;
    }

    .cart-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: red;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }

    .user-menu {
        position: fixed;
        top: 60px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
    }

    .user-menu-content a {
        display: block;
        padding: 10px 20px;
        text-decoration: none;
        color: #333;
        border-bottom: 1px solid #eee;
    }

    .user-menu-content a:last-child {
        border-bottom: none;
    }

    .user-menu-content a:hover {
        background: #f5f5f5;
    }

    .cart-item {
        display: flex;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
        gap: 15px;
    }

    .cart-item-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 5px;
    }

    .cart-item-details {
        flex: 1;
    }

    .cart-item-controls {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .quantity-btn {
        width: 30px;
        height: 30px;
        border: 1px solid #ddd;
        background: white;
        cursor: pointer;
        border-radius: 3px;
    }

    .remove-btn {
        padding: 8px 15px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
    }

    .empty-cart {
        text-align: center;
        padding: 50px;
        color: #666;
        font-size: 18px;
    }

    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
`;

document.head.appendChild(style);