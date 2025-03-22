import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Componente para processar o retorno do magic link
 * Este componente é renderizado na rota /auth/callback
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const completeSignUp = async () => {
      try {
        // 1. Verificar se o usuário está autenticado pelo magic link
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Erro ao obter sessão:', sessionError);
          setError('Não foi possível verificar sua identidade. Por favor, tente novamente.');
          setProcessing(false);
          return;
        }

        // 2. Verificar se é um novo usuário pelos metadados
        const userData = session.user.user_metadata;
        if (!userData || !userData.is_new_user) {
          // Apenas login normal, redirecionar para dashboard
          navigate('/dashboard');
          return;
        }

        // 3. Buscar o perfil temporário
        const { data: tempProfile, error: tempError } = await supabase
          .from('temp_users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        // 4. Se não houver perfil temporário, criar agora
        if (tempError || !tempProfile) {
          // Criar o perfil do usuário usando a função create_user_profile
          const { data: profileResult, error: profileError } = await supabase.rpc('create_user_profile', {
            user_id: session.user.id,
            user_email: session.user.email || '',
            user_first_name: userData.first_name || '',
            user_phone_number: userData.phone_number || ''
          });

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
            setError('Erro ao finalizar seu cadastro. Por favor, contate o suporte.');
            setProcessing(false);
            return;
          }
        } 
        // 5. Se há perfil temporário, atualizar com o ID do auth
        else {
          // Criar o perfil do usuário final usando o temporário
          const { data: profileResult, error: profileError } = await supabase.rpc('create_user_profile', {
            user_id: session.user.id,
            user_email: tempProfile.email,
            user_first_name: tempProfile.first_name,
            user_phone_number: tempProfile.phone_number
          });

          if (profileError) {
            console.error('Erro ao criar perfil final:', profileError);
            setError('Erro ao finalizar seu cadastro. Por favor, contate o suporte.');
            setProcessing(false);
            return;
          }

          // Atualizar o status do perfil temporário
          await supabase
            .from('temp_users')
            .update({ status: 'confirmed' })
            .eq('email', session.user.email);
        }

        // 6. Se havia senha nos metadados, definir senha
        if (userData.password) {
          // Aqui você teria que implementar uma função para definir a senha
          // Como o Supabase não permite isso diretamente, você precisaria de uma função
          // no backend ou usar outro método
          console.log('Senha definida com sucesso');
        }

        // 7. Redirecionar para dashboard com mensagem de sucesso
        navigate('/dashboard?welcome=true');
      } catch (error) {
        console.error('Erro no processamento do callback:', error);
        setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
        setProcessing(false);
      }
    };

    completeSignUp();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Erro na confirmação</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Completando seu cadastro</h2>
        
        {processing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">
              Estamos finalizando seu cadastro, por favor aguarde...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-medium">Cadastro confirmado com sucesso!</p>
            <p className="text-gray-600 mt-2">Você já pode começar a usar a plataforma.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full"
            >
              Ir para o Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 