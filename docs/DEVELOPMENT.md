# Aestheticize - Development Guide

## 📁 Project Structure Overview

```
Aestheticize/
│
├── 🎨 frontend/                    # Frontend Application
│   ├── index.html                  # Main homepage
│   ├── login.html                  # User authentication
│   ├── cart.html                   # Shopping cart
│   ├── profile.html                # User profiles
│   ├── orders.html                 # Order management
│   ├── wishlist.html               # User wishlist
│   │
│   ├── 📁 css/                     # Stylesheets
│   │   ├── style.css               # Main styles
│   │   └── auth.css                # Authentication styles
│   │
│   ├── 📁 js/                      # JavaScript files
│   │   ├── main.js                 # Main application logic
│   │   ├── auth.js                 # Authentication logic
│   │   ├── cart.js                 # Shopping cart logic
│   │   ├── api.js                  # API communication
│   │   └── ...
│   │
│   ├── 📁 images/                  # Static images and assets
│   │
│   └── 📁 [Feature Modules]/      # Specialized features
│       ├── CottageCore/            # Cottage core aesthetic
│       ├── mysteryBoxGothAesthetic/# Gothic mystery boxes
│       ├── mysteryBoxHomePage/     # Mystery box landing
│       ├── uniquePieces/           # Unique item showcase
│       └── influencer_prog/        # Influencer program
│
├── 🛠️  backend/                    # Backend API Server
│   ├── server.js                   # Main server file
│   ├── package.json                # Node.js dependencies
│   ├── seedDatabase.js             # Database seeding
│   │
│   ├── 📁 models/                  # Database models
│   ├── 📁 routes/                  # API routes
│   ├── 📁 middleware/              # Custom middleware
│   └── 📁 node_modules/            # Dependencies
│
├── 📚 docs/                        # Documentation & Assets
│   ├── README.md                   # Original documentation
│   ├── *.png                       # Screenshots for docs
│   └── [Additional docs]
│
├── 🚀 scripts/                     # Automation Scripts
│   ├── setup.sh                    # Initial project setup
│   ├── start-backend.sh            # Start backend server
│   ├── start-frontend.sh           # Start frontend server
│   └── status.sh                   # Check project health
│
└── README.md                       # Main project documentation
```

## 🔧 Development Workflow

### Initial Setup
```bash
# 1. Setup the entire project
./scripts/setup.sh

# 2. Start development servers (in separate terminals)
./scripts/start-backend.sh      # Backend on port 5001
./scripts/start-frontend.sh     # Frontend on port 3000
```

### Daily Development
```bash
# Backend development (with auto-reload)
cd backend
npm run dev

# Frontend development (simple HTTP server)
cd frontend
python3 -m http.server 3000
```

## 🏗️ Architecture

### Frontend Architecture
- **Type**: Single Page Application (SPA) with multiple HTML pages
- **Technology Stack**: HTML5, CSS3, Vanilla JavaScript
- **Structure**: Modular components with shared styles and scripts
- **API Communication**: RESTful API calls to backend

### Backend Architecture  
- **Type**: RESTful API Server
- **Technology Stack**: Node.js, Express.js, MongoDB
- **Structure**: MVC pattern with routes, models, and middleware
- **Authentication**: JWT-based authentication system

## 🔍 Key Components

### Frontend Components
- **Authentication System**: Login/Register with JWT tokens
- **Shopping Cart**: Persistent cart with local storage
- **Product Catalog**: Dynamic product listings
- **User Profiles**: Account management and order history
- **Mystery Boxes**: Aesthetic-themed product bundles
- **Responsive Design**: Mobile-first approach

### Backend Components
- **User Management**: Registration, authentication, profiles
- **Product Management**: CRUD operations for products
- **Order Processing**: Cart to order conversion
- **Database Models**: User, Product, Order, Cart models
- **API Security**: CORS, rate limiting, input validation

## 🧪 Testing

### Frontend Testing
```bash
# Open browser developer tools for debugging
# Test API connections in browser console
# Validate responsive design on different screen sizes
```

### Backend Testing
```bash
cd backend
npm test                    # Run unit tests
npm run test:integration   # Run integration tests
```

## 🚀 Deployment

### Production Build
```bash
# Backend production
cd backend
npm run build
npm start

# Frontend production (serve with web server)
# Copy frontend/ contents to web server directory
```

## 🐛 Troubleshooting

### Common Issues
1. **Port Already in Use**: Change ports in server files
2. **MongoDB Connection**: Ensure MongoDB is running
3. **CORS Issues**: Check backend CORS configuration
4. **Path Issues**: Use absolute paths in scripts

### Debug Mode
```bash
# Backend debug mode
cd backend
DEBUG=* npm run dev

# Frontend debug mode
# Use browser developer tools
```

## 📝 Contributing Guidelines

1. **Code Style**: Follow existing patterns
2. **Commits**: Use descriptive commit messages
3. **Testing**: Test changes thoroughly
4. **Documentation**: Update docs for new features

## 🔗 Useful Links

- Backend API: http://localhost:5001
- Frontend App: http://localhost:3000
- MongoDB Admin: http://localhost:27017
- API Documentation: http://localhost:5001/api/docs

---

Happy coding! 🎨✨
