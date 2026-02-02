import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { UserPlus, CheckCircle, Clock, Mail, RefreshCw, Trash2, Edit3, Power, XCircle } from 'lucide-react';
import api from '../api/axios';
import CreateUserModal from '../components/Users/CreateUserModal';

const Container = styled.div` max-width: 1200px; margin: 0 auto; `;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; `;
const Table = styled.table`
  width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.02);
  border-radius: 12px; overflow: hidden;
  th, td { padding: 1.2rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
  th { background: rgba(255,255,255,0.05); color: #888; font-size: 0.8rem; text-transform: uppercase; }
`;

const IconButton = styled.button`
  background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px;
  color: ${props => props.color || 'white'}; opacity: 0.7;
  &:hover { opacity: 1; background: rgba(255,255,255,0.05); }
`;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await api.delete(`/users/${id}`);
      fetchUsers();
    }
  };

  const handleToggleStatus = async (id) => {
    await api.patch(`/users/${id}/status`);
    fetchUsers();
  };

  return (
    <Container>
      <Header>
        <h1>User Management</h1>
        <button onClick={() => setIsModalOpen(true)} style={{ background: '#28A745', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Invite Member
        </button>
      </Header>

      <Table>
        <thead>
          <tr>
            <th>User Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.email}</td>
              <td><span style={{ color: '#007BFF', fontWeight: 'bold' }}>{u.role}</span></td>
              <td>
                {u.status === 'ACTIVE' && <span style={{color:'#28A745'}}><CheckCircle size={14}/> Active</span>}
                {u.status === 'PENDING' && <span style={{color:'#FF8C42'}}><Clock size={14}/> Pending</span>}
                {u.status === 'DEACTIVATED' && <span style={{color:'#dc3545'}}><XCircle size={14}/> Deactivated</span>}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <IconButton color="#007BFF" title="Edit"><Edit3 size={18}/></IconButton>
                  <IconButton 
                    color={u.status === 'DEACTIVATED' ? '#28A745' : '#FF8C42'} 
                    onClick={() => handleToggleStatus(u._id)}
                    title={u.status === 'DEACTIVATED' ? 'Activate' : 'Deactivate'}
                  >
                    <Power size={18}/>
                  </IconButton>
                  <IconButton color="#dc3545" onClick={() => handleDelete(u._id)} title="Delete"><Trash2 size={18}/></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {isModalOpen && <CreateUserModal onClose={() => { setIsModalOpen(false); fetchUsers(); }} />}
    </Container>
  );
};

export default Users;