// Wishlist JavaScript functionality
const API_BASE_URL = 'http://localhost:5001/api';

let currentUser = null;
let wishlistItems = [];

// Initialize wishlist page
document.addEventListener('DOMContentLoaded', async function() {
    await initializeWishlistPage();
});

// Initialize wishlist page functionality
async function initializeWishlistPage() {
    try {
        // Check authentication
        await checkAuthStatus();
        
        // Load wishlist items
        await loadWishlistItems();
        
    } catch (error) {
        console.error('Error initializing wishlist page:', error);
        showNotification('Error loading wishlist', 'error');
    }
}

// Check authentication status
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        currentUser = JSON.parse(userData);
        updateUserInterface();
        updateCartCount();
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
    }
}

// Update user interface
function updateUserInterface() {
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userDropdown = document.getElementById('userDropdown');
    
    if (currentUser && userDropdownMenu) {
        userDropdown.innerHTML = `
            <i class="fas fa-user me-1"></i>
            Hello, ${currentUser.name.split(' ')[0]}!
        `;
        
        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="profile.html">
                <i class="fas fa-user me-2"></i>Profile
            </a></li>
            <li><a class="dropdown-item active" href="wishlist.html">
                <i class="fas fa-heart me-2"></i>Wishlist
            </a></li>
            <li><a class="dropdown-item" href="orders.html">
                <i class="fas fa-box me-2"></i>Orders
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt me-2"></i>Logout
            </a></li>
        `;
    }
}

// Load wishlist items
async function loadWishlistItems() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/wishlist`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            wishlistItems = data.data;
            displayWishlistItems();
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Error loading wishlist:', error);
        displayEmptyWishlist();
    }
}

// Display wishlist items
function displayWishlistItems() {
    const wishlistContainer = document.getElementById('wishlistItems');
    
    if (!wishlistItems || wishlistItems.length === 0) {
        displayEmptyWishlist();
        return;
    }
    
    wishlistContainer.innerHTML = wishlistItems.map(item => `
        <div class="wishlist-item">
            <div class="product-badge">${item.aesthetic}</div>
            <div class="row align-items-center">
                <div class="col-md-3">
                    <img src="${item.images[0]?.url || './images/cl1.jpeg'}" 
                         alt="${item.name}" 
                         class="img-fluid rounded"
                         style="height: 150px; width: 100%; object-fit: cover;">
                </div>
                
                <div class="col-md-6">
                    <h4 class="mb-2">${item.name}</h4>
                    <p class="text-muted mb-2">${item.description}</p>
                    
                    <div class="mb-2">
                        <span class="fw-bold fs-4 text-success">₹${item.price}</span>
                        ${item.discountPrice > 0 ? `<span class="text-muted text-decoration-line-through ms-2">₹${item.discountPrice}</span>` : ''}
                    </div>
                    
                    <div class="sustainability-indicators">
                        ${item.sustainability?.rating >= 4 ? '<span class="sustainability-badge badge-eco"><i class="fas fa-leaf me-1"></i>Eco-Friendly</span>' : ''}
                        ${item.thriftStore?.verified ? '<span class="sustainability-badge badge-thrift"><i class="fas fa-recycle me-1"></i>Thrift Store</span>' : ''}
                        ${item.isUnique ? '<span class="sustainability-badge badge-unique"><i class="fas fa-gem me-1"></i>Unique</span>' : ''}
                    </div>
                    
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-store me-1"></i>${item.thriftStore?.name} - ${item.thriftStore?.location}
                        </small>
                    </div>
                    
                    <div class="mt-2">
                        <small class="text-success">
                            <i class="fas fa-leaf me-1"></i>CO₂ Saved: ${item.sustainability?.co2Savings || 0}kg
                            <i class="fas fa-tint ms-3 me-1"></i>Water Saved: ${item.sustainability?.waterSaved || 0}L
                        </small>
                    </div>
                </div>
                
                <div class="col-md-3 text-end">
                    <div class="d-grid gap-2">
                        <button class="btn btn-add-cart" onclick="addToCartFromWishlist('${item._id}')">
                            <i class="fas fa-shopping-cart me-2"></i>Add to Cart
                        </button>
                        
                        <button class="btn btn-remove" onclick="removeFromWishlist('${item._id}')">
                            <i class="fas fa-trash me-2"></i>Remove
                        </button>
                        
                        <a href="#" class="btn btn-outline-primary" onclick="viewProduct('${item._id}')">
                            <i class="fas fa-eye me-2"></i>View Details
                        </a>
                    </div>
                    
                    <div class="mt-3">
                        <small class="text-muted">
                            ${item.sizes?.length > 0 ? `Available sizes: ${item.sizes.map(s => s.size).join(', ')}` : 'One size fits all'}
                        </small>
                    </div>
                    
                    <div class="mt-2">
                        <div class="d-flex align-items-center">
                            <div class="me-2">
                                ${generateStarRating(item.ratings?.average || 0)}
                            </div>
                            <small class="text-muted">(${item.ratings?.count || 0} reviews)</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Display empty wishlist
function displayEmptyWishlist() {
    const wishlistContainer = document.getElementById('wishlistItems');
    wishlistContainer.innerHTML = `
        <div class="empty-wishlist">
            <i class="fas fa-heart-broken"></i>
            <h3>Your wishlist is empty</h3>
            <p class="text-muted">Start adding items you love to your wishlist!</p>
            <p class="text-muted">Browse our sustainable fashion collection and save items for later.</p>
            <a href="index.html" class="btn btn-primary btn-lg">
                <i class="fas fa-shopping-bag me-2"></i>Explore Products
            </a>
        </div>
    `;
}

// Add item from wishlist to cart
async function addToCartFromWishlist(productId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1,
                size: 'M' // Default size, could be improved with size selector
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Item added to cart!', 'success');
            updateCartCount();
        } else {
            showNotification(data.message || 'Failed to add item to cart', 'error');
        }
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding item to cart', 'error');
    }
}

// Remove item from wishlist
async function removeFromWishlist(productId) {
    if (!confirm('Are you sure you want to remove this item from your wishlist?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/wishlist/remove`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: productId })
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Item removed from wishlist!', 'success');
            await loadWishlistItems(); // Reload wishlist
        } else {
            showNotification(data.message || 'Failed to remove item', 'error');
        }
        
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showNotification('Error removing item', 'error');
    }
}

// View product details (placeholder function)
function viewProduct(productId) {
    // This would navigate to a product detail page
    showNotification('Product details page coming soon!', 'info');
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star text-warning"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star text-warning"></i>';
    }
    
    return starsHtml;
}

// Update cart count
async function updateCartCount() {
    try {
        const token = localStorage.getItem('token');
        const cartCount = document.getElementById('cartCount');
        
        if (!token || !cartCount) return;
        
        const response = await fetch(`${API_BASE_URL}/cart/count`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            cartCount.textContent = data.count || 0;
        }
        
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Handle logout
function handleLogout() {
    logout();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}
