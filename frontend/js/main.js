// Main page functionality - fixed version
console.log('🚀 Main.js loading...');

// Global function to add product to cart from product listing
window.addProductToCart = async function(productId, name, price, image, brand) {
    console.log('🛒 Adding product to cart:', { productId, name, price, image, brand });
    
    try {
        // Show immediate feedback to user
        if (window.showNotification) {
            window.showNotification(`Adding ${name} to cart...`, 'info');
        }
        
        const productData = {
            id: productId,
            name: name,
            price: parseFloat(price),
            image: image,
            brand: brand,
            size: 'One Size', // Default size, can be enhanced with size selection
            quantity: 1,
            sustainability: 3 // Default sustainability rating based on leaf count
        };
        
        console.log('🔍 Product data prepared:', productData);
        
        // Use the existing addToCart function (which handles both localStorage and backend)
        if (window.addToCart) {
            console.log('✅ addToCart function found, calling it...');
            await window.addToCart(productData);
            
            // Enhanced visual feedback
            if (event && event.target) {
                const cartIcon = event.target;
                console.log('🎯 Adding animation to cart icon');
                
                // Add success animation class
                cartIcon.classList.add('added');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    cartIcon.classList.remove('added');
                }, 1500);
            }
            
            // Update cart count in navbar
            updateCartCount();
            
            // Show success notification
            if (window.showNotification) {
                window.showNotification(`✅ ${name} added to cart!`, 'success');
            } else {
                alert(`${name} added to cart!`);
            }
            
            console.log('✅ Product successfully added to cart');
            
        } else {
            console.error('❌ addToCart function not available, using fallback');
            
            // Fallback: add directly to localStorage if cart functions not loaded
            const savedCart = localStorage.getItem('cart');
            let cart = savedCart ? JSON.parse(savedCart) : { items: [], totalAmount: 0 };
            
            console.log('💾 Current cart before adding:', cart);
            
            // Check if product already exists
            const existingIndex = cart.items.findIndex(item => item.id === productId);
            if (existingIndex >= 0) {
                cart.items[existingIndex].quantity += 1;
                console.log('📦 Updated existing product quantity');
            } else {
                cart.items.push(productData);
                console.log('🆕 Added new product to cart');
            }
            
            // Recalculate total
            cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            console.log('💾 Cart saved to localStorage:', cart);
            console.log('🔍 Verifying localStorage save:', JSON.parse(localStorage.getItem('cart')));
            
            // Show notification
            if (window.showNotification) {
                window.showNotification(`✅ ${name} added to cart!`, 'success');
            } else {
                alert(`${name} added to cart!`);
            }
            
            updateCartCount();
        }
        
    } catch (error) {
        console.error('❌ Error adding product to cart:', error);
        if (window.showNotification) {
            window.showNotification('❌ Failed to add product to cart', 'error');
        } else {
            alert('Failed to add product to cart: ' + error.message);
        }
    }
};

// Function to update cart count in navbar
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
        const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
        
        // Update any cart count elements in the navbar
        const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'inline' : 'none';
        });
        
        console.log('Cart count updated:', totalItems);
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Initialize user dropdown if on cart page
    if (window.location.pathname.includes('cart.html')) {
        initializeCartPageDropdown();
    }
});

// Initialize dropdown for cart page specifically
function initializeCartPageDropdown() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userDropdown = document.getElementById('userDropdown');
    
    if (currentUser && userDropdownMenu && userDropdown) {
        console.log('👤 Initializing cart page dropdown for user:', currentUser.name);
        
        userDropdown.innerHTML = `
            <i class="fas fa-user me-1"></i>
            Hello, ${currentUser.name.split(' ')[0]}!
        `;
        
        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="profile.html">
                <i class="fas fa-user me-2"></i>Profile
            </a></li>
            <li><a class="dropdown-item" href="wishlist.html">
                <i class="fas fa-heart me-2"></i>Wishlist
            </a></li>
            <li><a class="dropdown-item" href="orders.html">
                <i class="fas fa-box me-2"></i>Orders
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="handleCartLogout()">
                <i class="fas fa-sign-out-alt me-2"></i>Logout
            </a></li>
        `;
    } else if (userDropdownMenu) {
        console.log('👤 No user logged in, showing login/register options');
        
        if (userDropdown) {
            userDropdown.innerHTML = `
                <i class="fas fa-user me-1"></i> Account
            `;
        }
        
        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="login.html">
                <i class="fas fa-sign-in-alt me-2"></i>Login
            </a></li>
            <li><a class="dropdown-item" href="register.html">
                <i class="fas fa-user-plus me-2"></i>Register
            </a></li>
        `;
    }
}

// Handle logout specifically for cart page
window.handleCartLogout = function() {
    if (window.logout) {
        window.logout();
    } else {
        // Fallback logout
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
};

// Simple notification system
window.showNotification = function(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.toast-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Determine alert type
    let alertType = 'success';
    if (type === 'error') alertType = 'danger';
    if (type === 'info') alertType = 'info';
    if (type === 'warning') alertType = 'warning';
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification alert alert-${alertType} alert-dismissible fade show`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds (longer for better visibility)
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
};

console.log('✅ Main.js loaded completely');
