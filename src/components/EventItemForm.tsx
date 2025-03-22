import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventItem } from '@/types/event';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';

interface EventItemFormProps {
  onAddItem: (item: { name: string; quantity: number }) => Promise<void>;
  existingItems: EventItem[];
}

export function EventItemForm({ onAddItem, existingItems }: EventItemFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || quantity < 1) return;
    
    try {
      setSubmitting(true);
      await onAddItem({ name: name.trim(), quantity });
      // Limpar formulário após sucesso
      setName('');
      setQuantity(1);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">O que você vai levar?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Label htmlFor="item-name">Item</Label>
                <Input
                  id="item-name"
                  placeholder="Ex: Refrigerante, Bolo, Copos..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              
              <div>
                <Label htmlFor="item-quantity">Quantidade</Label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || submitting}
                    className="h-10 w-10 rounded-r-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="item-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    required
                    disabled={submitting}
                    className="rounded-none text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={increaseQuantity}
                    disabled={submitting}
                    className="h-10 w-10 rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={!name.trim() || quantity < 1 || submitting}
                  className="w-full"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {existingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Itens que você vai levar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {existingItems.map((item, index) => (
                <li key={index} className="py-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 