import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ShoppingBag, Search, Trash2, Plus, Minus, CheckCircle, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import ReceiptModal from '../components/Sales/ReceiptModal';
import WasteModal from '../components/Sales/WasteModal';

const Container = styled.div` display: grid; grid-template-columns: 1fr 420px; gap: 2rem; height: 85vh; `;

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setProducts(res.data.products || []);
    } catch (e) { console.error(e); }
  };

  const addToCart = (p) => {
    if ((p.totalStock || 0) <= 0) return;
    const exists = cart.find(item => item._id === p._id);
    if (exists) {
      if (exists.quantity < p.totalStock) {
        setCart(cart.map(i => i._id === p._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
    } else {
      setCart([...cart, { ...p, quantity: 1 }]);
    }
  };

  const handleCheckout = async () => {
    try {
      const res = await api.post('/sales', { 
        items: cart.map(i => ({ productId: i._id, quantity: i.quantity })) 
      });
      setCompletedSale(res.data); // Store for receipt
      setCart([]);
      fetchInventory();
    } catch (e) { alert("Checkout failed: Out of stock or invalid data"); }
  };

  const total = cart.reduce((acc, i) => acc + ((i.sellingPrice || 0) * i.quantity), 0);

  return (
    <Container>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <HeaderRow>
          <h1>Sales Terminal</h1>
          <button className="waste-btn" onClick={() => setIsWasteModalOpen(true)}>Record Waste</button>
        </HeaderRow>

        <SearchContainer>
          <Search size={20} opacity={0.4} />
          <input placeholder="Search product name or SKU..." onChange={e => setSearch(e.target.value)} />
        </SearchContainer>

        <ProductGrid>
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
            <ItemCard key={p._id} onClick={() => addToCart(p)} disabled={p.totalStock <= 0}>
              <span className="cat">{p.category?.toUpperCase()}</span>
              <h3>{p.name}</h3>
              <div className="price">{p.sellingPrice?.toLocaleString()} RWF</div>
              <div className="stock">{p.totalStock} {p.unit} left</div>
            </ItemCard>
          ))}
        </ProductGrid>
      </div>

      <CartSection>
        <div className="cart-head"><ShoppingBag /> <span>Active Cart</span></div>
        <div className="cart-body">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div className="cart-item" key={item._id} initial={{ x: 20 }} animate={{ x: 0 }} exit={{ x: -20 }}>
                <div className="details">
                  <strong>{item.name}</strong>
                  <span>{item.sellingPrice?.toLocaleString()} RWF</span>
                </div>
                <div className="controls">
                  <Minus size={14} onClick={() => setCart(cart.map(i => i._id === item._id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} />
                  <strong>{item.quantity}</strong>
                  <Plus size={14} onClick={() => addToCart(item)} />
                </div>
                <Trash2 size={16} className="del" onClick={() => setCart(cart.filter(i => i._id !== item._id))} />
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && <div className="empty">Your cart is empty</div>}
        </div>
        <div className="cart-foot">
          <div className="total-box">
            <span>Amount Payable</span>
            <strong>{total.toLocaleString()} RWF</strong>
          </div>
          <button className="pay-btn" disabled={cart.length === 0} onClick={handleCheckout}>
            Complete Transaction
          </button>
        </div>
      </CartSection>

      {completedSale && <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />}
      {isWasteModalOpen && <WasteModal onClose={() => { setIsWasteModalOpen(false); fetchInventory(); }} products={products} />}
    </Container>
  );
};

// STYLES
const HeaderRow = styled.div` display: flex; justify-content: space-between; align-items: center; .waste-btn { background: none; border: 1px solid #FF8C42; color: #FF8C42; padding: 10px 20px; border-radius: 12px; cursor: pointer; } `;
const SearchContainer = styled.div` background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; padding: 0 1rem; input { background: none; border: none; color: white; padding: 15px; width: 100%; outline: none; } `;
const ProductGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; overflow-y: auto; `;
const ItemCard = styled.div` background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 20px; cursor: pointer; .cat { color: #007BFF; font-size: 0.7rem; font-weight: 900; } h3 { margin: 8px 0; font-size: 1.1rem; } .price { font-size: 1.3rem; font-weight: 800; color: #28A745; } .stock { font-size: 0.8rem; opacity: 0.5; margin-top: 10px; } ${props => props.disabled && 'opacity: 0.3; pointer-events: none;'} `;
const CartSection = styled.div` background: #0D1F2D; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; .cart-head { padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; align-items: center; font-weight: bold; } .cart-body { flex: 1; padding: 1.5rem; overflow-y: auto; } .cart-item { background: rgba(255,255,255,0.02); padding: 15px; border-radius: 14px; display: flex; align-items: center; gap: 15px; margin-bottom: 10px; .details { flex: 1; display: flex; flex-direction: column; span { font-size: 0.8rem; color: #28A745; } } .controls { display: flex; align-items: center; gap: 10px; background: #04090E; padding: 6px 12px; border-radius: 10px; } .del { cursor: pointer; color: #dc3545; opacity: 0.6; } } .total-box { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; strong { font-size: 1.8rem; color: #28A745; } } .cart-foot { padding: 2rem; background: rgba(255,255,255,0.02); } .pay-btn { width: 100%; padding: 1.2rem; border-radius: 14px; border: none; background: #28A745; color: white; font-weight: bold; font-size: 1.1rem; cursor: pointer; &:disabled { opacity: 0.3; } } .empty { text-align: center; margin-top: 3rem; opacity: 0.3; } `;

export default Sales;