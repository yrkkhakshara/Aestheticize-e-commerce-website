// Enhanced cart integration - bridges localStorage with backend
// This file enhances existing cart functionality with backend sync

(function() {
    'use strict';
    
    console.log('Loading enhanced cart integration...');
    
    let apiClient = null;
    let isInitialized = false;
    
    // Wait for both API client and cart to be ready
    function waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                if (window.apiClient && window.addToCart && window.addToWishlist) {
                    apiClient = window.apiClient;
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }
    
    // Initialize enhanced functionality
    async function initialize() {
        if (isInitialized) return;
        
        await waitForDependencies();
        console.log('Initializing enhanced cart functionality...');
        
        // Store original functions
        const originalAddToCart = window.addToCart;
        const originalAddToWishlist = window.addToWishlist;
        const originalRemoveFromCart = window.removeFromCart;
        const originalUpdateQuantity = window.updateQuantity;
        
        // Enhanced add to cart with backend sync
        window.addToCart = async function(productData) {
            console.log('Enhanced: Adding to cart:', productData);
            
            try {
                // Always call original function first (localStorage for immediate response)
                originalAddToCart(productData);
                
                // If logged in, sync with persistent backend
                if (apiClient && apiClient.isLoggedIn) {
                    try {
                        const backendResponse = await apiClient.makeRequest('/cart/add', {
                            method: 'POST',
                            body: {
                                productId: productData.id,
                                name: productData.name,
                                price: productData.price,
                                size: productData.size,
                                image: productData.image,
                                quantity: productData.quantity || 1
                            }
                        });
                        
                        if (backendResponse && backendResponse.success) {
                            console.log('Cart synced with persistent backend:', backendResponse.cart);
                            // Update localStorage with backend cart for consistency
                            localStorage.setItem('cart', JSON.stringify(backendResponse.cart));
                            
                            // Update cart display
                            if (window.displayCartItems) window.displayCartItems();
                            if (window.updateCartCount) window.updateCartCount();
                        }
                    } catch (error) {
                        console.warn('Backend sync failed for cart, continuing with localStorage:', error);
                    }
                }
            } catch (error) {
                console.error('Error in enhanced addToCart:', error);
                // Fallback to original function
                originalAddToCart(productData);
            }
        };
        
        // Enhanced add to wishlist with backend sync
        window.addToWishlist = async function(productData) {
            console.log('Enhanced: Adding to wishlist:', productData);
            
            try {
                // Always call original function first (localStorage)
                originalAddToWishlist(productData);
                
                // If logged in, sync with backend
                if (apiClient && apiClient.isLoggedIn) {
                    try {
                        await apiClient.makeRequest('/users/wishlist/add', {
                            method: 'POST',
                            body: { productId: productData.id }
                        });
                        console.log('Wishlist synced with backend');
                    } catch (error) {
                        console.warn('Backend sync failed for wishlist, continuing with localStorage:', error);
                    }
                }
            } catch (error) {
                console.error('Error in enhanced addToWishlist:', error);
                // Fallback to original function
                originalAddToWishlist(productData);
            }
        };
        
        // Enhanced remove from cart with backend sync
        window.removeFromCart = async function(productId) {
            console.log('Enhanced: Removing from cart:', productId);
            
            try {
                // Always call original function first (localStorage for immediate response)
                originalRemoveFromCart(productId);
                
                // If logged in, sync with persistent backend
                if (apiClient && apiClient.isLoggedIn) {
                    try {
                        const backendResponse = await apiClient.makeRequest(`/cart/remove/${productId}`, {
                            method: 'DELETE'
                        });
                        
                        if (backendResponse && backendResponse.success) {
                            console.log('Cart removal synced with persistent backend:', backendResponse.cart);
                            // Update localStorage with backend cart for consistency
                            localStorage.setItem('cart', JSON.stringify(backendResponse.cart));
                            
                            // Update cart display
                            if (window.displayCartItems) window.displayCartItems();
                            if (window.updateCartCount) window.updateCartCount();
                        }
                    } catch (error) {
                        console.warn('Backend sync failed for cart removal, continuing with localStorage:', error);
                    }
                }
            } catch (error) {
                console.error('Error in enhanced removeFromCart:', error);
                // Fallback to original function
                originalRemoveFromCart(productId);
            }
        };
        
        // Enhanced update quantity with backend sync
        window.updateQuantity = async function(productId, newQuantity) {
            console.log('Enhanced: Updating quantity:', productId, newQuantity);
            
            try {
                // Always call original function first (localStorage for immediate response)
                originalUpdateQuantity(productId, newQuantity);
                
                // If logged in, sync with persistent backend
                if (apiClient && apiClient.isLoggedIn) {
                    try {
                        const backendResponse = await apiClient.makeRequest('/cart/update', {
                            method: 'PUT',
                            body: { productId, quantity: newQuantity }
                        });
                        
                        if (backendResponse && backendResponse.success) {
                            console.log('Quantity update synced with persistent backend:', backendResponse.cart);
                            // Update localStorage with backend cart for consistency
                            localStorage.setItem('cart', JSON.stringify(backendResponse.cart));
                            
                            // Update cart display
                            if (window.displayCartItems) window.displayCartItems();
                            if (window.updateCartCount) window.updateCartCount();
                        }
                    } catch (error) {
                        console.warn('Backend sync failed for quantity update, continuing with localStorage:', error);
                    }
                }
            } catch (error) {
                console.error('Error in enhanced updateQuantity:', error);
                // Fallback to original function
                originalUpdateQuantity(productId, newQuantity);
            }
        };
        
        // Add new functions that don't exist in original
        window.removeFromWishlist = async function(productId) {
            console.log('Enhanced: Removing from wishlist:', productId);
            
            try {
                // Update localStorage
                const savedWishlist = localStorage.getItem('wishlist');
                if (savedWishlist) {
                    let wishlist = JSON.parse(savedWishlist);
                    wishlist = wishlist.filter(item => item.id !== productId);
                    localStorage.setItem('wishlist', JSON.stringify(wishlist));
                }
                
                // If logged in, sync with backend
                if (apiClient && apiClient.isLoggedIn) {
                    try {
                        await apiClient.makeRequest(`/users/wishlist/remove/${productId}`, {
                            method: 'DELETE'
                        });
                        console.log('Wishlist removal synced with backend');
                    } catch (error) {
                        console.warn('Backend sync failed for wishlist removal:', error);
                    }
                }
                
                // Update UI
                if (window.showNotification) {
                    window.showNotification('Item removed from wishlist', 'success');
                }
                
                // Update heart icons if available
                if (window.updateHeartIcons) {
                    window.updateHeartIcons();
                }
                
                // Reload wishlist if on wishlist page
                if (window.loadWishlistItems && document.getElementById('wishlistItems')) {
                    window.loadWishlistItems();
                }
                
            } catch (error) {
                console.error('Error removing from wishlist:', error);
                if (window.showNotification) {
                    window.showNotification('Failed to remove from wishlist', 'error');
                }
            }
        };
        
        window.moveToCart = async function(productId) {
            console.log('Enhanced: Moving to cart:', productId);
            
            try {
                // Get item from wishlist
                const savedWishlist = localStorage.getItem('wishlist');
                if (!savedWishlist) return;
                
                const wishlist = JSON.parse(savedWishlist);
                const item = wishlist.find(w => w.id === productId);
                
                if (!item) {
                    if (window.showNotification) {
                        window.showNotification('Item not found in wishlist', 'error');
                    }
                    return;
                }
                
                // Add to cart
                const cartData = {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    quantity: 1
                };
                
                await window.addToCart(cartData);
                await window.removeFromWishlist(productId);
                
                if (window.showNotification) {
                    window.showNotification('Item moved to cart!', 'success');
                }
                
            } catch (error) {
                console.error('Error moving to cart:', error);
                if (window.showNotification) {
                    window.showNotification('Failed to move item to cart', 'error');
                }
            }
        };
        
        // Sync localStorage with backend on login
        window.syncWithBackend = async function() {
            if (!apiClient || !apiClient.isLoggedIn) return;
            
            console.log('Syncing localStorage data with backend...');
            
            try {
                // Sync cart
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    const cart = JSON.parse(savedCart);
                    if (cart.items && cart.items.length > 0) {
                        for (const item of cart.items) {
                            try {
                                await apiClient.makeRequest('/cart/add', {
                                    method: 'POST',
                                    body: {
                                        productId: item.id,
                                        name: item.name,
                                        price: item.price,
                                        size: item.size,
                                        image: item.image,
                                        quantity: item.quantity
                                    }
                                });
                            } catch (error) {
                                console.warn('Failed to sync cart item:', item.name, error);
                            }
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
                                await apiClient.makeRequest('/users/wishlist/add', {
                                    method: 'POST',
                                    body: { productId: item.id }
                                });
                            } catch (error) {
                                console.warn('Failed to sync wishlist item:', item.name, error);
                            }
                        }
                    }
                }
                
                console.log('Sync completed successfully');
                
            } catch (error) {
                console.warn('Sync with backend failed:', error);
            }
        };
        
        // Load backend data on page load if logged in
        window.loadFromBackend = async function() {
            if (!apiClient || !apiClient.isLoggedIn) return;
            
            console.log('Loading persistent cart data from backend...');
            
            try {
                // Load cart from backend
                const cartData = await apiClient.makeRequest('/cart');
                if (cartData && cartData.success) {
                    console.log('Persistent cart loaded from backend:', cartData.cart);
                    localStorage.setItem('cart', JSON.stringify(cartData.cart));
                    
                    // Show success message
                    if (window.showNotification) {
                        window.showNotification(`Welcome back! Loaded ${cartData.itemCount} items from your cart.`, 'success');
                    }
                }
                
                // Load wishlist from backend
                const wishlistData = await apiClient.makeRequest('/users/wishlist');
                if (wishlistData && wishlistData.success) {
                    localStorage.setItem('wishlist', JSON.stringify(wishlistData.wishlist));
                    console.log('Wishlist loaded from backend');
                }
                
                // Refresh displays
                if (window.displayCartItems) {
                    window.displayCartItems();
                }
                if (window.loadWishlistItems) {
                    window.loadWishlistItems();
                }
                if (window.updateCartCount) {
                    window.updateCartCount();
                }
                if (window.updateHeartIcons) {
                    window.updateHeartIcons();
                }
                
            } catch (error) {
                console.warn('Failed to load from backend:', error);
                if (window.showNotification) {
                    window.showNotification('Welcome back! Using local cart data.', 'info');
                }
            }
        };

        // Clear persistent cart (useful for logout or order completion)
        window.clearPersistentCart = async function() {
            console.log('Clearing persistent cart...');
            
            try {
                // Clear localStorage
                localStorage.removeItem('cart');
                localStorage.setItem('cart', JSON.stringify({ items: [], totalAmount: 0 }));
                
                // Clear backend cart if logged in
                if (apiClient && apiClient.isLoggedIn) {
                    await apiClient.makeRequest('/cart/clear', {
                        method: 'DELETE'
                    });
                    console.log('Backend cart cleared');
                }
                
                // Update displays
                if (window.displayCartItems) window.displayCartItems();
                if (window.updateCartCount) window.updateCartCount();
                
                if (window.showNotification) {
                    window.showNotification('Cart cleared successfully', 'success');
                }
                
            } catch (error) {
                console.error('Error clearing persistent cart:', error);
                if (window.showNotification) {
                    window.showNotification('Failed to clear cart', 'error');
                }
            }
        };
        
        isInitialized = true;
        console.log('Enhanced cart integration initialized successfully');
        
        // Auto-load from backend if user is logged in
        if (apiClient && apiClient.isLoggedIn) {
            await window.loadFromBackend();
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
