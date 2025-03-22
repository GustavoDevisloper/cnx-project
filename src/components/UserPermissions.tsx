import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { User, updateUserRole } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { ShieldAlert, Users, Settings } from 'lucide-react';

export default function UserPermissions() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: currentUserData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (currentUserData) {
            setCurrentUser({
              id: currentUserData.id,
              email: currentUserData.email,
              username: currentUserData.username,
              role: currentUserData.role
            });
          }
        }
        
        // Obter todos os usuários
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setUsers(data.map(user => ({
            id: user.id,
            email: user.email,
            username: user.username || user.email.split('@')[0],
            role: user.role
          })));
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de usuários',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'leader' | 'user') => {
    try {
      const success = await updateUserRole(userId, newRole);
      
      if (success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        
        toast({
          title: 'Permissão atualizada',
          description: 'A permissão do usuário foi atualizada com sucesso'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a permissão',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Permissão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {user.username}
                  {user.role === 'admin' && (
                    <ShieldAlert className="text-primary h-4 w-4" title="Administrador" />
                  )}
                  {user.role === 'leader' && (
                    <Users className="text-amber-500 h-4 w-4" title="Líder" />
                  )}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value: 'admin' | 'leader' | 'user') => 
                    handleRoleChange(user.id, value)
                  }
                  disabled={user.id === currentUser?.id || currentUser?.role !== 'admin'}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Selecionar permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="leader">Líder</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 