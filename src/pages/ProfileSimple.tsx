import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  displayName?: string;
  email?: string;
}

const ProfileSimple = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>({
    id: '1',
    displayName: 'Usuário Teste',
    email: 'teste@example.com'
  });

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Usuário não encontrado.</p>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SimpleTemplate user={user} />;
};

interface SimpleTemplateProps {
  user: User;
}

const SimpleTemplate = ({ user }: SimpleTemplateProps) => {
  return (
    <div className="container py-10">
      <Card>
        <CardContent className="pt-6">
          <h1 className="text-xl font-bold">{user.displayName}</h1>
          <p>{user.email}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSimple; 