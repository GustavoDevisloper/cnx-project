import { useEffect, useState } from 'react';
import { updateUserRoleByEmail } from '@/services/authService';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function UpdateAdminRole() {
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const navigate = useNavigate();

  const updateRole = async () => {
    setLoading(true);
    try {
      await updateUserRoleByEmail('developer@gmail.com', 'admin');
      toast({
        title: "Papel atualizado com sucesso",
        description: "O usuário developer@gmail.com agora é admin"
      });
      setUpdated(true);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar papel",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-md mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Atualizar para Admin</h1>
          
          {updated ? (
            <>
              <p className="text-green-500 mb-4">
                ✅ O usuário developer@gmail.com foi atualizado para admin com sucesso!
              </p>
              <p className="mb-4">
                Agora você precisa fazer logout e login novamente para que as alterações tenham efeito.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/logout')}>
                  Fazer Logout
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Voltar para Home
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4">
                Esta página irá atualizar o usuário com email <strong>developer@gmail.com</strong> para o papel de <strong>admin</strong>.
              </p>
              <Button 
                onClick={updateRole} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Atualizando..." : "Atualizar para Admin"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 