import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Trash2, Loader, ShieldCheck, 
  ShoppingBag, Plus, Minus, Database
} from 'lucide-react';
import api from '../../api/axios';

const SaleModal = ({ onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const res = await api.get('/inventory');
        const list = res.data.products || (Array.isArray(res.data) ? res.data : []);
        setProducts(list);
      } catch (e) { console.error("Sync failed"); }
    };
    loadInventory();
  }, []);

  const addToCart = (p) => {
    if (p.totalStock <= 0) return;
    if (cart.find(item => item._id === p._id)) return;
    setCart([...cart, { ...p, quantity: 1, soldPrice: p.sellingPrice || 0 }]);
    setSearch('');
  };

  const updateItem = (idx, field, val) => {
    const newCart = [...cart];
    if (field === 'quantity') {
      newCart[idx].quantity = Math.max(1, Math.min(Number(val), newCart[idx].totalStock));
    } else {
      newCart[idx][field] = Number(val);
    }
    setCart(newCart);
  };

  const handleSave = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        items: cart.map(i => ({ productId: i._id, quantity: i.quantity, soldPrice: i.soldPrice }))
      };
      const res = await api.post('/sales', payload);
      onSuccess(res.data);
    } catch (e) {
      alert(e.response?.data?.message || "Transaction Failed");
    } finally {
      setIsSaving(false);
    }
  };

  const total = cart.reduce((acc, i) => acc + (i.soldPrice * i.quantity), 0);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? products.filter(p => p.name.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query)).slice(0, 5) : [];
  }, [search, products]);

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContainer 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* FIXED HEADER */}
        <TerminalHeader>
           <div className="brand">
              <div className="logo-sq"><img src="/logo.png" alt="Logo" /></div>
              <div className="title">
                 <span>POS TERMINAL</span>
                 <h1>New Sale</h1>
              </div>
           </div>
           <button className="close-btn" onClick={onClose}><X size={24}/></button>
        </TerminalHeader>

        {/* FIXED SEARCH SECTION */}
        <SearchHUD>
          <div className="search-pill">
            <Search size={18} color="#00B0FF" />
            <input placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>

          <AnimatePresence>
            {search.length > 0 && (
              <SearchDropdown initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {searchResults.length > 0 ? searchResults.map(p => (
                  <div key={p._id} className={`drop-row ${p.totalStock <= 0 ? 'disabled' : ''}`} onClick={() => addToCart(p)}>
                    <div className="n"><strong>{p.name}</strong><small>{p.sku}</small></div>
                    <div className="v"><span className="stock">{p.totalStock} left</span><span className="price">Rwf {p.sellingPrice}</span></div>
                  </div>
                )) : <div className="no-res">No results found</div>}
              </SearchDropdown>
            )}
          </AnimatePresence>
        </SearchHUD>

        {/* SCROLLABLE CART SECTION */}
        <CartArea>
          {cart.length > 0 ? cart.map((item, idx) => (
            <ItemCard key={item._id}>
              <div className="card-top">
                  <div className="item-id"><strong>{item.name}</strong><code>{item.sku}</code></div>
                  <button className="del" onClick={() => setCart(cart.filter(c => c._id !== item._id))}><Trash2 size={16}/></button>
              </div>
              <div className="card-grid">
                 <div className="field"><label>Price</label><input type="number" value={item.soldPrice} onChange={e => updateItem(idx, 'soldPrice', e.target.value)} /></div>
                 <div className="field"><label>Qty (Max {item.totalStock})</label><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></div>
              </div>
            </ItemCard>
          )) : (
            <div className="empty-state"><ShoppingBag size={48} /><p>Cart is empty</p></div>
          )}
        </CartArea>

        {/* FIXED FOOTER - ALWAYS VISIBLE */}
        <FooterHUD>
          <div className="total-row">
             <label>NET TOTAL</label>
             <div className="val">Rwf {total.toLocaleString()}</div>
          </div>
          <div className="action-row">
             <button className="discard" onClick={onClose}>Discard</button>
             <button className="commit" onClick={handleSave} disabled={cart.length === 0 || isSaving}>
                {isSaving ? <Loader className="spin" size={20}/> : <><ShieldCheck size={18}/> Commit Sale</>}
             </button>
          </div>
        </FooterHUD>
      </ModalContainer>
    </Overlay>
  );
};

// --- STYLES ---

const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: flex-end; z-index: 5000;
  @media (min-width: 768px) { align-items: center; padding: 20px; }
`;

const ModalContainer = styled(motion.div)`
  background: #04090E; width: 100%; height: 100%; display: flex; flex-direction: column;
  @media (min-width: 768px) { height: 85vh; max-width: 500px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); }
`;

const TerminalHeader = styled.header`
  padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  .brand { display: flex; align-items: center; gap: 12px;
    .logo-sq { background: white; padding: 6px; border-radius: 10px; img { height: 20px; display: block; } }
    .title { span { font-size: 0.6rem; color: #00E676; font-weight: 800; letter-spacing: 1px; } h1 { font-size: 1.1rem; color: white; margin: 0; } } }
  .close-btn { background: none; border: none; color: #64748b; cursor: pointer; }
`;

const SearchHUD = styled.div`
  padding: 1rem; position: relative; flex-shrink: 0;
  .search-pill { background: #0D141C; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; padding: 0 1rem;
    input { background: none; border: none; padding: 12px; color: #fff; width: 100%; outline: none; font-size: 1rem; } }
`;

const SearchDropdown = styled(motion.div)`
  position: absolute; top: 100%; left: 1rem; right: 1rem; background: #0D1F2D;
  border: 1px solid #1e293b; border-radius: 16px; z-index: 9999; max-height: 250px; overflow-y: auto;
  .drop-row { padding: 12px 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between; align-items: center;
    &.disabled { opacity: 0.3; } .n { display: flex; flex-direction: column; strong { font-size: 0.9rem; } small { color: #00B0FF; } }
    .v { text-align: right; .stock { display: block; font-size: 0.6rem; color: #64748b; } .price { color: #00E676; font-weight: 800; } } }
`;

const CartArea = styled.div`
  flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 10px;
  &::-webkit-scrollbar { width: 0; }
  .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #1E293B; p { margin-top: 10px; font-weight: 800; } }
`;

const ItemCard = styled.div`
  background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);
  .card-top { display: flex; justify-content: space-between; margin-bottom: 10px;
    .item-id { strong { display: block; font-size: 0.95rem; } code { font-size: 0.7rem; color: #00B0FF; } }
    .del { background: none; border: none; color: #f43f5e; } }
  .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    .field { label { font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block; }
      input { width: 100%; background: #000; border: 1px solid #1e293b; color: #00E676; padding: 8px; border-radius: 8px; font-weight: 800; } } }
`;

const FooterHUD = styled.footer`
  padding: 1.2rem; background: #080C12; border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
    label { font-size: 0.7rem; color: #64748b; font-weight: 800; }
    .val { font-size: 1.8rem; font-weight: 900; color: #00E676; } }
  .action-row { display: flex; gap: 1rem;
    .discard { background: none; border: none; color: #64748b; font-weight: 800; }
    .commit { flex: 1; background: #00B0FF; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; } }
`;

export default SaleModal;