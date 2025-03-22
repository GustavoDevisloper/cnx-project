import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateUserRole } from '@/services/authService';
import { supabase } from '@/lib/supabase';

export default function LeaderManagement() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Primeiro, buscar o usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        toast({
          title: "Usuário não encontrado",
          description: "Verifique se o email está correto e se o usuário já está registrado.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar o papel do usuário para líder
      const success = await updateUserRole(userData.id, 'leader');

      if (success) {
        toast({
          title: "Líder adicionado",
          description: "O usuário agora tem permissões de líder.",
        });
        setEmail('');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar líder",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Líder</CardTitle>
        <CardDescription>
          Adicione novos líderes usando o email deles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddLeader} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email do novo líder"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar Líder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 