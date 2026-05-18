import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 🔌 MongoDB Connection String (Brackets removed & targeting 'restaurant' database)
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
    
    // FORCE FIX: If database returns absolutely nothing, send temporary local items
    if (menuItems.length === 0) {
      console.log("⚠️ Database was empty on fetch. Sending fallback menu items directly!");
      menuItems = [
        { _id: 'db_fallback_1', name: 'Crispy Bacon Burger', category: 'Burgers', price: 12.99, image: '🍔', desc: 'Juicy beef patty, crispy bacon, cheddar cheese, and house sauce.' },
        { _id: 'db_fallback_2', name: 'Margherita Pizza', category: 'Pizza', price: 15.00, image: '🍕', desc: 'Fresh mozzarella, san marzano tomatoes, and organic basil.' }
      ];
    }
    
    res.json(menuItems); 
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu", error });
  }
});

// 🌐 NEW POST Route: Receive an order from frontend and save to MongoDB
app.post('/api/orders', async (req, res) => {
  try {
    console.log("📥 NEW ORDER RECEIVED FROM FRONTEND:", req.body);
    
    const newOrder = new Order({
      items: req.body.items,
      totalAmount: req.body.totalAmount
    });

    await newOrder.save(); // Saves the order permanently into MongoDB!
    
    console.log("💾 Order successfully saved to database with ID:", newOrder._id);
    res.status(201).json({ message: "Order placed successfully!", orderId: newOrder._id });
  } catch (error) {
    console.error("❌ Error saving order:", error);
    res.status(500).json({ message: "Failed to process order", error });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Database-backed server running at http://localhost:${PORT}`);
});