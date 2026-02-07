import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Upload, ShieldCheck, Eye, Edit2, Trash2, 
  ChevronLeft, ChevronRight, TrendingUp, RefreshCcw, 
  Loader, AlertCircle, Database, Download, ArrowUpRight
} from 'lucide-react';
import api from '../api/axios';

// Modals
import StockInModal from '../components/Inventory/StockInModal';
import EditProductModal from '../components/Inventory/EditProductModal';
import ProductDetailsModal from '../components/Inventory/ProductDetailsModal';
import ImportCSVModal from '../components/Inventory/ImportCSVModal';

export default function Inventory() {
  const [realData, setRealData] = useState({ products: [], metrics: null });
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false); 
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  // --- 1. DATA ENGINE ---
  const INV_BASELINE = useMemo(() => ({
    products: [
      { _id: "SIM-1", name: "Inyange Milk 500ml", category: "Dairy", sku: "MILK-001", totalStock: 0, minStockLevel: 20, unit: "pcs", velocity: "High", price: 600 },
      { _id: "SIM-2", name: "Basmati Rice 25kg", category: "Grains", sku: "RICE-202", totalStock: 18, minStockLevel: 25, unit: "bags", velocity: "Medium", price: 25000 },
      { _id: "SIM-3", name: "Samsung USB-C", category: "Electronics", sku: "ELEC-050", totalStock: 45, minStockLevel: 10, unit: "pcs", velocity: "Low", price: 12000 },
      { _id: "SIM-4", name: "Movit Soap Blue", category: "Hygiene", sku: "HYG-010", totalStock: 89, minStockLevel: 15, unit: "pcs", velocity: "High", price: 450 }
    ],
    metrics: { totalAssetValue: 14502000, potentialRevenue: 18400500, lowStockCount: 2 }
  }), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
        setRealData(INV_BASELINE);
        setLoading(false);
        return;
    }
    try {
      const res = await api.get('/inventory');
      const productList = Array.isArray(res.data) ? res.data : (res.data.products || []);
      setRealData({ products: productList, metrics: res.data.metrics || null });
    } catch (e) {
      setRealData({ products: [], metrics: null });
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  }, [isDemoMode, INV_BASELINE]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. FILTERS & METRICS ---
  const filteredProducts = useMemo(() => {
    return (realData.products || []).filter(p => 
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === 'All' || p.category === categoryFilter)
    );
  }, [realData, search, categoryFilter]);

  const activeMetrics = useMemo(() => {
    const list = filteredProducts;
    const outOfStock = list.filter(p => p.totalStock === 0).length;
    let assetValue = realData.metrics?.totalAssetValue || 0;
    let potentialRev = realData.metrics?.potentialRevenue || 0;

    if (!realData.metrics || isDemoMode) {
        assetValue = list.reduce((acc, p) => acc + (p.totalStock * (p.price || 0)), 0);
        potentialRev = assetValue * 1.35;
    }
    return { totalAssetValue: assetValue, potentialRevenue: potentialRev, outOfStockCount: outOfStock };
  }, [realData, filteredProducts, isDemoMode]);

  const paginated = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const handleDelete = async (id) => {
    if (isDemoMode) return;
    if (window.confirm("Delete asset?")) {
      try { await api.delete(`/inventory/${id}`); fetchData(); } catch (e) { alert("Failed"); }
    }
  };

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* --- MOBILE-OPTIMIZED HEADER --- */}
      <HeaderSection>
        <div className="top-row">
            <div className="brand-stack">
              <div className="logo-outer"><Database size={20} color="#00B0FF" /></div>
              <h1>Stock <span>Registry</span></h1>
            </div>
            
            <div className="mode-toggle" onClick={() => setIsDemoMode(!isDemoMode)}>
                <span className={`dot ${isDemoMode ? 'sim' : 'live'}`} />
                <span className="label">{isDemoMode ? 'DEMO' : 'LIVE'}</span>
            </div>
        </div>

        <div className="controls-row">
            <div className="search-box">
                <Search size={16} />
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="icon-btn secondary" onClick={() => setIsImportOpen(true)}><Download size={18}/></button>
            {/* Desktop Add Button (Hidden on Mobile) */}
            <button className="icon-btn primary desktop-only" onClick={() => setIsStockInOpen(true)}>
               <Plus size={18}/> <span>Add</span>
            </button>
        </div>
      </HeaderSection>

      {/* --- SWIPEABLE METRICS ROW --- */}
      <MetricScrollContainer>
        <Card $bg="linear-gradient(135deg, #0D1F2D 0%, #050A0F 100%)" className="main-stat">
          <div className="label-row"><label>Inventory Value</label><ShieldCheck size={16} color="#00B0FF" /></div>
          <h2>Rwf {activeMetrics.totalAssetValue.toLocaleString()}</h2>
          <div className="liquid-bar"><div className="bar-bg"><div className="bar-fill" style={{width: '72%'}} /></div></div>
        </Card>

        <Card $border={activeMetrics.outOfStockCount > 0 ? "#f43f5e88" : "transparent"}>
          <div className="label-row"><label>Alerts</label><AlertCircle size={16} color="#f43f5e" /></div>
          <h2 className={activeMetrics.outOfStockCount > 0 ? 'critical' : ''}>{activeMetrics.outOfStockCount} <small>Items</small></h2>
        </Card>

        <Card>
          <div className="label-row"><label>Potential</label><TrendingUp size={16} color="#00E676" /></div>
          <h2 className="yield">{activeMetrics.potentialRevenue.toLocaleString()}</h2>
        </Card>
      </MetricScrollContainer>

      {/* --- FILTER TABS --- */}
      <ControlBar>
        <TabContainer>
          {['All', 'Dairy', 'Grains', 'Electronics', 'Hygiene'].map(cat => (
            <Tab key={cat} className={categoryFilter === cat ? 'active' : ''} onClick={() => {setCategoryFilter(cat); setCurrentPage(1);}}>
              {cat}
            </Tab>
          ))}
        </TabContainer>
        <button className="refresh-circle" onClick={fetchData}><RefreshCcw size={16} className={loading ? 'spin' : ''} /></button>
      </ControlBar>

      {/* --- DATA VIEWPORT --- */}
      <DataViewport>
        {/* DESKTOP TABLE */}
        <table className="desktop-grid">
          <thead>
            <tr><th>Asset</th><th>Sector</th><th>Stock</th><th>Status</th><th>Vel</th><th align="right">Ops</th></tr>
          </thead>
          <tbody>
            <AnimatePresence mode='wait'>
              {loading ? (
                <tr><td colSpan="6" align="center" style={{padding: '50px'}}><Loader className="spin" size={24} color="#00B0FF" /></td></tr>
              ) : paginated.map(p => (
                  <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td><div className="name-block"><strong>{p.name}</strong><code>{p.sku}</code></div></td>
                    <td><span className="cat-pill">{p.category}</span></td>
                    <td><StockVal $isOut={p.totalStock === 0}>{p.totalStock} <small>{p.unit}</small></StockVal></td>
                    <td><StatusBadge $type={p.totalStock === 0 ? 'out' : 'ok'}>{p.totalStock === 0 ? 'Empty' : 'OK'}</StatusBadge></td>
                    <td><VelocityTag>{p.velocity || 'Med'}</VelocityTag></td>
                    <td align="right">
                      <div className="ops">
                        <button onClick={() => setViewProduct(p)}><Eye size={16}/></button>
                        <button onClick={() => setEditProduct(p)} className="edit"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(p._id)} className="del"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              }
            </AnimatePresence>
          </tbody>
        </table>

        {/* MOBILE CARDS */}
        <div className="mobile-view">
           {loading ? <div className="mob-load"><Loader className="spin" size={24} color="#00B0FF" /></div> : 
             paginated.map(p => (
             <div className="m-card" key={p._id}>
                <div className="c-head">
                  <div className="n-info"><strong>{p.name}</strong><code>{p.sku}</code></div>
                  <StatusBadge $type={p.totalStock === 0 ? 'out' : 'ok'}>{p.totalStock === 0 ? 'Empty' : 'OK'}</StatusBadge>
                </div>
                <div className="c-grid">
                   <div className="cell"><label>Qty</label><StockVal $isOut={p.totalStock === 0}>{p.totalStock} {p.unit}</StockVal></div>
                   <div className="cell"><label>Sector</label><span>{p.category}</span></div>
                   <div className="cell"><label>Value</label><span className="money">Rwf {(p.price * p.totalStock).toLocaleString()}</span></div>
                </div>
                <div className="c-foot">
                   <button onClick={() => setViewProduct(p)} className="btn-view">View Details</button>
                   <div className="icon-group">
                      <button onClick={() => setEditProduct(p)} className="icon-btn edit"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(p._id)} className="icon-btn del"><Trash2 size={16}/></button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </DataViewport>

      {/* PAGINATION */}
      <PaginationContainer>
        <p><span>{filteredProducts.length}</span> items</p>
        <div className="nav-group">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}><ChevronLeft size={16}/></button>
          <div className="page-num">{currentPage} / {totalPages}</div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}><ChevronRight size={16}/></button>
        </div>
      </PaginationContainer>

      {/* MOBILE FLOATING ADD BUTTON */}
      <FloatingAddButton onClick={() => setIsStockInOpen(true)}>
        <Plus size={24} color="white" />
      </FloatingAddButton>

      {/* MODALS */}
      {isStockInOpen && <StockInModal onClose={() => setIsStockInOpen(false)} onRefresh={fetchData} />}
      {isImportOpen && <ImportCSVModal onClose={() => setIsImportOpen(false)} onRefresh={fetchData} />}
      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onRefresh={fetchData} />}
      {viewProduct && <ProductDetailsModal product={viewProduct} batches={realData.batches?.filter(b => b.productId === viewProduct._id) || []} onClose={() => setViewProduct(null)} />}
    </PageWrapper>
  );
}

// --- TITANIUM RESPONSIVE STYLES ---

const PageWrapper = styled(motion.div)`
  max-width: 1400px; margin: 0 auto; padding: 1rem; color: #fff; background: #04080F; min-height: 100vh; padding-bottom: 80px;
  @media (min-width: 768px) { padding: 2rem; }
`;

const HeaderSection = styled.header`
  display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;
  @media (min-width: 1024px) { flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
  
  .top-row { display: flex; justify-content: space-between; align-items: center; width: 100%;
    @media (min-width: 1024px) { width: auto; gap: 2rem; } }

  .brand-stack { display: flex; align-items: center; gap: 0.8rem;
    .logo-outer { width: 40px; height: 40px; background: #0D1F2D; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); }
    h1 { margin: 0; font-size: 1.4rem; font-weight: 900; letter-spacing: -0.5px; span { color: #00B0FF; } } }

  .mode-toggle { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 50px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
    .dot { width: 6px; height: 6px; border-radius: 50%; &.live { background: #00E676; } &.sim { background: #FF9100; } }
    .label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; } }

  .controls-row { display: flex; gap: 0.8rem; width: 100%; @media (min-width: 1024px) { width: auto; }
    .search-box { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 1rem; display: flex; align-items: center; color: #64748b; flex: 1; height: 44px;
      input { background: none; border: none; padding: 0 0 0 10px; color: white; outline: none; width: 100%; font-weight: 600; font-size: 0.9rem; } }
    .icon-btn { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); color: white; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; 
      &.primary { background: #00B0FF; width: auto; padding: 0 20px; gap: 8px; span { font-weight: 700; font-size: 0.85rem; } } }
    .desktop-only { @media (max-width: 768px) { display: none; } } }
`;

// --- HORIZONTAL SCROLL METRICS (Mobile Friendly) ---
const MetricScrollContainer = styled.div`
  display: flex; gap: 1rem; margin-bottom: 1.5rem; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 10px;
  &::-webkit-scrollbar { height: 4px; } &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  @media (min-width: 1024px) { display: grid; grid-template-columns: repeat(3, 1fr); overflow: visible; padding-bottom: 0; }
`;

const Card = styled.div`
  min-width: 260px; scroll-snap-align: start; flex-shrink: 0;
  background: ${p => p.$bg || 'rgba(13, 31, 45, 0.4)'}; border: 1px solid ${p => p.$border || 'rgba(255,255,255,0.06)'}; padding: 1.2rem; border-radius: 20px; 
  .label-row { display: flex; justify-content: space-between; label { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; } }
  .value-row { display: flex; align-items: baseline; gap: 6px; margin: 0.5rem 0; h2 { margin: 0; font-size: 1.5rem; font-weight: 900; &.yield { color: #00E676; } } small { font-weight: 900; color: #475569; font-size: 0.7rem; } }
  .alert-content { margin: 0.5rem 0; h2 { margin: 0; font-size: 1.8rem; &.critical { color: #f43f5e; } } span { font-weight: 800; color: #64748b; font-size: 0.8rem; } }
  .liquid-bar { margin-top: 8px; .bar-bg { height: 4px; background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; .bar-fill { height: 100%; background: #00B0FF; } } }
`;

const ControlBar = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem;
  .refresh-circle { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); color: #64748b; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; .spin { animation: spin 1s linear infinite; } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const TabContainer = styled.div`
  display: flex; background: #0D1F2D; padding: 4px; border-radius: 12px; gap: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button`
  background: none; border: none; color: #64748b; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: 0.3s; white-space: nowrap;
  @media (min-width: 768px) { padding: 10px 24px; font-size: 0.85rem; }
  &.active { background: #00B0FF; color: white; }
`;

const DataViewport = styled.div`
  /* DESKTOP TABLE - VISIBLE > 1100px */
  .desktop-grid { width: 100%; border-collapse: collapse; display: none;
    @media (min-width: 1100px) { display: table; }
    th { text-align: left; padding: 1.2rem; font-size: 0.7rem; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.06); }
    td { padding: 1rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.03); 
      .name-block { strong { display: block; font-size: 0.9rem; } code { font-size: 0.65rem; color: #00B0FF; } }
      .cat-pill { background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 50px; font-size: 0.65rem; font-weight: 700; color: #94a3b8; }
      .ops { display: flex; gap: 8px; button { background: rgba(255,255,255,0.05); border: none; color: #94a3b8; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; &:hover { background: #00B0FF; color: white; } } } } }

  /* MOBILE CARD VIEW - VISIBLE < 1100px */
  .mobile-view { display: flex; flex-direction: column; gap: 0.8rem; @media (min-width: 1100px) { display: none; }
    .mob-load { display: flex; justify-content: center; padding: 4rem; }
    .m-card { background: #0D1F2D; padding: 1rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);
      .c-head { display: flex; justify-content: space-between; margin-bottom: 0.8rem; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);
        .n-info { strong { display: block; font-size: 0.95rem; } code { font-size: 0.65rem; color: #00B0FF; } } }
      .c-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem; 
        .cell { label { font-size: 0.6rem; color: #64748b; display: block; } span { font-size: 0.8rem; font-weight: 700; } .money { color: #00E676; } } }
      .c-foot { display: flex; gap: 8px; 
        .btn-view { flex: 1; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-weight: 700; font-size: 0.75rem; cursor: pointer; }
        .icon-btn { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.05); border: none; color: #94a3b8; display: flex; align-items: center; justify-content: center;
          &.edit { color: #00E676; } &.del { color: #f43f5e; } } } } }
`;

const FloatingAddButton = styled.button`
  position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; background: #00B0FF; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; border: none; box-shadow: 0 10px 30px rgba(0, 176, 255, 0.4); cursor: pointer; z-index: 100;
  @media (min-width: 768px) { display: none; }
`;

const StockVal = styled.div` font-weight: 800; color: ${p => p.$isOut ? '#f43f5e' : 'white'}; small { color: #64748b; font-size: 0.7rem; } `;
const StatusBadge = styled.div` padding: 4px 10px; border-radius: 50px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; background: ${p => p.$type === 'out' ? '#f43f5e20' : '#00E67620'}; color: ${p => p.$type === 'out' ? '#f43f5e' : '#00E676'}; `;
const VelocityTag = styled.div` font-size: 0.7rem; color: #64748b; display: flex; align-items: center; gap: 4px; &::before { content: '●'; font-size: 8px; color: #00B0FF; } `;
const PaginationContainer = styled.div` display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; p { font-size: 0.75rem; color: #64748b; span { color: white; } } .nav-group { display: flex; gap: 10px; button { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); color: white; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; &:disabled { opacity: 0.3; } } .page-num { font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; } } `;