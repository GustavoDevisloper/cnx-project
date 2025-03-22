import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, User } from 'lucide-react';
import { EventItemSummary } from '@/types/event';
import { Badge } from '@/components/ui/badge';

interface EventItemsListProps {
  items: EventItemSummary[];
}

/**
 * Componente que exibe a lista completa de itens que serão levados para o evento
 * Os itens são agrupados por usuário para facilitar a visualização
 */
export function EventItemsList({ items }: EventItemsListProps) {
  // Agrupar itens por usuário
  const itemsByUser = items.reduce((acc, item) => {
    if (!acc[item.user_id]) {
      acc[item.user_id] = {
        user_name: item.user_name,
        items: []
      };
    }
    
    acc[item.user_id].items.push(item);
    return acc;
  }, {} as Record<string, { user_name: string, items: EventItemSummary[] }>);
  
  // Se não houver itens, mostrar mensagem
  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground">Ninguém confirmou que irá levar itens ainda.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {Object.entries(itemsByUser).map(([userId, { user_name, items }]) => (
        <Card key={userId}>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <h3 className="font-medium text-lg">{user_name}</h3>
            </div>
            
            <div className="grid gap-2">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {item.quantity} {item.quantity > 1 ? 'unidades' : 'unidade'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="bg-muted/30 p-4 rounded-md">
        <div className="flex items-center mb-2">
          <ShoppingBag className="h-5 w-5 mr-2 text-muted-foreground" />
          <h3 className="font-medium">Total de itens: {items.length}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Confirmados por {Object.keys(itemsByUser).length} participantes
        </p>
      </div>
    </div>
  );
} 