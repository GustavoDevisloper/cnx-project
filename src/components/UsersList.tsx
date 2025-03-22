import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { getAllUsers, updateUserRole, getCurrentUser, isAdmin, isLeader } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BadgeCheck, Edit, Trash, UserPlus, ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface UsersListProps {
  filterRole?: string;
  currentUserIsRoot?: boolean;
}

export default function UsersList({ filterRole, currentUserIsRoot = false }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [currentUserIsLeader, setCurrentUserIsLeader] = useState(false);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    isAdmin: false
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        let filteredUsers = allUsers;
        
        if (filterRole) {
          filteredUsers = allUsers.filter(user => user.role === filterRole);
        }
        
        setUsers(filteredUsers);
        
        // Check current user permissions
        const adminCheck = await isAdmin();
        const leaderCheck = await isLeader();
        setCurrentUserIsAdmin(adminCheck);
        setCurrentUserIsLeader(leaderCheck);
        
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        toast({
          title: "Erro ao carregar usuários",
          description: "Não foi possível obter a lista de usuários",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filterRole]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, role: newRole };
        }
        return user;
      }));
      
      toast({
        title: "Função atualizada",
        description: "A função do usuário foi atualizada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar função:", error);
      toast({
        title: "Erro ao atualizar função",
        description: error.message || "Não foi possível atualizar a função do usuário",
        variant: "destructive"
      });
    }
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome de usuário, email e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, we would call an API to create the user
    // For now, just close the dialog and show a success message
    toast({
      title: "Não implementado",
      description: "A criação de usuários via interface não está implementada. Use o painel de administração do Supabase.",
      variant: "destructive"
    });
    
    setIsNewUserDialogOpen(false);
    setNewUser({
      username: "",
      email: "",
      password: "",
      isAdmin: false
    });
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  // Simple card view (used when only a list is needed)
  if (filterRole) {
    return (
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{user.display_name || user.first_name || user.email}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">Função: {user.role}</p>
              </div>
              
              {(currentUserIsAdmin || (currentUserIsLeader && user.role !== 'admin')) && (
                <div className="space-x-2">
                  {user.role !== 'leader' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleRoleChange(user.id, 'leader')}
                    >
                      Tornar Líder
                    </Button>
                  )}
                  
                  {currentUserIsAdmin && user.role !== 'admin' && (
                    <Button 
                      variant="outline"
                      onClick={() => handleRoleChange(user.id, 'admin')}
                    >
                      Tornar Admin
                    </Button>
                  )}
                  
                  {user.role !== 'user' && (
                    <Button 
                      variant="outline"
                      onClick={() => handleRoleChange(user.id, 'user')}
                    >
                      Remover Privilégios
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Advanced table view (used for admin panel)
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Usuários do Sistema</h2>
        
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input 
                  id="username" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              
              {currentUserIsAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isAdmin" 
                    checked={newUser.isAdmin}
                    onCheckedChange={(checked) => 
                      setNewUser({...newUser, isAdmin: checked as boolean})
                    }
                  />
                  <Label htmlFor="isAdmin">Administrador</Label>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.display_name || user.first_name || user.username || user.email.split('@')[0]}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Button
                    variant={user.role === 'admin' ? "default" : user.role === 'leader' ? "secondary" : "outline"}
                    size="sm"
                    className="h-8"
                    disabled={!currentUserIsAdmin}
                  >
                    {user.role === 'admin' ? (
                      <>
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        Administrador
                      </>
                    ) : user.role === 'leader' ? (
                      "Líder"
                    ) : (
                      "Usuário"
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {currentUserIsAdmin && user.role !== 'admin' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRoleChange(user.id, 'admin')}
                    >
                      Tornar Admin
                    </Button>
                  )}
                  
                  {currentUserIsAdmin && user.role !== 'leader' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRoleChange(user.id, 'leader')}
                    >
                      Tornar Líder
                    </Button>
                  )}
                  
                  {currentUserIsAdmin && user.role !== 'user' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRoleChange(user.id, 'user')}
                    >
                      Remover Função
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
