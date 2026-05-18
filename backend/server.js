import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 ALLOW CROSS-ORIGIN REQUESTS (Fixes Vercel frontend communication)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 🔌 MONGODB CONNECTION SETUP
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI environment variable is missing!");
}

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

// --- ORDER SCHEMA & MODEL ---
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

// 🌐 FRIENDLY LANDING ROUTE (Prevents "Cannot GET /" layout error on Render root)
app.get('/', (req, res) => {
  res.send('🚀 BiteCraft Studio Backend API is up, running, and healthy!');
});

// 🌐 GET ROUTE: Fetch menu items with automatic seed injection
app.get('/api/menu', async (req, res) => {
  try {
    let menuItems = await MenuItem.find(); 
    
    // 🌾 AUTOMATIC DATABASE SEEDER (Runs if your cloud collection database is completely empty)
    if (menuItems.length === 0) {
      console.log("⚠️ Database was empty on fetch. Seeding premium restaurant menu!");
      const expandedMenu = [
        // --- BURGERS ---
        { name: 'Crispy Bacon Burger', category: 'Burgers', price: 12.99, image: '🍔', desc: 'Juicy beef patty, crispy bacon, cheddar cheese, and house sauce.' },
        { name: 'Mushroom Swiss', category: 'Burgers', price: 13.50, image: '🍄', desc: 'Grilled patty smothered in sautéed wild mushrooms and melted Swiss cheese.' },
        
        // --- PIZZA ---
        { name: 'Margherita Pizza', category: 'Pizza', price: 15.00, image: '🍕', desc: 'Fresh mozzarella, san marzano tomatoes, fresh garlic, and organic basil.' },
        { name: 'Spicy Pepperoni Inferno', category: 'Pizza', price: 16.50, image: '🌶️', desc: 'Loaded with spicy pepperoni, jalapeños, and hot honey drizzle.' },
        
        // --- SALADS ---
        { name: 'Caesar Salad', category: 'Salads', price: 10.50, image: '🥗', desc: 'Crisp romaine, parmesan shavings, garlic croutons, and creamy dressing.' },
        { name: 'Greek Avocado Salad', category: 'Salads', price: 11.99, image: '🥑', desc: 'Feta cheese, kalamata olives, cucumbers, and ripe avocado.' },
        
        // --- DESSERTS ---
        { name: 'Matcha Lava Cake', category: 'Desserts', price: 8.50, image: '🍰', desc: 'Warm matcha cake with a molten white chocolate center.' },
        { name: 'Fudge Brownie Sundae', category: 'Desserts', price: 7.99, image: '🍨', desc: 'Rich chocolate brownie topped with vanilla bean ice cream.' },
        
        // --- DRINKS ---
        { name: 'Iced Caramel Macchiato', category: 'Drinks', price: 4.99, image: '☕', desc: 'Espresso mixed with vanilla syrup, milk, and drizzled with caramel.' },
        { name: 'Fresh Mint Lemonade', category: 'Drinks', price: 3.50, image: '🍹', desc: 'Freshly squeezed lemons with muddled mint leaves.' }
      ];
      
      // Save items permanently into your real cloud collection
      await MenuItem.insertMany(expandedMenu);
      menuItems = await MenuItem.find(); // Re-fetch the items to send back
    }
    
    res.json(menuItems); 
  } catch (error) {
    console.error("❌ Error inside GET /api/menu:", error);
    res.status(500).json({ message: "Error fetching menu", error: error.message });
  }
});

// 🌐 POST ROUTE: Process and store frontend checkout orders
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