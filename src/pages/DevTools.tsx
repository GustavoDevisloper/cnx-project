import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { devConfirmUserEmail, devCreateTestAccount, updateUserRoleByEmail } from '@/services/authService';
import { supabase } from '@/services/supabaseClient';

export default function DevTools() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [roleEmail, setRoleEmail] = useState('');
  const [newRole, setNewRole] = useState('admin');

  const handleConfirmEmail = async () => {
    if (!confirmEmail) {
      toast({
        title: "Email obrigatório",
        description: "Digite o email para confirmar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await devConfirmUserEmail(confirmEmail);
      
      if (result.success) {
        toast({
          title: "Email confirmado",
          description: "O email foi confirmado com sucesso"
        });
        setConfirmEmail('');
      } else {
        toast({
          title: "Erro ao confirmar email",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar email",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestAccount = async () => {
    if (!email || !password || !username) {
      toast({
        title: "Todos os campos são obrigatórios",
        description: "Preencha todos os campos para criar a conta",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await devCreateTestAccount(email, password, username);
      
      if (result.success) {
        toast({
          title: "Conta criada",
          description: result.message
        });
        setEmail('');
        setPassword('');
        setUsername('');
      } else {
        toast({
          title: "Erro ao criar conta",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!roleEmail || !newRole) {
      toast({
        title: "Campos obrigatórios",
        description: "Digite o email e selecione o papel",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserRoleByEmail(roleEmail, newRole);
      
      toast({
        title: "Papel atualizado",
        description: `O usuário ${roleEmail} agora é ${newRole}`
      });
      setRoleEmail('');
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar papel",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDevUser = async () => {
    // Função para criar rapidamente uma conta de desenvolvedor com permissões de admin
    setLoading(true);
    try {
      // Primeiro criar a conta
      const email = 'admin@example.com';
      const password = 'admin123';
      const username = 'Admin';
      
      const result = await devCreateTestAccount(email, password, username);
      
      if (result.success) {
        // Depois atualizar para admin
        await updateUserRoleByEmail(email, 'admin');
        
        toast({
          title: "Conta de admin criada",
          description: `Email: ${email}, Senha: ${password}`
        });
      } else {
        // Se já existe, apenas atualizar para admin
        await updateUserRoleByEmail(email, 'admin');
        toast({
          title: "Conta de admin atualizada",
          description: `Email: ${email}, Senha: ${password}`
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta de admin",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Ferramentas de Desenvolvimento</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Criar Conta de Teste</CardTitle>
            <CardDescription>
              Cria uma nova conta sem precisar de confirmação de email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Nome</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome do usuário"
                  disabled={loading}
                />
              </div>
              
              <Button 
                onClick={handleCreateTestAccount} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Criando..." : "Criar Conta de Teste"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Confirmar Email</CardTitle>
            <CardDescription>
              Confirma o email de um usuário sem enviar email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Email</Label>
                <Input
                  id="confirmEmail"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={loading}
                />
              </div>
              
              <Button 
                onClick={handleConfirmEmail} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Confirmando..." : "Confirmar Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Atualizar Papel do Usuário</CardTitle>
            <CardDescription>
              Altera o papel de um usuário (admin, leader, user)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleEmail">Email</Label>
                <Input
                  id="roleEmail"
                  value={roleEmail}
                  onChange={(e) => setRoleEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newRole">Novo Papel</Label>
                <select
                  id="newRole"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  disabled={loading}
                >
                  <option value="admin">Admin</option>
                  <option value="leader">Líder</option>
                  <option value="user">Usuário</option>
                </select>
              </div>
              
              <Button 
                onClick={handleUpdateRole} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Atualizando..." : "Atualizar Papel"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Criar Usuário Admin</CardTitle>
            <CardDescription>
              Cria rapidamente uma conta de admin para desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Isso criará um usuário admin com as seguintes credenciais:
              </p>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p><strong>Email:</strong> admin@example.com</p>
                <p><strong>Senha:</strong> admin123</p>
              </div>
              
              <Button 
                onClick={createDevUser} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Criando..." : "Criar Usuário Admin"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 