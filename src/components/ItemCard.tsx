import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, Tag } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Item } from '@/types';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to={`/items/${item.id}`}>
      <Card className="hover-scale transition-all duration-300">
        {item.image_url && (
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={item.image_url}
              alt={item.title}
              className="h-48 w-full object-cover transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
          </div>
        )}
        <Card.Content className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <Badge
              variant={item.type === 'lost' ? 'error' : 'success'}
              className="uppercase animate-scale-in"
            >
              {item.type}
            </Badge>
            <Badge
              variant={
                item.status === 'open'
                  ? 'warning'
                  : item.status === 'resolved'
                  ? 'success'
                  : 'default'
              }
              className="capitalize animate-scale-in"
            >
              {item.status}
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold mb-2 line-clamp-1 hover:text-blue-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {item.description}
          </p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2 group">
              <MapPin className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
              <span className="group-hover:text-blue-600 transition-colors">{item.location}</span>
            </div>
            <div className="flex items-center gap-2 group">
              <Calendar className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
              <span className="group-hover:text-blue-600 transition-colors">
                {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 group">
              <Tag className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
              <span className="capitalize group-hover:text-blue-600 transition-colors">
                {item.category}
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
}