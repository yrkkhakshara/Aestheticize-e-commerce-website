// Orders JavaScript functionality
const API_BASE_URL = 'http://localhost:5001/api';

let currentUser = null;
let allOrders = [];
let filteredOrders = [];

// Initialize orders page
document.addEventListener('DOMContentLoaded', async function() {
    await initializeOrdersPage();
});

// Initialize orders page functionality
async function initializeOrdersPage() {
    try {
        // Check authentication
        await checkAuthStatus();
        
        // Load orders
        await loadOrders();
        
    } catch (error) {
        console.error('Error initializing orders page:', error);
        showNotification('Error loading orders', 'error');
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
            <li><a class="dropdown-item" href="wishlist.html">
                <i class="fas fa-heart me-2"></i>Wishlist
            </a></li>
            <li><a class="dropdown-item active" href="orders.html">
                <i class="fas fa-box me-2"></i>Orders
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt me-2"></i>Logout
            </a></li>
        `;
    }
}

// Load orders
async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            allOrders = data.data;
            filteredOrders = [...allOrders];
            displayOrders();
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Error loading orders:', error);
        displayEmptyOrders();
    }
}

// Display orders
function displayOrders() {
    const ordersContainer = document.getElementById('ordersList');
    
    if (!filteredOrders || filteredOrders.length === 0) {
        displayEmptyOrders();
        return;
    }
    
    ordersContainer.innerHTML = filteredOrders.map(order => {
        const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalSustainabilityPoints = calculateSustainabilityPoints(order);
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h5 class="mb-1">
                                <i class="fas fa-receipt me-2"></i>
                                Order #${order._id.slice(-8)}
                            </h5>
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                Placed on ${new Date(order.createdAt).toLocaleDateString()}
                            </small>
                        </div>
                        <div class="col-md-3 text-center">
                            <div class="fw-bold fs-5">₹${totalAmount}</div>
                            <small class="text-muted">${order.items.length} item${order.items.length > 1 ? 's' : ''}</small>
                        </div>
                        <div class="col-md-3 text-end">
                            <span class="order-status status-${order.status}">
                                ${capitalizeFirst(order.status)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="order-body">
                    <!-- Order Items -->
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <img src="${item.product?.images?.[0]?.url || './images/cl1.jpeg'}" 
                                     alt="${item.product?.name || 'Product'}" 
                                     class="order-item-image">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1">${item.product?.name || 'Product'}</h6>
                                    <p class="mb-1 text-muted">
                                        <small>
                                            <i class="fas fa-tag me-1"></i>${item.product?.aesthetic || 'N/A'}
                                            <i class="fas fa-tshirt ms-3 me-1"></i>Size: ${item.size}
                                            <i class="fas fa-times ms-3 me-1"></i>Quantity: ${item.quantity}
                                        </small>
                                    </p>
                                    <div class="fw-bold text-success">₹${item.price} each</div>
                                </div>
                                <div class="text-end">
                                    <div class="fw-bold">₹${item.price * item.quantity}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Sustainability Impact -->
                    <div class="sustainability-impact">
                        <div class="row text-center">
                            <div class="col-md-4">
                                <div class="fw-bold fs-4">+${totalSustainabilityPoints}</div>
                                <small>Sustainability Points Earned</small>
                            </div>
                            <div class="col-md-4">
                                <div class="fw-bold fs-4">${calculateCO2Saved(order)} kg</div>
                                <small>CO₂ Saved</small>
                            </div>
                            <div class="col-md-4">
                                <div class="fw-bold fs-4">${calculateWaterSaved(order)} L</div>
                                <small>Water Conserved</small>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Order Actions -->
                    <div class="order-actions">
                        ${getOrderActions(order)}
                    </div>
                    
                    <!-- Shipping Address -->
                    ${order.shippingAddress ? `
                        <div class="mt-3">
                            <h6><i class="fas fa-map-marker-alt me-2"></i>Shipping Address</h6>
                            <div class="text-muted">
                                <small>
                                    ${order.shippingAddress.fullName}<br>
                                    ${order.shippingAddress.street}<br>
                                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                                </small>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Order Timeline -->
                    <div class="mt-3">
                        <h6><i class="fas fa-route me-2"></i>Order Status</h6>
                        <div class="order-timeline">
                            ${generateOrderTimeline(order)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display empty orders
function displayEmptyOrders() {
    const ordersContainer = document.getElementById('ordersList');
    ordersContainer.innerHTML = `
        <div class="empty-orders">
            <i class="fas fa-box-open"></i>
            <h3>No orders yet</h3>
            <p class="text-muted">You haven't placed any orders yet.</p>
            <p class="text-muted">Start shopping for sustainable fashion and your orders will appear here!</p>
            <a href="index.html" class="btn btn-primary btn-lg">
                <i class="fas fa-shopping-bag me-2"></i>Start Shopping
            </a>
        </div>
    `;
}

// Calculate sustainability points for an order
function calculateSustainabilityPoints(order) {
    return order.items.reduce((points, item) => {
        const sustainabilityRating = item.product?.sustainability?.rating || 0;
        return points + (sustainabilityRating * item.quantity * 10);
    }, 0);
}

// Calculate CO2 saved for an order
function calculateCO2Saved(order) {
    return order.items.reduce((co2, item) => {
        const co2Savings = item.product?.sustainability?.co2Savings || 0;
        return co2 + (co2Savings * item.quantity);
    }, 0);
}

// Calculate water saved for an order
function calculateWaterSaved(order) {
    return order.items.reduce((water, item) => {
        const waterSaved = item.product?.sustainability?.waterSaved || 0;
        return water + (waterSaved * item.quantity);
    }, 0);
}

// Get order actions based on status
function getOrderActions(order) {
    const actions = [];
    
    switch (order.status) {
        case 'pending':
            actions.push(`<button class="btn btn-outline-danger btn-sm" onclick="cancelOrder('${order._id}')">
                <i class="fas fa-times me-1"></i>Cancel Order
            </button>`);
            break;
        case 'processing':
        case 'shipped':
            actions.push(`<button class="btn btn-track btn-sm" onclick="trackOrder('${order._id}')">
                <i class="fas fa-truck me-1"></i>Track Order
            </button>`);
            break;
        case 'delivered':
            actions.push(`<button class="btn btn-outline-primary btn-sm" onclick="reorderItems('${order._id}')">
                <i class="fas fa-redo me-1"></i>Reorder
            </button>`);
            actions.push(`<button class="btn btn-outline-warning btn-sm" onclick="rateOrder('${order._id}')">
                <i class="fas fa-star me-1"></i>Rate & Review
            </button>`);
            break;
    }
    
    actions.push(`<button class="btn btn-outline-info btn-sm" onclick="downloadInvoice('${order._id}')">
        <i class="fas fa-download me-1"></i>Invoice
    </button>`);
    
    return actions.join('');
}

// Generate order timeline
function generateOrderTimeline(order) {
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    
    return statuses.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;
        
        return `
            <div class="timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                <div class="timeline-marker">
                    <i class="fas fa-${getStatusIcon(status)}"></i>
                </div>
                <div class="timeline-content">
                    <strong>${capitalizeFirst(status)}</strong>
                    ${isCompleted ? '<br><small class="text-muted">Completed</small>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        pending: 'clock',
        processing: 'cog',
        shipped: 'truck',
        delivered: 'check-circle'
    };
    return icons[status] || 'question';
}

// Filter orders
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    if (statusFilter) {
        filteredOrders = allOrders.filter(order => order.status === statusFilter);
    } else {
        filteredOrders = [...allOrders];
    }
    
    displayOrders();
}

// Sort orders
function sortOrders() {
    const sortOrder = document.getElementById('sortOrder').value;
    
    switch (sortOrder) {
        case 'newest':
            filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filteredOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'amount-high':
            filteredOrders.sort((a, b) => {
                const aTotal = a.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const bTotal = b.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return bTotal - aTotal;
            });
            break;
        case 'amount-low':
            filteredOrders.sort((a, b) => {
                const aTotal = a.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const bTotal = b.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return aTotal - bTotal;
            });
            break;
    }
    
    displayOrders();
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Order cancelled successfully!', 'success');
            await loadOrders(); // Reload orders
        } else {
            showNotification(data.message || 'Failed to cancel order', 'error');
        }
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Error cancelling order', 'error');
    }
}

// Track order (placeholder)
function trackOrder(orderId) {
    showNotification('Order tracking feature coming soon!', 'info');
}

// Reorder items (placeholder)
function reorderItems(orderId) {
    showNotification('Reorder feature coming soon!', 'info');
}

// Rate order (placeholder)
function rateOrder(orderId) {
    showNotification('Rating and review feature coming soon!', 'info');
}

// Download invoice (placeholder)
function downloadInvoice(orderId) {
    showNotification('Invoice download feature coming soon!', 'info');
}

// Utility function to capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
