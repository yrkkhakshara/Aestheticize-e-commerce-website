// Enhanced cart functionality - hybrid localStorage + backend
console.log('Enhanced Cart JS loaded');

// Simple cart state - using localStorage with backend sync
let cart = { items: [], totalAmount: 0 };
let wishlist = [];

// API client will be loaded from api.js
let apiClient = null;

// Make functions globally accessible
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.showNotification = showNotification;
window.moveToCart = moveToCart;

// Enhanced load from storage with backend sync
async function loadFromStorage() {
    console.log('Loading cart and wishlist data...');
    
    // Initialize API client if available
    if (window.apiClient) {
        apiClient = window.apiClient;
        
        if (apiClient.isLoggedIn) {
            try {
                // Try to load from backend first
                const backendCart = await apiClient.getCart();
                const backendWishlist = await apiClient.getWishlist();
                
                if (backendCart) {
                    cart = backendCart;
                    localStorage.setItem('cart', JSON.stringify(cart));
                }
                
                if (backendWishlist) {
                    wishlist = backendWishlist;
                    localStorage.setItem('wishlist', JSON.stringify(wishlist));
                }
            } catch (error) {
                console.warn('Failed to load from backend, using localStorage:', error);
            }
        }
    }
    
    // Always ensure localStorage data is loaded (fallback)
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    
    console.log('🔍 Raw localStorage cart data:', savedCart);
    console.log('🔍 Raw localStorage wishlist data:', savedWishlist);
    
    if (savedCart && (!cart.items || cart.items.length === 0)) {
        cart = JSON.parse(savedCart);
        console.log('✅ Loaded cart from localStorage:', cart);
    }
    if (savedWishlist && wishlist.length === 0) {
        wishlist = JSON.parse(savedWishlist);
        console.log('✅ Loaded wishlist from localStorage:', wishlist);
    }
    
    console.log('🛒 Final loaded cart:', cart);
    console.log('❤️ Final loaded wishlist:', wishlist);
}

// Save data to localStorage
function saveToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Cart page loaded');
    
    // Load saved data
    loadFromStorage();
    
    // Simple initialization without complex authentication
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        console.log('📦 Cart items container found');
        console.log('🔍 Current cart state:', cart);
        
        if (cart.items && cart.items.length > 0) {
            console.log(`✅ Found ${cart.items.length} items in cart`);
            displayCartItems();
        } else {
            console.log('❌ No items found in cart');
            showEmptyCart();
        }
    } else {
        console.error('❌ cartItems container not found in DOM');
    }
    
    // Update cart count
    updateCartCount();
    
    // Add manual refresh capability for debugging
    window.refreshCart = function() {
        console.log('🔄 Manual cart refresh triggered');
        loadFromStorage();
        const cartItems = document.getElementById('cartItems');
        if (cartItems) {
            if (cart.items && cart.items.length > 0) {
                displayCartItems();
            } else {
                showEmptyCart();
            }
        }
        updateCartCount();
    };
    
    // Initialize user dropdown for cart page
    if (typeof updateUserInterface === 'function') {
        updateUserInterface();
    }
});

// Show empty cart
function showEmptyCart() {
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = `
            <div class="empty-cart text-center py-5">
                <i class="fas fa-shopping-cart" style="font-size: 80px; color: #ddd; margin-bottom: 20px;"></i>
                <h3>Your cart is empty</h3>
                <p class="text-muted">Looks like you haven't added any items to your cart yet.</p>
                <a href="index.html" class="btn btn-primary btn-lg">
                    <i class="fas fa-shopping-bag me-2"></i>Continue Shopping
                </a>
            </div>
        `;
    }
    
    // Hide cart summary
    const cartSummary = document.getElementById('cartSummary');
    if (cartSummary) {
        cartSummary.style.display = 'none';
    }
}

// Display cart items
function displayCartItems() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) {
        console.error('cartItems element not found');
        return;
    }
    
    console.log('🛒 Displaying cart items:', cart.items);
    
    if (!cart.items || cart.items.length === 0) {
        console.log('No items in cart');
        showEmptyCart();
        return;
    }
    
    cartItems.innerHTML = cart.items.map(item => `
        <div class="cart-item" data-item-id="${item.id}">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${item.image}" alt="${item.name}" class="img-fluid rounded" style="max-height: 80px; object-fit: cover;">
                </div>
                
                <div class="col-md-4">
                    <h5 class="mb-1">${item.name}</h5>
                    <p class="text-muted mb-0">
                        <small><i class="fas fa-tag me-1"></i>${item.brand || item.category || 'Unknown Brand'}</small>
                    </p>
                    <div class="sust mt-1">
                        ${item.sustainability ? Array(item.sustainability).fill('<i class="fa-solid fa-leaf text-success"></i>').join('') : ''}
                    </div>
                </div>
                
                <div class="col-md-2">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="mx-2 fw-bold">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                
                <div class="col-md-2">
                    <div class="text-center">
                        <div class="fw-bold">₹${item.price * item.quantity}</div>
                        <small class="text-muted">₹${item.price} each</small>
                    </div>
                </div>
                
                <div class="col-md-2 text-end">
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash me-1"></i>Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    updateCartSummary();
    
    // Show cart summary
    const cartSummary = document.getElementById('cartSummary');
    if (cartSummary) {
        cartSummary.style.display = 'block';
    }
}

// Update cart summary
function updateCartSummary() {
    if (!cart.items || cart.items.length === 0) return;
    
    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `₹${subtotal}`;
    document.getElementById('tax').textContent = `₹${tax}`;
    document.getElementById('total').textContent = `₹${total}`;
    
    cart.totalAmount = total;
    saveToStorage();
}

// Update cart count
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
        cartCount.textContent = totalItems;
    }
}

// Add to cart function
// Enhanced add to cart with backend sync
async function addToCart(productData) {
    console.log('Adding to cart:', productData);
    
    try {
        // Use API client if available for hybrid approach
        if (apiClient) {
            await apiClient.addToCart(productData);
        } else {
            // Fallback to direct localStorage update
            const existingItemIndex = cart.items.findIndex(item => item.id === productData.id);
            
            if (existingItemIndex >= 0) {
                cart.items[existingItemIndex].quantity += (productData.quantity || 1);
            } else {
                cart.items.push({
                    id: productData.id || Date.now().toString(),
                    name: productData.name || 'Unknown Product',
                    price: parseFloat(productData.price) || 0,
                    image: productData.image || '/images/placeholder.jpg',
                    size: productData.size || 'N/A',
                    quantity: parseInt(productData.quantity) || 1,
                    sustainability: productData.sustainability || 0
                });
            }
            
            // Recalculate total
            cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            saveToStorage();
        }
        
        // Always reload from storage to get the latest state
        await loadFromStorage();
        updateCartDisplay();
        showNotification('Item added to cart successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart', 'error');
    }
}

// Remove from cart
function removeFromCart(productId) {
    cart.items = cart.items.filter(item => item.id !== productId);
    saveToStorage();
    
    if (cart.items.length === 0) {
        showEmptyCart();
    } else {
        displayCartItems();
    }
    
    updateCartCount();
    showNotification('Item removed from cart', 'info');
}

// Update quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const item = cart.items.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveToStorage();
        displayCartItems();
        updateCartCount();
    }
}

// Add to wishlist function
// Enhanced add to wishlist with backend sync
async function addToWishlist(productData) {
    console.log('Adding to wishlist:', productData);
    
    try {
        // Use API client if available for hybrid approach
        if (apiClient) {
            await apiClient.addToWishlist(productData);
        } else {
            // Fallback to direct localStorage update
            const exists = wishlist.find(item => item.id === productData.id);
            if (!exists) {
                wishlist.push({
                    id: productData.id || Date.now().toString(),
                    name: productData.name || 'Unknown Product',
                    price: parseFloat(productData.price) || 0,
                    image: productData.image || '/images/placeholder.jpg',
                    addedAt: new Date().toISOString()
                });
                saveToStorage();
            }
        }
        
        // Always reload from storage to get the latest state
        await loadFromStorage();
        showNotification('Item added to wishlist!', 'success');
        
        // Update heart icons if on product page
        updateHeartIcons();
        
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification('Failed to add item to wishlist', 'error');
    }
}// Show notification
function showNotification(message, type = 'info') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.wishlist-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed wishlist-notification`;
    notification.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 9999; 
        min-width: 350px;
        max-width: 400px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        border: none;
        border-radius: 12px;
        font-weight: 500;
        font-size: 14px;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <i class="fas fa-heart me-2" style="color: #dc3545;"></i>
            ${message}
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            notification.classList.add('fade');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 150);
        }
    }, 4000);
}
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function proceedToCheckout() {
    if (!cart.items || cart.items.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    showNotification('Checkout functionality will be implemented soon!', 'info');
}
