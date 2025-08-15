const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

// Sample products data
const sampleProducts = [
  {
    name: "Rare Design Vintage Japanese Brand Bongo Jeans 2000s",
    description: "Authentic vintage Japanese denim with unique design details. Perfect for Y2K and vintage aesthetics.",
    price: 1200,
    category: "clothing",
    subCategory: "jeans",
    aesthetic: "y2k",
    sizes: [
      { size: "S", quantity: 1 },
      { size: "M", quantity: 2 },
      { size: "L", quantity: 1 }
    ],
    images: [
      {
        public_id: "sample_1",
        url: "./images/cl1.jpeg"
      }
    ],
    sustainability: {
      rating: 4,
      co2Savings: 15,
      waterSaved: 200,
      materials: ["denim"],
      condition: "very-good"
    },
    thriftStore: {
      name: "Second Chance Styles",
      location: "Mumbai",
      verified: true
    },
    tags: ["vintage", "japanese", "denim", "y2k"],
    isFeatured: true
  },
  {
    name: "The Beatles Lady Madonna Vintage Tee",
    description: "Classic Beatles band tee in excellent condition. Perfect for music lovers and vintage enthusiasts.",
    price: 900,
    category: "clothing",
    subCategory: "t-shirt",
    aesthetic: "vintage",
    sizes: [
      { size: "XS", quantity: 1 },
      { size: "S", quantity: 2 },
      { size: "M", quantity: 3 }
    ],
    images: [
      {
        public_id: "sample_2",
        url: "./images/cl2.jpeg"
      }
    ],
    sustainability: {
      rating: 5,
      co2Savings: 8,
      waterSaved: 150,
      materials: ["organic-cotton"],
      condition: "like-new"
    },
    thriftStore: {
      name: "Sustainable Styles",
      location: "Delhi",
      verified: true
    },
    tags: ["vintage", "band-tee", "beatles", "music"],
    isFeatured: true
  },
  {
    name: "Front Tie Vest Top",
    description: "Trendy vest top with front tie detail. Perfect for layering and creating versatile looks.",
    price: 700,
    category: "clothing",
    subCategory: "top",
    aesthetic: "minimalist",
    sizes: [
      { size: "S", quantity: 2 },
      { size: "M", quantity: 4 },
      { size: "L", quantity: 2 }
    ],
    images: [
      {
        public_id: "sample_3",
        url: "./images/cl3.jpeg"
      }
    ],
    sustainability: {
      rating: 4,
      co2Savings: 6,
      waterSaved: 120,
      materials: ["recycled-polyester"],
      condition: "good"
    },
    thriftStore: {
      name: "Preloved Picks",
      location: "Bangalore",
      verified: true
    },
    tags: ["minimalist", "vest", "layering"],
    isFeatured: true
  },
  {
    name: "Callie Necklace",
    description: "Elegant statement necklace perfect for special occasions or everyday glamour.",
    price: 1100,
    category: "jewelry",
    subCategory: "necklace",
    aesthetic: "preppy",
    sizes: [
      { size: "One Size", quantity: 1 }
    ],
    images: [
      {
        public_id: "sample_4",
        url: "./images/cl4.jpeg"
      }
    ],
    sustainability: {
      rating: 3,
      co2Savings: 2,
      waterSaved: 50,
      materials: ["synthetic"],
      condition: "very-good"
    },
    thriftStore: {
      name: "Thrift Haven",
      location: "Chennai",
      verified: false
    },
    tags: ["jewelry", "necklace", "statement"],
    isFeatured: true
  },
  {
    name: "Starfish Necklace",
    description: "Delicate starfish pendant necklace with coastal vibes. Perfect for beach and bohemian aesthetics.",
    price: 890,
    category: "jewelry",
    subCategory: "necklace",
    aesthetic: "bohemian",
    sizes: [
      { size: "One Size", quantity: 2 }
    ],
    images: [
      {
        public_id: "sample_5",
        url: "./images/cl5.jpeg"
      }
    ],
    sustainability: {
      rating: 4,
      co2Savings: 1,
      waterSaved: 30,
      materials: ["synthetic"],
      condition: "good"
    },
    thriftStore: {
      name: "Relove Closet",
      location: "Goa",
      verified: true
    },
    tags: ["jewelry", "starfish", "coastal", "bohemian"],
    isFeatured: true
  }
];

// Create sample admin user
const createSampleUser = async () => {
  try {
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@aestheticize.com",
      password: "Admin123!",
      role: "admin",
      isVerified: true,
      sustainabilityPoints: 2500,
      totalSustainableItems: 25,
      co2Saved: 50,
      aestheticPreference: "vintage"
    });
    
    console.log('✅ Sample admin user created');
    return adminUser;
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️  Admin user already exists');
      return await User.findOne({ email: "admin@aestheticize.com" });
    }
    throw error;
  }
};

// Seed database with sample data
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aestheticize');
    console.log('✅ Connected to MongoDB');

    // Create sample user
    const adminUser = await createSampleUser();

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Add seller ID to sample products
    const productsWithSeller = sampleProducts.map(product => ({
      ...product,
      seller: adminUser._id
    }));

    // Create sample products
    await Product.insertMany(productsWithSeller);
    console.log(`✅ Created ${sampleProducts.length} sample products`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Email: admin@aestheticize.com');
    console.log('Password: Admin123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleProducts };
