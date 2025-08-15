// Mock API for development - No database required!
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mock user storage (in memory)
let users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@aestheticize.com',
    password: 'Admin123!', // In real app, this would be hashed
    role: 'admin',
    sustainabilityPoints: 2500,
    aestheticPreference: 'vintage'
  }
];

let currentUserId = 2;

// Mock JWT token generation
const generateMockToken = (userId) => {
  return `mock-jwt-token-${userId}-${Date.now()}`;
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Mock Aestheticize API is running',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, aestheticPreference } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password'
    });
  }

  // Check if user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create new user
  const newUser = {
    id: currentUserId.toString(),
    name,
    email,
    password, // In real app, hash this
    role: 'user',
    sustainabilityPoints: 0,
    aestheticPreference: aestheticPreference || null,
    isVerified: true
  };

  users.push(newUser);
  currentUserId++;

  // Generate token
  const token = generateMockToken(newUser.id);

  // Return success response
  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      sustainabilityPoints: newUser.sustainabilityPoints,
      aestheticPreference: newUser.aestheticPreference,
      isVerified: newUser.isVerified
    }
  });

  console.log('✅ New user registered:', email);
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateMockToken(user.id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sustainabilityPoints: user.sustainabilityPoints,
      aestheticPreference: user.aestheticPreference,
      isVerified: user.isVerified
    }
  });

  console.log('✅ User logged in:', email);
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
});

// Mock featured products
app.get('/api/products/featured', (req, res) => {
  res.json({
    success: true,
    data: [] // Return empty for now
  });
});

// Cart endpoints (mock)
app.get('/api/cart/count', (req, res) => {
  res.json({ success: true, count: 0 });
});

app.post('/api/cart/add', (req, res) => {
  res.json({ success: true, message: 'Item added to cart' });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Mock Aestheticize API running on http://localhost:${PORT}`);
  console.log('📝 Test credentials:');
  console.log('   Email: admin@aestheticize.com');
  console.log('   Password: Admin123!');
  console.log('🎯 Registration form should now work!');
});

module.exports = app;
