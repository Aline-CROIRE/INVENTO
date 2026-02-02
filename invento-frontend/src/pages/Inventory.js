import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Search, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import AddProductModal from '../components/Inventory/AddProductModal';

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
`;

const SearchBar = styled.div`
  display: flex; align-items: center; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 1rem; width: 300px;
  input { background: none; border: none; color: white; padding: 12px; width: 100%; outline: none; }
`;

const AddBtn = styled.button`
  background: var(--blue); color: white; display: flex; align-items: center; gap: 8px;
  padding: 12px 24px; border-radius: 12px; font-weight: 600;
  &:hover { background: #0069d9; transform: translateY(-2px); }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.02);
  border-radius: 16px; overflow: hidden;
  th, td { text-align: left; padding: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
  th { background: rgba(255,255,255,0.05); color: var(--textSecondary); font-size: 0.8rem; text-transform: uppercase; }
`;

const StockBadge = styled.span`
  padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;
  background: ${props => props.low ? 'rgba(255, 140, 66, 0.2)' : 'rgba(40, 167, 69, 0.2)'};
  color: ${props => props.low ? '#FF8C42' : '#28A745'};
`;

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setProducts(res.data.products);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchInventory(); }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <Header>
        <h1>Inventory</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <SearchBar>
            <Search size={18} color="rgba(255,255,255,0.5)" />
            <input placeholder="Search products..." onChange={e => setSearchTerm(e.target.value)} />
          </SearchBar>
          <AddBtn onClick={() => setIsModalOpen(true)}><Plus size={20}/> Add Stock</AddBtn>
        </div>
      </Header>

      <Table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p._id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td style={{ color: 'rgba(255,255,255,0.5)' }}>{p.sku}</td>
              <td>{p.category}</td>
              <td>{p.totalStock} {p.unit}</td>
              <td>
                <StockBadge low={p.totalStock <= p.minStockLevel}>
                  {p.totalStock <= p.minStockLevel ? 'Low Stock' : 'Healthy'}
                </StockBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {isModalOpen && <AddProductModal onClose={() => setIsModalOpen(false)} onRefresh={fetchInventory} />}
    </div>
  );
};

export default Inventory;