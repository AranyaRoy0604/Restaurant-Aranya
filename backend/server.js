import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 1. Allow Cross-Origin Requests from all deployed frontends safely
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 🔌 MongoDB Connection String
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("🎯 Connected successfully to MongoDB Cloud!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --- MENU SCHEMA & MODEL ---
const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  image: String,
  desc: String,
  isFeatured: Boolean
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// --- 🛍️ ORDER SCHEMA & MODEL ---
const orderSchema = new mongoose.Schema({
  items: [
    {
      name: String,
      qty: Number,
      price: Number
    }
  ],
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// 🌐 GET Route: Fetch menu items
app.get('/api/menu', async (req, res) => {
  try {
    let menuItems = await MenuItem.find(); 
    
    // 🌾 FORCE FIX: If database returns absolutely nothing, inject and return standard valid objects
    if (menuItems.length === 0) {
      console.log("⚠️ Database was empty on fetch. Creating default menu items!");
      const fallbackMenu = [
        { name: 'Crispy Bacon Burger', category: 'Burgers', price: 12.99, image: '🍔', desc: 'Juicy beef patty, crispy bacon, cheddar cheese, and house sauce.' },
        { name: 'Margherita Pizza', category: 'Pizza', price: 15.00, image: '🍕', desc: 'Fresh mozzarella, san marzano tomatoes, and organic basil.' },
        { name: 'Caesar Salad', category: 'Salads', price: 10.50, image: '🥗', desc: 'Crisp romaine, parmesan shavings, garlic croutons, and creamy dressing.' }
      ];
      
      // Seed them directly so the database is no longer empty next time
      await MenuItem.insertMany(fallbackMenu);
      menuItems = await MenuItem.find(); 
    }
    
    res.json(menuItems); 
  } catch (error) {
    console.error("Error inside GET /api/menu:", error);
    res.status(500).json({ message: "Error fetching menu", error: error.message });
  }
});

// 🌐 POST Route: Receive an order from frontend and save to MongoDB
app.post('/api/orders', async (req, res) => {
  try {
    console.log("📥 NEW ORDER RECEIVED FROM FRONTEND:", req.body);
    
    const newOrder = new Order({
      items: req.body.items,
      totalAmount: req.body.totalAmount
    });

    await newOrder.save(); 
    
    console.log("💾 Order successfully saved to database with ID:", newOrder._id);
    res.status(201).json({ message: "Order placed successfully!", orderId: newOrder._id });
  } catch (error) {
    console.error("❌ Error saving order:", error);
    res.status(500).json({ message: "Failed to process order", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Database-backed server running on port ${PORT}`);
});