// Profile JavaScript functionality
const API_BASE_URL = 'http://localhost:5001/api';

let currentUser = null;
let userProfile = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function() {
    await initializeProfilePage();
});

// Initialize profile page functionality
async function initializeProfilePage() {
    try {
        // Check authentication
        await checkAuthStatus();
        
        // Load user profile
        await loadUserProfile();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing profile page:', error);
        showNotification('Error loading profile', 'error');
    }
}

// Check authentication status
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        currentUser = JSON.parse(userData);
        updateUserInterface();
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
            <li><a class="dropdown-item active" href="profile.html">
                <i class="fas fa-user me-2"></i>Profile
            </a></li>
            <li><a class="dropdown-item" href="wishlist.html">
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

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            userProfile = data.data;
            displayProfile();
            await loadStats();
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile data', 'error');
    }
}

// Display profile data
function displayProfile() {
    // Basic info
    document.getElementById('profileName').textContent = userProfile.name;
    document.getElementById('profileEmail').textContent = userProfile.email;
    document.getElementById('memberSince').textContent = new Date(userProfile.createdAt).toLocaleDateString();
    
    // Form fields
    document.getElementById('userName').value = userProfile.name;
    document.getElementById('userEmail').value = userProfile.email;
    
    // Preferences
    if (userProfile.aestheticPreference) {
        const aestheticTag = document.querySelector(`[data-aesthetic="${userProfile.aestheticPreference}"]`);
        if (aestheticTag) {
            aestheticTag.classList.add('selected');
        }
    }
    
    if (userProfile.sizePreferences?.clothing) {
        document.getElementById('clothingSize').value = userProfile.sizePreferences.clothing;
    }
    
    if (userProfile.sizePreferences?.shoes) {
        document.getElementById('shoeSize').value = userProfile.sizePreferences.shoes;
    }
    
    // Sustainability data
    document.getElementById('sustainabilityPoints').textContent = userProfile.sustainabilityPoints || 0;
    document.getElementById('co2Saved').textContent = `${userProfile.co2Saved || 0} kg`;
    
    // Update sustainability progress bars
    updateSustainabilityBars();
    
    // Display sustainability badges
    displaySustainabilityBadges();
    
    // Load addresses
    loadAddresses();
}

// Load user statistics
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        
        // Load order count
        const ordersResponse = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            document.getElementById('totalOrders').textContent = ordersData.data?.length || 0;
        }
        
        // Load wishlist count
        const wishlistResponse = await fetch(`${API_BASE_URL}/users/wishlist`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            document.getElementById('wishlistCount').textContent = wishlistData.data?.length || 0;
        }
        
        // Update cart count
        updateCartCount();
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update sustainability progress bars
function updateSustainabilityBars() {
    const maxCO2 = 100; // Maximum CO2 savings for progress bar
    const maxWater = 1000; // Maximum water savings for progress bar
    
    const co2Percentage = Math.min((userProfile.co2Saved || 0) / maxCO2 * 100, 100);
    const waterSavedLiters = (userProfile.co2Saved || 0) * 150; // Estimate water saved
    const waterPercentage = Math.min(waterSavedLiters / maxWater * 100, 100);
    
    document.getElementById('co2Progress').style.width = `${co2Percentage}%`;
    document.getElementById('waterProgress').style.width = `${waterPercentage}%`;
    document.getElementById('waterSaved').textContent = `${waterSavedLiters} L`;
    document.getElementById('sustainableItems').textContent = userProfile.totalSustainableItems || 0;
}

// Display sustainability badges
function displaySustainabilityBadges() {
    const sustainabilityPoints = userProfile.sustainabilityPoints || 0;
    const badgeContainer = document.getElementById('sustainabilityBadges');
    
    let badges = [];
    
    if (sustainabilityPoints >= 5000) {
        badges.push('<span class="sustainability-badge badge-platinum"><i class="fas fa-gem me-1"></i>Eco Champion</span>');
    } else if (sustainabilityPoints >= 2000) {
        badges.push('<span class="sustainability-badge badge-gold"><i class="fas fa-star me-1"></i>Gold Supporter</span>');
    } else if (sustainabilityPoints >= 1000) {
        badges.push('<span class="sustainability-badge badge-silver"><i class="fas fa-medal me-1"></i>Silver Friend</span>');
    } else if (sustainabilityPoints >= 500) {
        badges.push('<span class="sustainability-badge badge-bronze"><i class="fas fa-leaf me-1"></i>Bronze Helper</span>');
    }
    
    if (userProfile.totalSustainableItems >= 10) {
        badges.push('<span class="sustainability-badge badge-gold"><i class="fas fa-recycle me-1"></i>Thrift Expert</span>');
    }
    
    badgeContainer.innerHTML = badges.join('');
}

// Setup event listeners
function setupEventListeners() {
    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    
    // Aesthetic tag selection
    document.querySelectorAll('.aesthetic-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            // Remove previous selection
            document.querySelectorAll('.aesthetic-tag').forEach(t => t.classList.remove('selected'));
            // Add selection to clicked tag
            this.classList.add('selected');
        });
    });
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    try {
        const selectedAesthetic = document.querySelector('.aesthetic-tag.selected')?.dataset.aesthetic;
        
        const profileData = {
            name: document.getElementById('userName').value,
            aestheticPreference: selectedAesthetic,
            sizePreferences: {
                clothing: document.getElementById('clothingSize').value,
                shoes: parseInt(document.getElementById('shoeSize').value) || undefined
            }
        };
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Profile updated successfully!', 'success');
            
            // Update local storage
            const updatedUser = { ...currentUser, name: profileData.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            currentUser = updatedUser;
            
            // Reload profile
            await loadUserProfile();
        } else {
            showNotification(data.message || 'Failed to update profile', 'error');
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

// Load addresses
function loadAddresses() {
    const addressList = document.getElementById('addressList');
    
    if (!userProfile.addresses || userProfile.addresses.length === 0) {
        addressList.innerHTML = '<p class="text-muted">No addresses added yet.</p>';
        return;
    }
    
    addressList.innerHTML = userProfile.addresses.map(address => `
        <div class="card mb-2">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${address.fullName}</h6>
                        <p class="mb-1">${address.street}</p>
                        <p class="mb-1">${address.city}, ${address.state} ${address.zipCode}</p>
                        <p class="mb-0"><i class="fas fa-phone me-1"></i>${address.phone}</p>
                        ${address.isDefault ? '<span class="badge bg-primary">Default</span>' : ''}
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="editAddress('${address._id}')">Edit</a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteAddress('${address._id}')">Delete</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Show add address modal
function showAddAddressModal() {
    const modal = new bootstrap.Modal(document.getElementById('addAddressModal'));
    modal.show();
}

// Save address
async function saveAddress() {
    try {
        const addressData = {
            fullName: document.getElementById('addressName').value,
            street: document.getElementById('addressStreet').value,
            city: document.getElementById('addressCity').value,
            state: document.getElementById('addressState').value,
            zipCode: document.getElementById('addressZip').value,
            phone: document.getElementById('addressPhone').value,
            isDefault: document.getElementById('defaultAddress').checked
        };
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/addresses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Address added successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAddressModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addressForm').reset();
            
            // Reload profile
            await loadUserProfile();
        } else {
            showNotification(data.message || 'Failed to add address', 'error');
        }
        
    } catch (error) {
        console.error('Error saving address:', error);
        showNotification('Error saving address', 'error');
    }
}

// Delete address
async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/addresses/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Address deleted successfully!', 'success');
            await loadUserProfile();
        } else {
            showNotification(data.message || 'Failed to delete address', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting address:', error);
        showNotification('Error deleting address', 'error');
    }
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
