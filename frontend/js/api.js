// API integration for backend connectivity
// This preserves localStorage functionality while adding backend sync

const API_BASE_URL = 'http://localhost:5001/api';

// API helper functions
class ApiClient {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.isLoggedIn = !!this.token;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        if (options.body && typeof options.body !== 'string') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`API request failed for ${endpoint}:`, error);
            // Return null to fall back to localStorage
            return null;
        }
    }

    // Authentication methods
    async login(email, password) {
        const data = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        
        if (data && data.success) {
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            this.isLoggedIn = true;
            
            // Sync localStorage data to backend after login
            await this.syncLocalStorageToBackend();
            
            // Load backend cart data to localStorage for immediate access
            await this.loadBackendCartToLocalStorage();
        }
        
        return data;
    }

    async register(userData) {
        const data = await this.makeRequest('/auth/register', {
            method: 'POST',
            body: userData
        });
        
        if (data && data.success) {
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            this.isLoggedIn = true;
            
            // Sync any existing localStorage data to backend
            await this.syncLocalStorageToBackend();
        }
        
        return data;
    }

    async logout() {
        await this.makeRequest('/auth/logout', { method: 'POST' });
        this.token = null;
        this.isLoggedIn = false;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // Cart methods - hybrid approach
    async getCart() {
        if (!this.isLoggedIn) {
            // Return localStorage cart for non-authenticated users
            const savedCart = localStorage.getItem('cart');
            return savedCart ? JSON.parse(savedCart) : { items: [], totalAmount: 0 };
        }

        // Try to get from backend for authenticated users
        const data = await this.makeRequest('/cart');
        if (data && data.success) {
            return data.cart;
        }
        
        // Fallback to localStorage
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : { items: [], totalAmount: 0 };
    }

    async addToCart(productData) {
        // Always update localStorage immediately for responsiveness
        this.updateLocalStorageCart('add', productData);
        
        // If logged in, also sync with backend
        if (this.isLoggedIn) {
            await this.makeRequest('/cart/add', {
                method: 'POST',
                body: productData
            });
        }
    }

    async removeFromCart(productId) {
        // Always update localStorage immediately
        this.updateLocalStorageCart('remove', { id: productId });
        
        // If logged in, also sync with backend
        if (this.isLoggedIn) {
            await this.makeRequest(`/cart/remove/${productId}`, {
                method: 'DELETE'
            });
        }
    }

    async updateCartQuantity(productId, quantity) {
        // Always update localStorage immediately
        this.updateLocalStorageCart('update', { id: productId, quantity });
        
        // If logged in, also sync with backend
        if (this.isLoggedIn) {
            await this.makeRequest('/cart/update', {
                method: 'PUT',
                body: { productId, quantity }
            });
        }
    }

    // Wishlist methods - hybrid approach
    async getWishlist() {
        if (!this.isLoggedIn) {
            const savedWishlist = localStorage.getItem('wishlist');
            return savedWishlist ? JSON.parse(savedWishlist) : [];
        }

        const data = await this.makeRequest('/users/wishlist');
        if (data && data.success) {
            return data.wishlist;
        }
        
        // Fallback to localStorage
        const savedWishlist = localStorage.getItem('wishlist');
        return savedWishlist ? JSON.parse(savedWishlist) : [];
    }

    async addToWishlist(productData) {
        // Always update localStorage immediately
        this.updateLocalStorageWishlist('add', productData);
        
        // If logged in, also sync with backend
        if (this.isLoggedIn) {
            await this.makeRequest('/users/wishlist/add', {
                method: 'POST',
                body: { productId: productData.id }
            });
        }
    }

    async removeFromWishlist(productId) {
        // Always update localStorage immediately
        this.updateLocalStorageWishlist('remove', { id: productId });
        
        // If logged in, also sync with backend
        if (this.isLoggedIn) {
            await this.makeRequest(`/users/wishlist/remove/${productId}`, {
                method: 'DELETE'
            });
        }
    }

    // Helper methods for localStorage updates
    updateLocalStorageCart(action, data) {
        let cart = { items: [], totalAmount: 0 };
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }

        switch (action) {
            case 'add':
                const existingItemIndex = cart.items.findIndex(item => item.id === data.id);
                if (existingItemIndex >= 0) {
                    cart.items[existingItemIndex].quantity += (data.quantity || 1);
                } else {
                    cart.items.push({
                        id: data.id || Date.now().toString(),
                        name: data.name,
                        price: data.price,
                        image: data.image,
                        size: data.size,
                        quantity: data.quantity || 1
                    });
                }
                break;
            
            case 'remove':
                cart.items = cart.items.filter(item => item.id !== data.id);
                break;
            
            case 'update':
                const itemIndex = cart.items.findIndex(item => item.id === data.id);
                if (itemIndex >= 0) {
                    if (data.quantity <= 0) {
                        cart.items.splice(itemIndex, 1);
                    } else {
                        cart.items[itemIndex].quantity = data.quantity;
                    }
                }
                break;
        }

        // Recalculate total
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    updateLocalStorageWishlist(action, data) {
        let wishlist = [];
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            wishlist = JSON.parse(savedWishlist);
        }

        switch (action) {
            case 'add':
                const exists = wishlist.find(item => item.id === data.id);
                if (!exists) {
                    wishlist.push({
                        id: data.id || Date.now().toString(),
                        name: data.name,
                        price: data.price,
                        image: data.image,
                        addedAt: new Date().toISOString()
                    });
                }
                break;
            
            case 'remove':
                wishlist = wishlist.filter(item => item.id !== data.id);
                break;
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    // Sync localStorage data to backend after login
    async syncLocalStorageToBackend() {
        if (!this.isLoggedIn) return;
        
        try {
            console.log('Syncing localStorage data to backend...');
            
            // Sync cart data
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const cart = JSON.parse(savedCart);
                if (cart.items && cart.items.length > 0) {
                    const syncResult = await this.makeRequest('/cart/sync', {
                        method: 'POST',
                        body: { cartData: cart }
                    });
                    
                    if (syncResult && syncResult.success) {
                        console.log('Cart synced successfully:', syncResult.cart);
                        // Update localStorage with the merged backend cart
                        localStorage.setItem('cart', JSON.stringify(syncResult.cart));
                    }
                }
            }

            // Sync wishlist
            const savedWishlist = localStorage.getItem('wishlist');
            if (savedWishlist) {
                const wishlist = JSON.parse(savedWishlist);
                if (wishlist.length > 0) {
                    for (const item of wishlist) {
                        try {
                            await this.makeRequest('/users/wishlist/add', {
                                method: 'POST',
                                body: { productId: item.id }
                            });
                        } catch (error) {
                            console.warn('Failed to sync wishlist item:', item.name, error);
                        }
                    }
                }
            }
            
            console.log('LocalStorage sync completed successfully');
            
        } catch (error) {
            console.warn('Failed to sync localStorage to backend:', error);
        }
    }

    // Load backend cart data to localStorage
    async loadBackendCartToLocalStorage() {
        if (!this.isLoggedIn) return;
        
        try {
            console.log('Loading backend cart data to localStorage...');
            
            const cartData = await this.makeRequest('/cart');
            if (cartData && cartData.success && cartData.cart) {
                localStorage.setItem('cart', JSON.stringify(cartData.cart));
                console.log('Backend cart loaded to localStorage:', cartData.cart);
                
                // Update cart display if on cart page
                if (window.displayCartItems) {
                    window.displayCartItems();
                }
                if (window.updateCartCount) {
                    window.updateCartCount();
                }
            }
            
            const wishlistData = await this.makeRequest('/users/wishlist');
            if (wishlistData && wishlistData.success && wishlistData.wishlist) {
                localStorage.setItem('wishlist', JSON.stringify(wishlistData.wishlist));
                console.log('Backend wishlist loaded to localStorage');
                
                // Update wishlist display
                if (window.loadWishlistItems) {
                    window.loadWishlistItems();
                }
                if (window.updateHeartIcons) {
                    window.updateHeartIcons();
                }
            }
            
        } catch (error) {
            console.warn('Failed to load backend data to localStorage:', error);
        }
    }

    // Product methods
    async getProducts(filters = {}) {
        const data = await this.makeRequest('/products', {
            method: 'GET'
        });
        
        if (data && data.success) {
            return data.products;
        }
        
        return null; // Frontend should handle this gracefully
    }

    async getProduct(id) {
        const data = await this.makeRequest(`/products/${id}`);
        
        if (data && data.success) {
            return data.product;
        }
        
        return null;
    }

    // Order methods
    async createOrder(orderData) {
        if (!this.isLoggedIn) {
            throw new Error('Must be logged in to create order');
        }

        const data = await this.makeRequest('/orders', {
            method: 'POST',
            body: orderData
        });
        
        return data;
    }

    async getOrders() {
        if (!this.isLoggedIn) {
            return [];
        }

        const data = await this.makeRequest('/orders');
        
        if (data && data.success) {
            return data.orders;
        }
        
        return [];
    }

    // User profile methods
    async updateProfile(profileData) {
        if (!this.isLoggedIn) {
            throw new Error('Must be logged in to update profile');
        }

        const data = await this.makeRequest('/users/profile', {
            method: 'PUT',
            body: profileData
        });
        
        if (data && data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    }

    async getSustainabilityData() {
        if (!this.isLoggedIn) {
            return { points: 0, totalItems: 0, co2Saved: 0 };
        }

        const data = await this.makeRequest('/sustainability/stats');
        
        if (data && data.success) {
            return data.stats;
        }
        
        return { points: 0, totalItems: 0, co2Saved: 0 };
    }
}

// Create global API instance
window.apiClient = new ApiClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
