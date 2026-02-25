import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, ShieldCheck, Eye, Edit2, Trash2, 
  ChevronLeft, ChevronRight, TrendingUp, RefreshCcw, 
  Loader, AlertCircle, Database, Download, Activity, Zap
} from 'lucide-react';
import api from '../api/axios';

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

  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

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
    if (!realData.metrics || isDemoMode) {
      assetValue = list.reduce((acc, p) => acc + (p.totalStock * (p.price || 0)), 0);
    }
    return { totalAssetValue: assetValue, outOfStockCount: outOfStock };
  }, [filteredProducts, realData.metrics, isDemoMode]);

  const paginated = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  return (
    <PageLayout>
      <TopNav>
        <div className="brand">
          <Database size={24} color="#00D1FF" />
          <div className="text">
            <h1>Stock<span>Registry</span></h1>
            <p>v4.0.2 Stable</p>
          </div>
        </div>

        <div className="nav-controls">
          <ModeSwitch $isDemo={isDemoMode} onClick={() => setIsDemoMode(!isDemoMode)}>
            <div className="slider" />
            <span className="live"><Zap size={12} /> Live</span>
            <span className="demo"><Activity size={12} /> Demo</span>
          </ModeSwitch>

          <div className="actions desktop-only">
            <NavBtn onClick={() => setIsImportOpen(true)} title="Export CSV"><Download size={18}/></NavBtn>
            <PrimaryBtn onClick={() => setIsStockInOpen(true)}>
              <Plus size={18} /> New Asset
            </PrimaryBtn>
          </div>
        </div>
      </TopNav>

      <MetricsStrip>
        <MCard color="#00D1FF">
          <ShieldCheck size={24} />
          <div className="info">
            <label>Current Asset Value</label>
            <h3>Rwf {activeMetrics.totalAssetValue.toLocaleString()}</h3>
          </div>
        </MCard>
        <MCard color={activeMetrics.outOfStockCount > 0 ? "#FF3B6B" : "#00FFA3"}>
          <AlertCircle size={24} />
          <div className="info">
            <label>System Alerts</label>
            <h3>{activeMetrics.outOfStockCount} Depleted Items</h3>
          </div>
        </MCard>
        <MCard color="#00FFA3" className="hide-sm">
          <TrendingUp size={24} />
          <div className="info">
            <label>Inventory Flow</label>
            <h3>Healthy (82%)</h3>
          </div>
        </MCard>
      </MetricsStrip>

      <FilterSection>
        <SearchContainer>
          <Search size={18} color="#64748b" className="search-icon" />
          <input 
            placeholder="Search SKU or Name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </SearchContainer>
        
        <PillContainer>
          {['All', 'Dairy', 'Grains', 'Electronics', 'Hygiene'].map(cat => (
            <FilterPill 
              key={cat} 
              active={categoryFilter === cat} 
              onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
            >
              {cat}
            </FilterPill>
          ))}
          <RefreshBtn onClick={fetchData} className={loading ? 'spin' : ''}>
             <RefreshCcw size={16} />
          </RefreshBtn>
        </PillContainer>
      </FilterSection>

      <DataPane>
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingState key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader className="spin-loader" size={40} color="#00D1FF" />
              <p>Synchronizing Registry...</p>
            </LoadingState>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              
              {/* DESKTOP TABLE */}
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <th>Product Identity</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th align="right">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(p => (
                      <tr key={p._id}>
                        <td>
                          <AssetCell>
                            <div className="code">{p.sku}</div>
                            <div className="name">{p.name}</div>
                          </AssetCell>
                        </td>
                        <td><CatTag>{p.category}</CatTag></td>
                        <td>
                          <StockCount $isLow={p.totalStock === 0}>
                            {p.totalStock} <span>{p.unit}</span>
                          </StockCount>
                        </td>
                        <td>
                          <StatusBadge $type={p.totalStock === 0 ? 'out' : 'ok'}>
                            {p.totalStock === 0 ? 'Depleted' : 'Operational'}
                          </StatusBadge>
                        </td>
                        <td align="right">
                          <ActionGroup>
                            <button onClick={() => setViewProduct(p)} className="eye"><Eye size={16}/></button>
                            <button onClick={() => setEditProduct(p)} className="edit"><Edit2 size={16}/></button>
                            <button className="del"><Trash2 size={16}/></button>
                          </ActionGroup>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr><td colSpan="5" align="center" style={{padding: '3rem', color: '#64748b'}}>No assets found.</td></tr>
                    )}
                  </tbody>
                </Table>
              </TableWrapper>

              {/* MOBILE CARDS */}
              <MobileGrid>
                {paginated.map(p => (
                  <AssetCard key={p._id}>
                    <div className="head">
                       <div className="info"><strong>{p.name}</strong><code>{p.sku}</code></div>
                       <StatusBadge $type={p.totalStock === 0 ? 'out' : 'ok'}>{p.totalStock === 0 ? 'Out' : 'In'}</StatusBadge>
                    </div>
                    <div className="body">
                       <div className="item"><label>Volume</label><span>{p.totalStock} {p.unit}</span></div>
                       <div className="item"><label>Category</label><span>{p.category}</span></div>
                    </div>
                    <div className="foot">
                       <button className="view-btn" onClick={() => setViewProduct(p)}>Inspect Asset</button>
                       <div className="quick-actions">
                         <button onClick={() => setEditProduct(p)} className="edit"><Edit2 size={16}/></button>
                         <button className="del"><Trash2 size={16}/></button>
                       </div>
                    </div>
                  </AssetCard>
                ))}
                {paginated.length === 0 && (
                   <div style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No assets found.</div>
                )}
              </MobileGrid>

            </motion.div>
          )}
        </AnimatePresence>
      </DataPane>

      <Pagination>
        <p>Displaying {paginated.length} of {filteredProducts.length}</p>
        <div className="nav">
          <NavPage disabled={currentPage === 1} onClick={() => setCurrentPage(c => c-1)}><ChevronLeft size={20}/></NavPage>
          <div className="page-info">{currentPage} / {totalPages}</div>
          <NavPage disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c+1)}><ChevronRight size={20}/></NavPage>
        </div>
      </Pagination>

      <FloatingBtn onClick={() => setIsStockInOpen(true)}>
        <Plus size={28} color="#000" />
      </FloatingBtn>

      {isStockInOpen && <StockInModal onClose={() => setIsStockInOpen(false)} onRefresh={fetchData} />}
      {isImportOpen && <ImportCSVModal onClose={() => setIsImportOpen(false)} onRefresh={fetchData} />}
      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onRefresh={fetchData} />}
      {viewProduct && <ProductDetailsModal product={viewProduct} batches={realData.batches?.filter(b => b.productId === viewProduct._id) || []} onClose={() => setViewProduct(null)} />}
    </PageLayout>
  );
}

// --- STYLED COMPONENTS ---

const PageLayout = styled.div`
  min-height: 100vh;
  background: #05080A;
  color: #fff;
  padding: 1rem;
  font-family: 'Inter', sans-serif;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden; /* Critical for stopping horizontal scroll */

  @media (min-width: 768px) { padding: 1.5rem; }
  @media (min-width: 1024px) { padding: 2.5rem; max-width: 1400px; margin: 0 auto; }
  
  *, *::before, *::after { box-sizing: border-box; }
`;

const TopNav = styled.nav`
  display: flex; 
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1.2rem;
  width: 100%;

  @media (min-width: 600px) {
    flex-direction: row;
    justify-content: space-between; 
    align-items: center;
  }

  .brand {
    display: flex; align-items: center; gap: 10px;
    h1 { font-size: 1.3rem; margin: 0; font-weight: 900; letter-spacing: -0.5px; span { color: #00D1FF; } }
    p { margin: 0; font-size: 0.7rem; color: #64748b; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  }

  .nav-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    @media (min-width: 600px) { width: auto; }
  }

  .actions { display: flex; gap: 10px; }
  .desktop-only { @media (max-width: 768px) { display: none; } }
`;

const ModeSwitch = styled.div`
  background: rgba(15, 23, 42, 0.6); border: 1px solid #1E293B; border-radius: 50px;
  width: 130px; height: 36px; display: flex; align-items: center;
  position: relative; cursor: pointer; padding: 4px; flex-shrink: 0;

  .slider {
    position: absolute; width: 60px; height: 28px; background: #00D1FF;
    border-radius: 40px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    left: ${p => p.$isDemo ? '65px' : '4px'};
    box-shadow: 0 0 15px rgba(0, 209, 255, 0.4);
  }

  span {
    flex: 1; z-index: 1; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px;
    color: #94A3B8; transition: 0.3s;
  }
  .live { color: ${p => !p.$isDemo ? '#000' : '#94a3b8'}; }
  .demo { color: ${p => p.$isDemo ? '#000' : '#94a3b8'}; }
`;

const NavBtn = styled.button`
  background: #0F172A; border: 1px solid #1E293B; color: #fff;
  width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: 0.2s;
  &:hover { background: #1e293b; color: #00D1FF; }
`;

const PrimaryBtn = styled.button`
  background: #00D1FF; color: #000; border: none; padding: 0 1rem;
  border-radius: 12px; font-weight: 800; font-size: 0.8rem; height: 40px;
  display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 209, 255, 0.3); }
`;

const MetricsStrip = styled.div`
  display: grid; 
  grid-template-columns: 1fr; /* Strict stack on mobile */
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  
  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
  }
  
  .hide-sm {
    @media (max-width: 850px) { display: none; }
  }
`;

const MCard = styled.div`
  background: rgba(15, 23, 42, 0.4); border: 1px solid #1E293B; border-left: 4px solid ${p => p.color};
  padding: 1.2rem; border-radius: 16px; display: flex; align-items: center; gap: 1rem;
  width: 100%;

  svg { color: ${p => p.color}; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  label { display: block; font-size: 0.65rem; color: #64748B; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
  h3 { margin: 4px 0 0 0; font-size: 1.2rem; font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const FilterSection = styled.div`
  display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; width: 100%;
  @media (min-width: 850px) { flex-direction: row; justify-content: space-between; align-items: center; }
`;

const SearchContainer = styled.div`
  background: #0F172A; border: 1px solid #1E293B; border-radius: 12px;
  display: flex; align-items: center; padding: 0 1rem; height: 46px;
  width: 100%;
  @media (min-width: 850px) { max-width: 350px; }
  
  .search-icon { flex-shrink: 0; }
  input { background: none; border: none; color: #fff; margin-left: 10px; width: 100%; outline: none; font-size: 0.85rem; }
`;

const PillContainer = styled.div`
  display: flex; align-items: center; gap: 8px; overflow-x: auto;
  padding-bottom: 4px; width: 100%;
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none; scrollbar-width: none; 
`;

const FilterPill = styled.button`
  background: ${p => p.active ? '#00D1FF' : 'rgba(15, 23, 42, 0.6)'};
  color: ${p => p.active ? '#000' : '#94A3B8'};
  border: 1px solid ${p => p.active ? '#00D1FF' : '#1E293B'};
  padding: 8px 16px; border-radius: 50px; font-size: 0.7rem; font-weight: 800;
  white-space: nowrap; cursor: pointer; transition: 0.2s; flex-shrink: 0;
  &:hover { background: ${p => p.active ? '#00D1FF' : '#1E293B'}; color: ${p => p.active ? '#000' : '#fff'}; }
`;

const RefreshBtn = styled.button`
  background: none; border: none; color: #475569; cursor: pointer; padding: 8px; flex-shrink: 0;
  transition: 0.2s; &:hover { color: #fff; }
  &.spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const DataPane = styled.div` min-height: 400px; width: 100%; `;

const TableWrapper = styled.div`
  display: none;
  @media (min-width: 850px) { 
    display: block; background: rgba(15, 23, 42, 0.4); border: 1px solid #1E293B; border-radius: 20px; overflow: hidden;
  }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th { text-align: left; padding: 1.2rem 1.5rem; font-size: 0.7rem; font-weight: 800; color: #64748B; text-transform: uppercase; border-bottom: 1px solid #1E293B; letter-spacing: 0.5px; }
  td { padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(30, 41, 59, 0.5); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: rgba(255,255,255,0.02); }
`;

const AssetCell = styled.div`
  .code { color: #00D1FF; font-size: 0.65rem; font-family: monospace; font-weight: 600; margin-bottom: 4px; }
  .name { font-weight: 700; color: #fff; font-size: 0.9rem; }
`;

const CatTag = styled.span`
  background: rgba(148, 163, 184, 0.1); color: #94A3B8;
  padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 700;
`;

const StockCount = styled.div`
  font-weight: 900; font-size: 1.1rem; color: ${p => p.$isLow ? '#FF3B6B' : '#fff'};
  span { font-size: 0.7rem; color: #64748B; font-weight: 600; margin-left: 4px;}
`;

const StatusBadge = styled.span`
  padding: 6px 12px; border-radius: 50px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;
  background: ${p => p.$type === 'out' ? 'rgba(255, 59, 107, 0.1)' : 'rgba(0, 255, 163, 0.1)'};
  color: ${p => p.$type === 'out' ? '#FF3B6B' : '#00FFA3'};
`;

const ActionGroup = styled.div`
  display: flex; gap: 8px; justify-content: flex-end;
  button {
    width: 34px; height: 34px; border-radius: 10px; border: none; cursor: pointer;
    background: #1E293B; color: #94A3B8; display: flex; align-items: center; justify-content: center; transition: 0.2s;
    &:hover { color: #fff; background: #334155; }
    &.del:hover { color: #FF3B6B; background: rgba(255, 59, 107, 0.1); }
  }
`;

const MobileGrid = styled.div`
  display: flex; flex-direction: column; gap: 1rem; width: 100%;
  @media (min-width: 850px) { display: none; }
`;

const AssetCard = styled.div`
  background: rgba(15, 23, 42, 0.4); border: 1px solid #1E293B; border-radius: 16px; padding: 1.2rem; width: 100%;
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.2rem; 
    strong { display: block; font-size: 1rem; font-weight: 800; margin-bottom: 4px; } 
    code { color: #00D1FF; font-size: 0.7rem; font-family: monospace; font-weight: 600; } }
  .body { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; margin-bottom: 1.2rem;
    label { display: block; font-size: 0.6rem; color: #64748B; text-transform: uppercase; font-weight: 800; margin-bottom: 4px; }
    span { font-weight: 800; font-size: 0.9rem; } }
  .foot { display: flex; gap: 10px; 
    .view-btn { flex: 1; height: 42px; border-radius: 10px; background: #1E293B; border: none; color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; &:hover { background: #334155; } }
    .quick-actions { display: flex; gap: 8px; 
      button { width: 42px; height: 42px; border-radius: 10px; border: none; background: #1E293B; color: #94A3B8; display: flex; align-items: center; justify-content: center; cursor: pointer;
        &.del { color: #FF3B6B; background: rgba(255, 59, 107, 0.1); } }
    }
  }
`;

const Pagination = styled.div`
  margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%;
  @media (min-width: 768px) { flex-direction: row; justify-content: space-between; }
  p { color: #64748B; font-size: 0.8rem; font-weight: 600;}
  .nav { display: flex; align-items: center; gap: 10px; }
  .page-info { font-weight: 800; font-family: monospace; font-size: 1rem; color: #00D1FF; background: #0F172A; padding: 6px 14px; border-radius: 10px; border: 1px solid #1E293B;}
`;

const NavPage = styled.button`
  width: 40px; height: 40px; border-radius: 10px; border: 1px solid #1E293B;
  background: #0F172A; color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s;
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  &:not(:disabled):hover { background: #1E293B; color: #00D1FF; }
`;

const FloatingBtn = styled.button`
  position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px;
  background: #00D1FF; border-radius: 18px; border: none; 
  box-shadow: 0 10px 25px rgba(0, 209, 255, 0.4); display: flex; align-items: center; justify-content: center;
  z-index: 100; cursor: pointer; transition: 0.2s;
  &:hover { transform: scale(1.05); }
  @media (min-width: 850px) { display: none; }
`;

const LoadingState = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 0;
  .spin-loader { animation: spin 1s linear infinite; }
  p { margin-top: 1.5rem; color: #64748B; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; font-size: 0.75rem;}
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;