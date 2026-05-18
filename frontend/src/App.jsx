import React, { useState, useEffect } from 'react';

export default function App() {
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);

  // Fetch menu data from our Node.js backend on port 5000
  useEffect(() => {
    fetch('https://restaurant-api-wpsm.onrender.com/api/menu')
      .then((res) => res.json())
      .then((data) => setMenu(data))
      .catch((err) => console.error("Error fetching menu data:", err));
  }, []);

  // Filter categories dynamically based on active database collections
  const categories = ['All', ...new Set(menu.map((item) => item.category))];

  const filteredMenu = activeCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  // Cart Management Functions using MongoDB '_id' selectors
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i._id === item._id);
      if (existing) {
        return prevCart.map((i) => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prevCart, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalWithTax = cartTotal * 1.08;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Navbar Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-orange-600 tracking-tight">BiteCraft Studio</h1>
        <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-bold text-sm">
          🛒 Cart Items: {cart.reduce((a, b) => a + b.qty, 0)}
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Menu Explorer */}
        <div className="lg:col-span-3">
          {/* Category Filter Pills */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ${
                  activeCategory === cat 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Responsive Grid */}
          {filteredMenu.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <p className="text-slate-400 font-medium">Connecting to database menu collection...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenu.map((item) => (
                <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-4xl mb-3 block">{item.image}</span>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                      <span className="text-orange-600 font-extrabold text-lg">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full bg-slate-900 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors duration-150 text-sm"
                  >
                    Add to Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Checkout Sidebar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit sticky top-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-3">Your Order</h2>
          
          {cart.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Your cart is empty. Tap an item to add it!</p>
          ) : (
            <>
              {/* Items List Inside Cart */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4 pr-1">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between items-center text-sm">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-slate-400 text-xs">
                        {item.qty} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">${(item.price * item.qty).toFixed(2)}</span>
                      <button 
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation Area */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Estimated Tax (8%)</span>
                  <span>${(cartTotal * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-lg text-slate-900 pt-2 border-t border-dashed">
                  <span>Total Amount</span>
                  <span>${totalWithTax.toFixed(2)}</span>
                </div>
                
                {/* 🚀 SEND LIVE ORDER TO BACKEND */}
                <button 
                  onClick={() => {
                    const orderPayload = {
                      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
                      totalAmount: parseFloat(totalWithTax.toFixed(2))
                    };

                    fetch('https://restaurant-api-wpsm.onrender.com/api/orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(orderPayload)
                    })
                    .then(res => res.json())
                    .then(data => {
                      alert(`🎉 Order saved to MongoDB Cloud! Order ID: ${data.orderId}`);
                      setCart([]); // Clear shopping cart
                    })
                    .catch(err => {
                      console.error("Order processing error:", err);
                      alert("Failed to reach server backend.");
                    });
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors mt-4 text-center block text-sm"
                >
                  Confirm Order
                </button>
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}