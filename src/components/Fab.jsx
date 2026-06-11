import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Fab() {
  const navigate = useNavigate();

  return (
    <button 
      className="fab" 
      onClick={() => navigate('/add-expense')}
      title="Add Transaction"
      style={{ border: 'none' }}
    >
      <Plus size={28} />
    </button>
  );
}
