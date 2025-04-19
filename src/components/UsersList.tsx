import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { getAllUsers, updateUserRole, getCurrentUser, isAdmin, isLeader } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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
import { BadgeCheck, Edit, Trash, UserPlus, ShieldAlert, Loader2, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

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
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    isAdmin: false
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate();

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

  const handleCreateUser = async () => {
    // Validar campos
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome de usuário, email e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um endereço de email válido",
        variant: "destructive"
      });
      return;
    }

    // Validar comprimento da senha
    if (newUser.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreatingUser(true);
      
      // Verificar permissões
      if (newUser.isAdmin && !currentUserIsAdmin) {
        toast({
          title: "Permissão negada",
          description: "Apenas administradores podem criar outros administradores",
          variant: "destructive"
        });
        setCreatingUser(false);
        return;
      }
      
      // Gerar UUID para o usuário (pode ser substituído pelo ID gerado pelo Supabase)
      const tempUserId = crypto.randomUUID();
      let userId = tempUserId;
      let authUserCreated = false;
      
      // 1. Tentar criar usuário no Auth do Supabase
      try {
        const { data, error } = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
          options: {
            data: {
              username: newUser.username,
              first_name: newUser.username
            }
          }
        });
        
        if (error) {
          console.error("Erro ao criar usuário no Auth:", error);
          
          // Tratamento específico para email já existente
          if (error.message.includes("already registered")) {
            toast({
              title: "Email já cadastrado",
              description: "Este endereço de email já está em uso. Por favor, escolha outro.",
              variant: "destructive"
            });
            return;
          }
          
          // Se for erro de autorização, tentamos método alternativo
          if (error.message.includes("not authorized") || error.message.includes("permission")) {
            console.log("Erro de autorização, tentando método alternativo...");
          } else {
            throw error; // Propagar outros erros
          }
        } else if (data.user) {
          // Se sucesso, usar o ID gerado
          userId = data.user.id;
          authUserCreated = true;
          console.log("Usuário criado no Auth com sucesso, ID:", userId);
        }
      } catch (authError) {
        console.warn("Erro no Auth, tentando método alternativo...", authError);
      }
      
      // 2. Se falhou no Auth ou houve erro de permissão, tentar método RPC
      if (!authUserCreated) {
        try {
          console.log("Tentando criar usuário via função RPC...");
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'create_full_user',
            {
              p_email: newUser.email,
              p_password: newUser.password,
              p_first_name: newUser.username,
              p_phone_number: ""
            }
          );
          
          if (rpcError) {
            console.error("Erro ao criar usuário via RPC:", rpcError);
          } else if (rpcData && rpcData.user_id) {
            userId = rpcData.user_id;
            authUserCreated = true;
            console.log("Usuário criado via RPC com sucesso, ID:", userId);
          }
        } catch (rpcError) {
          console.warn("Erro na função RPC, tentando métodos alternativos...", rpcError);
        }
      }
      
      // 3. Criar perfil do usuário na tabela users (se o Auth foi bem-sucedido)
      if (authUserCreated) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: newUser.email,
            username: newUser.username,
            first_name: newUser.username,
            role: newUser.isAdmin ? 'admin' : 'user',
            created_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          
          // Tratamento específico para violação de chave única
          if (profileError.message?.includes("duplicate key") || profileError.code === '23505') {
            toast({
              title: "Erro de duplicação",
              description: "Já existe um usuário com este email no sistema",
              variant: "destructive"
            });
          } else if (profileError.message?.includes("permission") || profileError.message?.includes("not authorized")) {
            toast({
              title: "Permissão insuficiente",
              description: "Você não tem permissão para criar usuários. Entre em contato com o administrador do sistema.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Aviso",
              description: "Usuário criado no sistema de autenticação, mas houve um problema ao configurar o perfil completo.",
              variant: "default"
            });
          }
        } else {
          // Sucesso - usuário e perfil criados
          toast({
            title: "Usuário criado",
            description: `O usuário ${newUser.username} foi criado com sucesso ${newUser.isAdmin ? 'como administrador' : 'como usuário comum'}`,
          });
          
          // Atualizar a lista de usuários
          const updatedUsers = await getAllUsers();
          setUsers(updatedUsers);
          
          // Resetar o formulário e fechar o diálogo
          setIsNewUserDialogOpen(false);
          setNewUser({
            username: "",
            email: "",
            password: "",
            isAdmin: false
          });
        }
      } else {
        // Falha completa na criação do usuário
        toast({
          title: "Erro ao criar usuário",
          description: "Não foi possível criar o usuário. Verifique as permissões ou tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário",
        variant: "destructive"
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleViewUserProfile = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleWhatsAppRedirect = (phoneNumber: string | undefined) => {
    if (!phoneNumber) {
      toast({
        title: "Número não disponível",
        description: "Este usuário não cadastrou um número de telefone",
        variant: "destructive"
      });
      return;
    }
    
    // Formatar o número (remover caracteres especiais e espaços)
    const formattedNumber = phoneNumber.replace(/\D/g, "");
    
    // Verificar se o número está vazio após a formatação
    if (!formattedNumber) {
      toast({
        title: "Número inválido",
        description: "O formato do número de telefone não é válido",
        variant: "destructive"
      });
      return;
    }
    
    // Abrir URL do WhatsApp
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
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
              
              <div className="space-x-2">
                {user.phone_number && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWhatsAppRedirect(user.phone_number)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                
                {(currentUserIsAdmin || (currentUserIsLeader && user.role !== 'admin')) && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Advanced table view (used for admin panel)
  return (
    <div className="space-y-8">
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
              <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)} disabled={creatingUser}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={creatingUser}>
                {creatingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Carregando usuários...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <p>Nenhum usuário encontrado.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow 
                    key={user.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewUserProfile(user.id)}
                  >
                    <TableCell className="font-medium">{user.username || user.email}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number || "-"}</TableCell>
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
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {user.phone_number && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleWhatsAppRedirect(user.phone_number); }}
                            title="Enviar mensagem por WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {currentUserIsAdmin && user.role !== 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleRoleChange(user.id, 'admin'); }}
                          >
                            Tornar Admin
                          </Button>
                        )}
                        
                        {currentUserIsAdmin && user.role !== 'user' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleRoleChange(user.id, 'user'); }}
                          >
                            Remover Função
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
