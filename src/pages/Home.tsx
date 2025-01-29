import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFilters } from '@/components/SearchFilters';
import { ItemCard } from '@/components/ItemCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Item } from '@/types';
import { toast } from 'react-hot-toast';
import { Search, PlusCircle } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    type: 'all',
    status: 'all',
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchItems();
  }, [filters]);

  async function fetchItems() {
    try {
      let query = supabase
        .from('items')
        .select('*');

      // Apply filters
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      query = query.order('created_at', {
        ascending: filters.sortBy === 'oldest',
      });

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SearchFilters
        onSearch={setSearch}
        onFilterChange={setFilters}
      />

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={search ? Search : PlusCircle}
          title={search ? 'No items found' : 'No items yet'}
          description={
            search
              ? 'Try adjusting your search or filters'
              : 'Start by reporting a lost or found item'
          }
          action={
            !search
              ? {
                  label: 'Report Item',
                  onClick: () => navigate('/report'),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}