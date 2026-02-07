import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, ShieldCheck, Eye, Edit2, Trash2, 
  ChevronLeft, ChevronRight, TrendingUp, RefreshCcw, 
  Loader, AlertCircle, Database, Download, Activity, Zap
} from 'lucide-react';
import api from '../api/axios';

// Assume Modals are imported from your components folder
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
      {/* 1. TOP NAVBAR */}
      <TopNav>
        <div className="brand">
          <Database size={28} color="#00D1FF" />
          <div className="text">
            <h1>Stock<span>Registry</span></h1>
            <p>v4.0.2 Stable</p>
          </div>
        </div>

        <ModeSwitch $isDemo={isDemoMode} onClick={() => setIsDemoMode(!isDemoMode)}>
          <div className="slider" />
          <span className="live"><Zap size={12} /> Live</span>
          <span className="demo"><Activity size={12} /> Demo</span>
        </ModeSwitch>

        <div className="actions">
          <NavBtn onClick={() => setIsImportOpen(true)} title="Export CSV"><Download size={18}/></NavBtn>
          <PrimaryBtn onClick={() => setIsStockInOpen(true)} className="desktop-only">
            <Plus size={18} /> New Asset
          </PrimaryBtn>
        </div>
      </TopNav>

      {/* 2. METRICS PANEL */}
      <MetricsStrip>
        <MCard color="#00D1FF">
          <ShieldCheck size={20} />
          <div>
            <label>Current Asset Value</label>
            <h3>Rwf {activeMetrics.totalAssetValue.toLocaleString()}</h3>
          </div>
        </MCard>
        <MCard color={activeMetrics.outOfStockCount > 0 ? "#FF3B6B" : "#00FFA3"}>
          <AlertCircle size={20} />
          <div>
            <label>System Alerts</label>
            <h3>{activeMetrics.outOfStockCount} Depleted Items</h3>
          </div>
        </MCard>
        <MCard color="#00FFA3" className="desktop-only">
          <TrendingUp size={20} />
          <div>
            <label>Inventory Flow</label>
            <h3>Healthy (82%)</h3>
          </div>
        </MCard>
      </MetricsStrip>

      {/* 3. SEARCH & FILTERS */}
      <FilterSection>
        <SearchContainer>
          <Search size={18} color="#64748b" />
          <input 
            placeholder="Search by SKU, Serial or Name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </SearchContainer>
        
        <PillContainer>
          {['All', 'Dairy', 'Grains', 'Electronics', 'Hygiene'].map(cat => (
            <FilterPill 
              key={cat} 
              active={categoryFilter === cat} 
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </FilterPill>
          ))}
          <RefreshBtn onClick={fetchData} loading={loading ? 1 : 0}>
             <RefreshCcw size={16} />
          </RefreshBtn>
        </PillContainer>
      </FilterSection>

      {/* 4. DATA VIEWPORT */}
      <DataPane>
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingState key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader className="spin" size={40} color="#00D1FF" />
              <p>Synchronizing Registry...</p>
            </LoadingState>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* DESKTOP TABLE */}
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <th>Product Identity</th>
                      <th className="hide-sm">Category</th>
                      <th>Quantity</th>
                      <th className="hide-md">Status</th>
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
                        <td className="hide-sm"><CatTag>{p.category}</CatTag></td>
                        <td>
                          <StockCount $isLow={p.totalStock === 0}>
                            {p.totalStock} <span>{p.unit}</span>
                          </StockCount>
                        </td>
                        <td className="hide-md">
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
                  </tbody>
                </Table>
              </TableWrapper>

              {/* MOBILE CARDS (Hidden on Desktop) */}
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
                       <button className="full-btn" onClick={() => setViewProduct(p)}>Inspect Asset</button>
                    </div>
                  </AssetCard>
                ))}
              </MobileGrid>
            </motion.div>
          )}
        </AnimatePresence>
      </DataPane>

      {/* 5. PAGINATION */}
      <Pagination>
        <p>Displaying {paginated.length} of {filteredProducts.length} assets</p>
        <div className="nav">
          <NavPage disabled={currentPage === 1} onClick={() => setCurrentPage(c => c-1)}><ChevronLeft size={20}/></NavPage>
          <div className="page-info">{currentPage} / {totalPages}</div>
          <NavPage disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c+1)}><ChevronRight size={20}/></NavPage>
        </div>
      </Pagination>

      <FloatingBtn onClick={() => setIsStockInOpen(true)}>
        <Plus size={32} color="white" />
      </FloatingBtn>

      {/* Modals placeholders */}
      {isStockInOpen && <StockInModal onClose={() => setIsStockInOpen(false)} onRefresh={fetchData} />}
      {isImportOpen && <ImportCSVModal onClose={() => setIsImportOpen(false)} onRefresh={fetchData} />}
      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onRefresh={fetchData} />}
      {viewProduct && <ProductDetailsModal product={viewProduct} batches={realData.batches?.filter(b => b.productId === viewProduct._id) || []} onClose={() => setViewProduct(null)} />}
    </PageLayout>
  );
}

// --- STYLED COMPONENTS (RESPONSIVE FOCUS) ---

const PageLayout = styled.div`
  min-height: 100vh;
  background: #05080A;
  color: #fff;
  padding: 1rem;
  font-family: 'Inter', sans-serif;
  max-width: 1440px;
  margin: 0 auto;
  @media (min-width: 1024px) { padding: 2rem; }
`;

const TopNav = styled.nav`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;

  .brand {
    display: flex; align-items: center; gap: 12px;
    h1 { font-size: 1.2rem; margin: 0; font-weight: 900; span { color: #00D1FF; } }
    p { margin: 0; font-size: 0.7rem; color: #475569; letter-spacing: 1px; }
  }

  .actions { display: flex; gap: 10px; }
  .desktop-only { @media (max-width: 768px) { display: none; } }
`;

const ModeSwitch = styled.div`
  background: #0F172A; border: 1px solid #1E293B; border-radius: 50px;
  width: 140px; height: 38px; display: flex; align-items: center;
  position: relative; cursor: pointer; padding: 4px;

  .slider {
    position: absolute; width: 66px; height: 30px; background: #00D1FF;
    border-radius: 40px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    left: ${p => p.$isDemo ? '70px' : '4px'};
    box-shadow: 0 0 15px rgba(0, 209, 255, 0.4);
  }

  span {
    flex: 1; z-index: 1; font-size: 0.65rem; font-weight: 800;
    text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px;
    color: #94A3B8; transition: 0.3s;
  }
  .live { color: ${p => !p.$isDemo ? '#000' : '#94a3b8'}; }
  .demo { color: ${p => p.$isDemo ? '#000' : '#94a3b8'}; }
`;

const NavBtn = styled.button`
  background: #0F172A; border: 1px solid #1E293B; color: #fff;
  width: 42px; height: 42px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
`;

const PrimaryBtn = styled.button`
  background: #00D1FF; color: #000; border: none; padding: 0 1.2rem;
  border-radius: 10px; font-weight: 800; font-size: 0.85rem; height: 42px;
  display: flex; align-items: center; gap: 8px; cursor: pointer;
`;

const MetricsStrip = styled.div`
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
  margin-bottom: 2rem;
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
`;

const MCard = styled.div`
  background: #0F172A; border: 1px solid #1E293B; border-left: 4px solid ${p => p.color};
  padding: 1.2rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem;

  svg { color: ${p => p.color}; }
  label { display: block; font-size: 0.65rem; color: #64748B; text-transform: uppercase; font-weight: 800; }
  h3 { margin: 0; font-size: 1.1rem; color: #fff; }

  @media (max-width: 600px) {
    padding: 0.8rem;
    h3 { font-size: 0.9rem; }
  }
`;

const FilterSection = styled.div`
  display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;
  @media (min-width: 1024px) { flex-direction: row; justify-content: space-between; align-items: center; }
`;

const SearchContainer = styled.div`
  background: #0F172A; border: 1px solid #1E293B; border-radius: 12px;
  display: flex; align-items: center; padding: 0 1rem; height: 48px;
  flex: 1; max-width: 400px;
  input { background: none; border: none; color: #fff; margin-left: 10px; width: 100%; outline: none; }
`;

const PillContainer = styled.div`
  display: flex; align-items: center; gap: 8px; overflow-x: auto;
  padding-bottom: 4px; &::-webkit-scrollbar { display: none; }
`;

const FilterPill = styled.button`
  background: ${p => p.active ? '#00D1FF' : '#0F172A'};
  color: ${p => p.active ? '#000' : '#94A3B8'};
  border: 1px solid ${p => p.active ? '#00D1FF' : '#1E293B'};
  padding: 8px 16px; border-radius: 50px; font-size: 0.75rem; font-weight: 700;
  white-space: nowrap; cursor: pointer; transition: 0.2s;
`;

const RefreshBtn = styled.button`
  background: none; border: none; color: #475569; cursor: pointer;
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const DataPane = styled.div` min-height: 400px; `;

const TableWrapper = styled.div`
  display: none;
  @media (min-width: 1024px) { 
    display: block; background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden;
  }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th { text-align: left; padding: 1.2rem; font-size: 0.7rem; color: #64748B; text-transform: uppercase; border-bottom: 1px solid #1E293B; }
  td { padding: 1.2rem; border-bottom: 1px solid #1E293B; }
  tr:hover { background: rgba(255,255,255,0.02); }

  .hide-sm { @media (max-width: 1150px) { display: none; } }
  .hide-md { @media (max-width: 1300px) { display: none; } }
`;

const AssetCell = styled.div`
  .code { color: #00D1FF; font-size: 0.7rem; font-family: monospace; }
  .name { font-weight: 700; color: #fff; }
`;

const CatTag = styled.span`
  background: rgba(148, 163, 184, 0.1); color: #94A3B8;
  padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
`;

const StockCount = styled.div`
  font-weight: 900; font-size: 1.1rem; color: ${p => p.$isLow ? '#FF3B6B' : '#fff'};
  span { font-size: 0.7rem; color: #64748B; font-weight: 400; }
`;

const StatusBadge = styled.span`
  padding: 4px 12px; border-radius: 50px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase;
  background: ${p => p.$type === 'out' ? 'rgba(255, 59, 107, 0.1)' : 'rgba(0, 255, 163, 0.1)'};
  color: ${p => p.$type === 'out' ? '#FF3B6B' : '#00FFA3'};
`;

const ActionGroup = styled.div`
  display: flex; gap: 8px; justify-content: flex-end;
  button {
    width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer;
    background: #1E293B; color: #94A3B8; display: flex; align-items: center; justify-content: center;
    &:hover { color: #fff; background: #334155; }
    &.del:hover { color: #FF3B6B; }
  }
`;

const MobileGrid = styled.div`
  display: flex; flex-direction: column; gap: 1rem;
  @media (min-width: 1024px) { display: none; }
`;

const AssetCard = styled.div`
  background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; padding: 1.2rem;
  .head { display: flex; justify-content: space-between; margin-bottom: 1rem; 
    strong { display: block; font-size: 1rem; } 
    code { color: #00D1FF; font-size: 0.75rem; } }
  .body { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-top: 1px solid #1E293B; padding-top: 1rem;
    label { display: block; font-size: 0.6rem; color: #475569; text-transform: uppercase; }
    span { font-weight: 700; } }
  .foot { margin-top: 1rem; .full-btn { width: 100%; height: 40px; border-radius: 8px; background: #1E293B; border: none; color: #fff; font-weight: 700; } }
`;

const Pagination = styled.div`
  margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
  @media (min-width: 768px) { flex-direction: row; justify-content: space-between; }
  p { color: #64748B; font-size: 0.85rem; }
  .nav { display: flex; align-items: center; gap: 1rem; }
  .page-info { font-weight: 800; font-family: monospace; font-size: 1rem; color: #00D1FF; }
`;

const NavPage = styled.button`
  width: 44px; height: 44px; border-radius: 50%; border: 1px solid #1E293B;
  background: #0F172A; color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; &:disabled { opacity: 0.2; }
`;

const FloatingBtn = styled.button`
  position: fixed; bottom: 20px; right: 20px; width: 64px; height: 64px;
  background: #00D1FF; border-radius: 20px; border: none; 
  box-shadow: 0 8px 30px rgba(0, 209, 255, 0.4); display: flex; align-items: center; justify-content: center;
  z-index: 100; cursor: pointer;
  @media (min-width: 1024px) { display: none; }
`;

const LoadingState = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px;
  p { margin-top: 1rem; color: #64748B; font-weight: 600; letter-spacing: 1px; }
`;