import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, History, Settings, 
  Plus, Search, Trash2, Edit, Save, X, ChevronRight, 
  TrendingUp, FileText, LogOut,
  ArrowUpCircle,
  CreditCard, Wallet, QrCode, MinusCircle, PlusCircle,
  Filter, Printer, Percent, Tag,
  Clock, CheckCircle2, AlertCircle, Camera
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Daster Bali Motif Bunga', category: 'Daster Bali', costPrice: 35000, sellingPrice: 55000, stock: 25, sku: 'DB-001', variants: 'Merah, Biru, Hijau' },
  { id: 2, name: 'Daster Rayon Polos XL', category: 'Daster Rayon', costPrice: 40000, sellingPrice: 65000, stock: 15, sku: 'DR-002', variants: 'XL, XXL' },
  { id: 3, name: 'Daster Jumbo Batik', category: 'Daster Jumbo', costPrice: 45000, sellingPrice: 75000, stock: 8, sku: 'DJ-003', variants: 'Motif A, Motif B' },
];

const INITIAL_CATEGORIES = ['Daster Bali', 'Daster Rayon', 'Daster Jumbo', 'Daster Anak'];

export default function App() {
  // --- Auth & Core Data State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    storeName: 'A&M Store',
    address: 'Jl. Raya No. 123, Jakarta',
    phone: '08123456789',
    receiptFooter: 'Terima kasih telah berbelanja!',
    taxRate: 0,
    discountDefault: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Data from Supabase ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*').order('name');
      if (prodData) setProducts(prodData);

      const { data: transData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (transData) setTransactions(transData);

      const { data: settsData } = await supabase.from('settings').select('*').single();
      if (settsData) setSettings(settsData);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if ((formData.get('username') === 'admin' && formData.get('password') === 'admin123') || 
        (formData.get('username') === 'admin' && formData.get('password') === 'admin')) {
      setIsLoggedIn(true);
    } else {
      alert('Login Gagal!');
    }
  };

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [skuInput, setSkuInput] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportFilter, setReportFilter] = useState('today'); // 'today', '7days', 'thismonth'

  // --- Local UI State for Settings (Non-persistent until saved) ---
  const [localSettings, setLocalSettings] = useState(settings);
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Sync local state when tab changes to settings
  useEffect(() => {
    if (activeTab === 'settings') {
      setLocalSettings(settings);
      setLocalCategories(categories);
    }
  }, [activeTab, settings, categories]);

  const handleSaveSettings = async () => {
    if (window.confirm('Simpan perubahan pengaturan?')) {
      const { error } = await supabase.from('settings').update(localSettings).eq('id', 1);
      if (error) {
        alert('Gagal simpan: ' + error.message);
      } else {
        setSettings(localSettings);
        setCategories(localCategories);
        alert('Pengaturan berhasil disimpan!');
      }
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (localCategories.includes(newCategoryName.trim())) {
      alert('Kategori sudah ada!');
      return;
    }
    setLocalCategories([...localCategories, newCategoryName.trim()]);
    setNewCategoryName('');
  };
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    sellingPrice: '',
    costPrice: '',
    stock: '',
    category: INITIAL_CATEGORIES[0] || '',
    variants: '',
    sku: '',
    image: null
  });

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      sellingPrice: product.selling_price,
      costPrice: product.cost_price,
      stock: product.stock,
      category: product.category,
      variants: product.variants,
      sku: product.sku,
      image: product.image
    });
    setIsAddProductOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsAddProductOpen(false);
    setEditingProduct(null);
    setNewProduct({ name: '', sellingPrice: '', costPrice: '', stock: '', category: categories[0] || '', variants: '', sku: '', image: null });
  };

  // --- POS Logic ---
  const addToCart = (product) => {
    if (product.stock <= 0) return alert('Stok habis!');
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return alert('Stok tidak mencukupi!');
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > (product?.stock || 0)) {
          alert('Stok tidak mencukupi!');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + ((item.selling_price || 0) * item.quantity), 0);
  const cartTotal = Math.max(0, cartSubtotal - (Number(discount) || 0));

  const handleCheckout = (override = {}) => {
    if (cart.length === 0) return;
    const selectedPaymentMethod = override.paymentMethod || paymentMethod;
    const selectedPaymentAmount = override.paymentAmount ?? paymentAmount;
    const finalDiscount = Number(discount) || 0;
    const finalPaymentAmount = selectedPaymentMethod === 'Tunai' ? (parseFloat(selectedPaymentAmount) || 0) : cartTotal;

    if (selectedPaymentMethod === 'Tunai' && finalPaymentAmount < cartTotal) {
      return alert('Pembayaran kurang!');
    }

    const newTransaction = {
      invoice: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: cart,
      subtotal: cartSubtotal,
      discount: finalDiscount,
      total: cartTotal,
      payment_method: selectedPaymentMethod,
      payment_amount: finalPaymentAmount,
      profit: cart.reduce((acc, item) => acc + (((item.selling_price || 0) - (item.cost_price || 0)) * item.quantity), 0) - finalDiscount
    };

    // Update Stock
    const updateStock = async () => {
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.id);
        }
      }
    };

    const saveTransaction = async () => {
      const { data, error } = await supabase.from('transactions').insert([newTransaction]).select();
      if (error) {
        alert('Gagal simpan transaksi: ' + error.message);
      } else {
        await updateStock();
        setLastReceipt(data[0]);
        fetchData();
        setCart([]);
        setDiscount(0);
        setPaymentAmount('');
        setIsCheckingOut(false);
        setShowReceipt(true);
      }
    };

    saveTransaction();
  };

  // --- Dashboard & Report Data ---
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let start, end;
    
    if (reportFilter === 'today') {
      start = startOfDay(now);
      end = endOfDay(now);
    } else if (reportFilter === '7days') {
      start = startOfDay(subDays(now, 6));
      end = endOfDay(now);
    } else if (reportFilter === 'thismonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = endOfDay(now);
    }
    
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start, end })
    );
  }, [transactions, reportFilter]);

  const todayTransactions = transactions.filter(t => 
    isWithinInterval(new Date(t.date), { start: startOfDay(new Date()), end: endOfDay(new Date()) })
  );
  const todaySales = todayTransactions.reduce((acc, t) => acc + (Number(t.total) || 0), 0);
  const lowStockProducts = products.filter(p => (Number(p.stock) || 0) <= 3);
  const stockValue = products.reduce((acc, p) => acc + ((Number(p.cost_price) || 0) * (Number(p.stock) || 0)), 0);

  const bestSellers = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      if (t.items && Array.isArray(t.items)) {
        t.items.forEach(item => {
          counts[item.name] = (counts[item.name] || 0) + (Number(item.quantity) || 0);
        });
      }
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  const salesHistory7Days = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayTotal = transactions
        .filter(t => isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd }))
        .reduce((acc, t) => acc + (Number(t.total) || 0), 0);
      return { label: format(date, 'EEE'), value: dayTotal };
    });
  }, [transactions]);

  // --- Render Components ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-pink-500 p-8 text-white text-center">
            <h1 className="text-3xl font-black tracking-tighter mb-2">{settings.storeName}</h1>
            <p className="opacity-90">Sistem Kasir Modern</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Username</label>
              <input 
                name="username" 
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-500 focus:bg-white outline-none transition-all font-medium" 
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Password</label>
              <input 
                name="password" 
                type="password" 
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-500 focus:bg-white outline-none transition-all font-medium" 
                placeholder="••••••••"
                required
              />
            </div>
            <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-pink-200 transition-all active:scale-95">
              MASUK KE SISTEM
            </button>
          </form>
        </div>
      </div>
    );
  }

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline-block">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
  const addBySku = (sku) => {
    if (!sku) return;
    const found = products.find(p => (p.sku || '').toLowerCase() === sku.toLowerCase());
    if (found) {
      addToCart(found);
    } else {
      alert('SKU tidak ditemukan');
    }
  };

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir', icon: ShoppingCart },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'transactions', label: 'Riwayat', icon: History },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Universal Header */}
      <header className="bg-white border-b border-slate-100 p-4 md:p-6 sticky top-0 z-40 flex justify-between items-center rounded-b-2xl md:rounded-b-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white">
            <ShoppingCart size={24} />
          </div>
          <span className="font-black text-xl tracking-tighter text-pink-500">{settings.storeName}</span>
        </div>
        <button 
          onClick={() => setIsLoggedIn(false)}
          className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="hidden md:inline">Keluar</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-24">
        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            <header>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">Halo, Admin! 👋</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium tracking-wide uppercase">Ringkasan performa {settings.storeName}</p>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4">
                  <TrendingUp size={20} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Omzet</p>
                <h4 className="text-sm md:text-2xl font-black text-slate-800 truncate">Rp {todaySales.toLocaleString()}</h4>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-pink-50 text-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4">
                  <ShoppingCart size={20} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Order</p>
                <h4 className="text-sm md:text-2xl font-black text-slate-800">{todayTransactions.length} Transaksi</h4>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-50 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4">
                  <Package size={20} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Stok Menipis</p>
                <h4 className="text-sm md:text-2xl font-black text-slate-800">{lowStockProducts.length} Item</h4>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-green-50 text-green-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4">
                  <History size={20} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Riwayat</p>
                <h4 className="text-sm md:text-2xl font-black text-slate-800">{transactions.length} Data</h4>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 space-y-6 md:space-y-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 md:mb-8 flex items-center gap-2">
                    <TrendingUp size={18} className="text-pink-500" />
                    Tren Penjualan (7 Hari)
                  </h3>
                  <div className="h-48 md:h-64 flex items-end justify-between gap-1.5 md:gap-4 px-1 md:px-2">
                    {salesHistory7Days.map((day, i) => {
                      const maxVal = Math.max(...salesHistory7Days.map(d => d.value), 1);
                      const height = (day.value / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 md:gap-3 group">
                          <div className="w-full relative flex items-end justify-center h-full">
                            <div 
                              style={{ height: `${height}%` }} 
                              className="w-full max-w-[30px] md:max-w-[40px] bg-pink-100 group-hover:bg-pink-500 rounded-t-lg md:rounded-t-xl transition-all duration-500"
                            />
                            <div className="absolute -top-8 bg-slate-800 text-white text-[8px] md:text-[10px] py-1 px-1.5 md:px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              {day.value.toLocaleString()}
                            </div>
                          </div>
                          <span className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-tighter">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
                    <Tag size={18} className="text-pink-500" />
                    Produk Terlaris
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                    {bestSellers.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-7 h-7 md:w-8 md:h-8 bg-pink-500 text-white rounded-lg flex items-center justify-center font-black text-xs md:text-sm">
                            {i + 1}
                          </div>
                          <span className="font-bold text-slate-700 text-xs md:text-base">{item.name}</span>
                        </div>
                        <span className="bg-pink-50 text-pink-500 px-2 md:px-4 py-0.5 md:py-1 rounded-full text-[9px] md:text-xs font-black whitespace-nowrap">{item.qty} Terjual</span>
                      </div>
                    ))}
                    {bestSellers.length === 0 && <p className="text-center py-6 text-slate-400 font-bold text-xs">Belum ada data penjualan.</p>}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm h-fit">
                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" />
                  Stok Menipis
                </h3>
                <div className="space-y-3 md:space-y-4">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 md:p-4 bg-red-50 rounded-xl md:rounded-2xl border border-red-100">
                        <div>
                          <p className="font-bold text-slate-800 text-xs md:text-sm leading-tight">{p.name}</p>
                          <p className="text-[10px] text-red-500 font-bold">Sisa: {p.stock} pcs</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('products')}
                          className="bg-white text-red-500 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm border border-red-100"
                        >
                          <Package size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-50">
                      <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
                      <p className="font-bold text-slate-400 text-xs">Semua stok aman!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isAddProductOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 space-y-4 my-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
                <button onClick={handleCloseProductModal} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Produk</label>
                  <input
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Contoh: Daster Rayon XL"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Harga Jual</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold"
                      value={newProduct.sellingPrice}
                      onChange={(e) => setNewProduct({...newProduct, sellingPrice: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Harga Modal</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold"
                      value={newProduct.costPrice}
                      onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stok Awal</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori</label>
                    <select
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      {categories.map((c, i) => <option value={c} key={i}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Varian</label>
                  <input
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold"
                    value={newProduct.variants}
                    onChange={(e) => setNewProduct({...newProduct, variants: e.target.value})}
                    placeholder="Contoh: L, XL, Merah, Motif A"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SKU / Barcode</label>
                  <input
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    placeholder="Opsional, bisa dikosongkan"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Foto Produk</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <span className="w-full inline-flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-bold cursor-pointer">
                        <Camera size={18} />
                        Pilih / Ambil Foto
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setNewProduct({...newProduct, image: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                    {newProduct.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                        <img src={newProduct.image} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleCloseProductModal}
                  className="py-3 bg-slate-100 text-slate-700 rounded-xl font-black"
                >
                  BATAL
                </button>
                <button
                  onClick={async () => {
                    if (!newProduct.name || !newProduct.sellingPrice) {
                      alert('Nama dan Harga Jual wajib diisi');
                      return;
                    }

                    const productData = {
                      name: newProduct.name,
                      selling_price: Number(newProduct.sellingPrice) || 0,
                      cost_price: Number(newProduct.costPrice) || 0,
                      stock: Number(newProduct.stock) || 0,
                      category: newProduct.category || categories[0] || '',
                      variants: newProduct.variants || '',
                      sku: newProduct.sku?.trim() || ('PRD-' + Date.now().toString().slice(-4)),
                      image: newProduct.image
                    };

                    if (editingProduct) {
                      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
                      if (error) alert('Gagal update: ' + error.message);
                    } else {
                      const { error } = await supabase.from('products').insert([productData]);
                      if (error) alert('Gagal simpan: ' + error.message);
                    }
                    
                    fetchData();
                    handleCloseProductModal();
                  }}
                  className="py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-black"
                >
                  {editingProduct ? 'SIMPAN PERUBAHAN' : 'SIMPAN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POS / Kasir Tab (Single Page) */}
        {activeTab === 'pos' && (
          <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-300 pb-24 md:pb-0">
            {/* Left Column: Products (lg:8) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari daster..." 
                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-500 outline-none shadow-sm transition-all font-bold text-base md:text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Scan SKU"
                  className="w-32 md:w-64 px-4 py-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-500 outline-none shadow-sm transition-all font-bold text-sm"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { addBySku(skuInput); setSkuInput(''); } }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 overflow-y-auto max-h-[calc(100vh-280px)] md:max-h-none pr-1 custom-scrollbar">
                {products.filter(p => 
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(p => {
                  const inCart = cart.find(item => item.id === p.id);
                  return (
                    <button 
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={`bg-white p-3 md:p-4 rounded-2xl border-2 transition-all text-left flex flex-col shadow-sm group relative ${inCart ? 'border-pink-500 ring-4 ring-pink-50' : 'border-transparent hover:border-pink-200'}`}
                    >
                      {inCart && (
                        <div className="absolute -top-2 -right-2 bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg z-10">
                          {inCart.quantity}
                        </div>
                      )}
                      <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-slate-300 group-hover:text-pink-200 transition-colors overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={32} />
                        )}
                      </div>
                      <p className="font-black text-slate-800 text-xs md:text-sm mb-1 line-clamp-2 flex-1 leading-tight">{p.name}</p>
                      <p className="text-pink-500 font-black text-sm">Rp {(p.selling_price || 0).toLocaleString()}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${p.stock <= 3 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                          Stok {p.stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Cart & Payment (lg:4) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
              <div className="bg-white rounded-[35px] shadow-xl shadow-pink-100/50 border border-pink-50 flex flex-col h-full overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                    <ShoppingCart size={20} className="text-pink-500" />
                    Pembayaran
                  </h3>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                  {cart.length > 0 ? (
                    <>
                      {/* Cart Items */}
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div key={item.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 overflow-hidden shrink-0 border border-slate-100">
                              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-800 text-xs leading-tight mb-1 truncate">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">Rp {(item.selling_price || 0).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                              <button onClick={() => updateCartQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors">
                                <PlusCircle size={16} className="rotate-45" />
                              </button>
                              <span className="font-black text-slate-800 text-xs w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateCartQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors">
                                <PlusCircle size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Payment Form */}
                      <div className="space-y-4 pt-4 border-t-2 border-dashed border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Total Tagihan</span>
                          <span className="text-2xl font-black text-pink-500">Rp {cartTotal.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uang Tunai Diterima</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">Rp</span>
                            <input 
                              type="number" 
                              className="w-full pl-12 pr-4 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-500 outline-none font-black text-2xl transition-all"
                              placeholder="0"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => setPaymentAmount(cartTotal.toString())}
                              className="py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all uppercase tracking-tighter"
                            >
                              Uang Pas
                            </button>
                            <button 
                              onClick={() => {
                                const nextRound = Math.ceil(cartTotal / 50000) * 50000;
                                setPaymentAmount(nextRound.toString());
                              }}
                              className="py-3 bg-pink-100 text-pink-500 rounded-xl text-xs font-black hover:bg-pink-200 transition-all uppercase tracking-tighter"
                            >
                              Bulatkan
                            </button>
                          </div>
                        </div>

                        {parseFloat(paymentAmount) > 0 && (
                          <div className="p-4 bg-green-50 rounded-2xl flex justify-between items-center border border-green-100">
                            <span className="text-xs font-bold text-green-600 uppercase">Kembalian</span>
                            <span className="text-xl font-black text-green-600">
                              Rp {Math.max(0, (parseFloat(paymentAmount) || 0) - cartTotal).toLocaleString()}
                            </span>
                          </div>
                        )}

                        <button 
                          onClick={() => handleCheckout({ paymentMethod: 'Tunai' })}
                          disabled={cart.length === 0 || (parseFloat(paymentAmount) || 0) < cartTotal}
                          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-pink-200 transition-all active:scale-95 uppercase tracking-widest"
                        >
                          PROSES BAYAR
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                      <ShoppingCart size={64} className="mb-4" />
                      <p className="font-black text-lg uppercase tracking-tighter">Belum ada barang</p>
                      <p className="text-xs font-bold">Pilih daster di sebelah kiri</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hold List Tab */}
        {activeTab === 'hold_list' && (
          <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-20 md:pb-0">
            <header className="flex justify-between items-center px-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-800">Transaksi Tersimpan</h3>
              <button onClick={() => setActiveTab('pos')} className="text-pink-500 font-bold text-sm md:text-base flex items-center gap-1">
                <X size={16} />
                <span className="hidden sm:inline">Batal</span>
              </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {transactions.filter(t => false).map(hold => ( // Empty map since holdTransactions is gone
                <div key={hold.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-3 md:space-y-4">
                  {/* ... */}
                </div>
              ))}
              <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                <Clock size={48} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-400">Fitur Simpan Transaksi dinonaktifkan dalam mode Pembelian Langsung.</p>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && lastReceipt && (
          <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 space-y-6 my-auto print:shadow-none print:p-0">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-pink-500 tracking-tighter">{settings.storeName}</h2>
                <p className="text-xs font-bold text-slate-500 leading-tight whitespace-pre-wrap">{settings.address}</p>
                <p className="text-xs font-bold text-slate-500">Telp: {settings.phone}</p>
              </div>
              
              <div className="border-t-2 border-dashed border-slate-100 pt-4 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>No: {lastReceipt.invoice}</span>
                  <span>{format(new Date(lastReceipt.date), 'dd/MM/yy HH:mm')}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Kasir: Admin</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-slate-100 pt-4 space-y-3">
                {lastReceipt.items.map((item, i) => (
                  <div key={i} className="text-xs font-bold">
                    <div className="flex justify-between text-slate-800">
                      <span>{item.name}</span>
                      <span>Rp {((item.selling_price || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      {item.quantity} x {(item.selling_price || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span>Rp {lastReceipt.subtotal.toLocaleString()}</span>
                </div>
                {lastReceipt.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-red-500">
                    <span>Diskon</span>
                    <span>- Rp {lastReceipt.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-slate-800">
                  <span>TOTAL</span>
                  <span>Rp {lastReceipt.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Bayar ({lastReceipt.paymentMethod})</span>
                  <span>Rp {lastReceipt.paymentAmount.toLocaleString()}</span>
                </div>
                {lastReceipt.paymentMethod === 'Tunai' && (
                  <div className="flex justify-between text-xs font-bold text-green-500">
                    <span>Kembali</span>
                    <span>Rp {(lastReceipt.paymentAmount - lastReceipt.total).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-6 space-y-4 print:hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{settings.receiptFooter}</p>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg shadow-slate-200 uppercase tracking-widest">
                    <Printer size={18} />
                    CETAK STRUK
                  </button>
                  <button onClick={() => setShowReceipt(false)} className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all uppercase tracking-widest">
                    TUTUP
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xl md:text-2xl font-black text-slate-800">Manajemen Produk</h3>
              <button 
                onClick={() => setIsAddProductOpen(true)}
                className="w-full md:w-auto bg-pink-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black shadow-lg shadow-pink-100 flex items-center justify-center gap-2 hover:bg-pink-600 transition-all text-sm md:text-base"
              >
                <Plus size={18} />
                TAMBAH PRODUK
              </button>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-6">Produk & Varian</th>
                      <th className="px-8 py-6">Kategori</th>
                      <th className="px-8 py-6">Modal</th>
                      <th className="px-8 py-6">Harga Jual</th>
                      <th className="px-8 py-6">Stok</th>
                      <th className="px-8 py-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{p.sku || '-'}</span>
                            <span className="text-[10px] font-bold text-pink-400 mt-1 uppercase tracking-tighter">{p.variants || 'Tanpa Varian'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">{p.category}</span>
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-500">Rp {(p.cost_price || 0).toLocaleString()}</td>
                        <td className="px-8 py-6 font-bold text-pink-500">Rp {(p.selling_price || 0).toLocaleString()}</td>
                        <td className="px-8 py-6">
                          <span className={`font-black ${p.stock <= 3 ? 'text-red-500' : 'text-slate-800'}`}>{p.stock} pcs</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex gap-1">
                            <button onClick={() => handleOpenEditProduct(p)} className="p-2 text-slate-300 hover:text-blue-500 transition-all">
                              <Edit size={18} />
                            </button>
                            <button onClick={async () => {
                              if (window.confirm('Hapus produk ini?')) {
                                const { error } = await supabase.from('products').delete().eq('id', p.id);
                                if (error) alert('Gagal hapus: ' + error.message);
                                else fetchData();
                              }
                            }} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 pb-20">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 shrink-0 overflow-hidden">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package size={24} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-800 text-sm leading-tight">{p.name}</h4>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEditProduct(p)} className="text-slate-300 hover:text-blue-500">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">{p.sku} • {p.category}</p>
                    <div className="flex justify-between items-end pt-1">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Harga Jual</p>
                        <p className="font-black text-pink-500 text-sm">Rp {p.sellingPrice.toLocaleString()}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${p.stock <= 3 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                        Stok {p.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions / Riwayat Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 flex justify-between items-center">
              <h3 className="text-xl md:text-2xl font-black text-slate-800">Riwayat Penjualan</h3>
              <div className="flex gap-2">
                <button className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl text-slate-500 hover:text-pink-500">
                  <Filter size={18} />
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-6">Invoice & Waktu</th>
                      <th className="px-8 py-6">Item</th>
                      <th className="px-8 py-6">Total</th>
                      <th className="px-8 py-6">Metode</th>
                      <th className="px-8 py-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm uppercase tracking-tighter">{t.invoice}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(t.date), 'dd MMM yyyy, HH:mm')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-600">{t.items.length} Item</span>
                            <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{t.items.map(i => i.name).join(', ')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 font-black text-slate-800">Rp {t.total.toLocaleString()}</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-blue-50 text-blue-500 rounded-lg text-[10px] font-black uppercase">{t.paymentMethod}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setLastReceipt(t); setShowReceipt(true); }} className="p-2 text-slate-300 hover:text-pink-500 transition-all">
                              <Printer size={18} />
                            </button>
                            <button onClick={async () => {
                              if (window.confirm('Hapus transaksi ini?')) {
                                const { error } = await supabase.from('transactions').delete().eq('id', t.id);
                                if (error) alert('Gagal hapus: ' + error.message);
                                else fetchData();
                              }
                            }} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-20 text-slate-400 font-bold">Belum ada transaksi tercatat.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 pb-20">
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-xs uppercase">{t.invoice}</span>
                      <span className="text-[10px] font-bold text-slate-400">{format(new Date(t.date), 'dd/MM/yy HH:mm')}</span>
                    </div>
                    <span className="bg-blue-50 text-blue-500 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">{t.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-bold text-slate-500">
                      {t.items.length} Item • {t.items[0].name}{t.items.length > 1 ? '...' : ''}
                    </div>
                    <span className="font-black text-slate-800 text-sm">Rp {t.total.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => { setLastReceipt(t); setShowReceipt(true); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-pink-50 text-pink-500 rounded-xl text-[10px] font-black"
                    >
                      <Printer size={14} />
                      CETAK STRUK
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm('Hapus transaksi ini?')) {
                          const { error } = await supabase.from('transactions').delete().eq('id', t.id);
                          if (error) alert('Gagal hapus: ' + error.message);
                          else fetchData();
                        }
                      }}
                      className="w-10 flex items-center justify-center py-2 bg-red-50 text-red-500 rounded-xl"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center py-10 text-slate-400 font-bold text-sm">Belum ada riwayat penjualan.</p>}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20 md:pb-0">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Laporan Keuangan</h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wide">Analisis performa toko Anda</p>
              </div>
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
                {[
                  { id: 'today', label: 'Hari Ini' },
                  { id: '7days', label: '7 Hari' },
                  { id: 'thismonth', label: 'Bulan Ini' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setReportFilter(f.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all ${reportFilter === f.id ? 'bg-pink-500 text-white shadow-lg shadow-pink-100' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    {f.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 text-green-500 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6">
                  <ArrowUpCircle size={28} md:size={32} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Total Omzet</p>
                <h4 className="text-xl md:text-3xl font-black text-slate-800">Rp {filteredTransactions.reduce((acc, t) => acc + (Number(t.total) || 0), 0).toLocaleString()}</h4>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-500 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6">
                  <Percent size={28} md:size={32} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Laba Bersih</p>
                <h4 className="text-xl md:text-3xl font-black text-slate-800">Rp {filteredTransactions.reduce((acc, t) => acc + (Number(t.profit) || 0), 0).toLocaleString()}</h4>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-50 text-pink-500 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6">
                  <Package size={28} md:size={32} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Produk Terjual</p>
                <h4 className="text-xl md:text-3xl font-black text-slate-800">{filteredTransactions.reduce((acc, t) => acc + (t.items ? t.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0), 0)} Pcs</h4>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-50 text-amber-500 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6">
                  <Wallet size={28} md:size={32} />
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Modal Barang</p>
                <h4 className="text-xl md:text-3xl font-black text-slate-800">Rp {stockValue.toLocaleString()}</h4>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm">
              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 md:mb-8 flex items-center gap-3">
                <FileText size={20} className="text-pink-500" />
                Detail Analisis Laba Rugi ({reportFilter === 'today' ? 'Hari Ini' : reportFilter === '7days' ? '7 Hari' : 'Bulan Ini'})
              </h3>
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-800 text-sm md:text-base">Modal Barang (Stok)</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total nilai beli seluruh stok saat ini</p>
                  </div>
                  <span className="text-base md:text-xl font-black text-amber-600">Rp {stockValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-800 text-sm md:text-base">Total Penjualan</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Uang masuk dalam periode terpilih</p>
                  </div>
                  <span className="text-base md:text-xl font-black text-blue-500">Rp {filteredTransactions.reduce((acc, t) => acc + (Number(t.total) || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-800 text-sm md:text-base">Modal Terjual (HPP)</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Biaya beli barang laku periode terpilih</p>
                  </div>
                  <span className="text-base md:text-xl font-black text-red-400">Rp {filteredTransactions.reduce((acc, t) => acc + ((Number(t.total) || 0) - (Number(t.profit) || 0)), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-6 md:p-8 bg-pink-500 text-white rounded-[30px] md:rounded-[40px] shadow-xl shadow-pink-100">
                  <div>
                    <p className="text-xl md:text-2xl font-black">Laba Bersih Periode</p>
                    <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Keuntungan murni dlm periode terpilih</p>
                  </div>
                  <span className="text-2xl md:text-4xl font-black">Rp {filteredTransactions.reduce((acc, t) => acc + (Number(t.profit) || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            <header>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Pengaturan Toko</h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wide">Konfigurasi profil dan sistem</p>
            </header>

            <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 space-y-6 md:space-y-8">
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Toko</label>
                    <input 
                      className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-transparent focus:border-pink-500 outline-none font-bold text-sm md:text-base transition-all" 
                      value={localSettings.storeName}
                      onChange={(e) => setLocalSettings({...localSettings, storeName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">No. WhatsApp</label>
                    <input 
                      className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-transparent focus:border-pink-500 outline-none font-bold text-sm md:text-base transition-all" 
                      value={localSettings.phone}
                      onChange={(e) => setLocalSettings({...localSettings, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Modal Barang (Otomatis)</label>
                    <div className="w-full p-3 md:p-4 bg-slate-100 rounded-xl md:rounded-2xl border-2 border-transparent font-black text-sm md:text-base text-pink-600 flex justify-between items-center">
                      <span>Rp {stockValue.toLocaleString()}</span>
                      <span className="text-[8px] md:text-[10px] bg-white px-2 py-0.5 rounded-lg text-slate-400">Dihitung dari Stok</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Alamat Toko</label>
                  <textarea 
                    className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-transparent focus:border-pink-500 outline-none font-bold text-sm md:text-base transition-all h-20 md:h-24 resize-none" 
                    value={localSettings.address}
                    onChange={(e) => setLocalSettings({...localSettings, address: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Pesan Bawah Struk</label>
                  <input 
                    className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-transparent focus:border-pink-500 outline-none font-bold text-sm md:text-base transition-all" 
                    value={localSettings.receiptFooter}
                    onChange={(e) => setLocalSettings({...localSettings, receiptFooter: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 md:pt-8 border-t border-slate-100">
                <h4 className="font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-base">
                  <Package size={18} className="text-pink-500" />
                  Kategori Produk
                </h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {localCategories.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-pink-50 text-pink-500 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs group">
                      <span>{cat}</span>
                      <button onClick={() => setLocalCategories(localCategories.filter(c => c !== cat))} className="opacity-50 hover:opacity-100 hover:text-red-500 transition-all">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Nama Kategori Baru"
                    className="flex-1 p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none font-bold text-xs md:text-sm"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="bg-pink-500 text-white px-4 rounded-xl font-bold text-xs hover:bg-pink-600 transition-all"
                  >
                    TAMBAH
                  </button>
                </div>
              </div>

              <div className="pt-6 md:pt-8 border-t border-slate-100 flex flex-col gap-4">
                <h4 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <History size={18} className="text-red-500" />
                  Reset Data
                </h4>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-[10px] md:text-xs text-red-600 font-bold mb-3 uppercase tracking-tight">Hanya menghapus riwayat transaksi, data produk tetap aman.</p>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Hapus SEMUA riwayat transaksi? Tindakan ini tidak bisa dibatalkan.')) {
                        if (window.confirm('APAKAH ANDA YAKIN? Klik OK untuk menghapus.')) {
                          const { error } = await supabase.from('transactions').delete().neq('id', 0); // Delete all
                          if (error) alert('Gagal hapus: ' + error.message);
                          else {
                            setTransactions([]);
                            alert('Riwayat transaksi telah dibersihkan!');
                            fetchData();
                          }
                        }
                      }
                    }}
                    className="w-full py-3 bg-white border-2 border-red-200 text-red-500 rounded-xl font-black text-xs hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
                  >
                    RESET RIWAYAT TRANSAKSI
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-base md:text-lg shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                <Save size={20} />
                SIMPAN PENGATURAN
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation - Universal */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-white/80 backdrop-blur-md border-t border-slate-100 z-[100] flex justify-center items-center shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-4">
        <div className="flex w-full max-w-6xl justify-around md:justify-center md:gap-8">
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`flex flex-col items-center justify-center gap-1.5 transition-all p-2 rounded-2xl min-w-[60px] md:min-w-[100px] ${activeTab === item.id ? 'text-pink-500 bg-pink-50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <item.icon size={24} className={`md:w-7 md:h-7 ${activeTab === item.id ? 'scale-110' : ''}`} />
              <span className={`text-[10px] md:text-xs font-black uppercase truncate tracking-tighter ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      </div>
    </div>
  );
}
