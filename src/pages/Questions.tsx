import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionCard } from "@/components/QuestionCard";
import { PublicQuestionCard } from "@/components/PublicQuestionCard";
import { toast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser, isAdmin } from "@/services/authService";
import { addQuestion, getUserQuestions, getPublicQuestions } from "@/services/questionService";
import { Question } from "@/types/question";
import { MessageCircleQuestion, Lightbulb, Send } from "lucide-react";
import QuestionsDatabaseFix from "@/components/QuestionsDatabaseFix";

export default function Questions() {
  const [activeTab, setActiveTab] = useState("ask");
  const [question, setQuestion] = useState("");
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [publicQuestions, setPublicQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const navigate = useNavigate();

  // Function to check auth status and update state accordingly
  const checkAuthStatus = useCallback(async () => {
    try {
      console.log("Verificando status de autenticação...");
      const userLoggedIn = await isAuthenticated();
      console.log("Status de autenticação:", userLoggedIn);
      
      // Atualiza o estado apenas se houve mudança
      if (isUserLoggedIn !== userLoggedIn) {
        console.log("Atualizando estado de autenticação para:", userLoggedIn);
        setIsUserLoggedIn(userLoggedIn);
      }
      
      // Verifica se o usuário é admin
      if (userLoggedIn) {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
      }
      
      // Reload user questions if logged in
      if (userLoggedIn) {
        try {
          const userQuestions = await getUserQuestions();
          setMyQuestions(userQuestions);
        } catch (questionsError) {
          console.error("Erro ao carregar perguntas do usuário:", questionsError);
          toast({
            title: "Erro ao carregar perguntas",
            description: "Não foi possível carregar suas perguntas. Tente novamente mais tarde.",
            variant: "destructive"
          });
        }
      } else {
        setMyQuestions([]);
      }
    } catch (error) {
      console.error("Erro ao verificar status de autenticação:", error);
      setIsUserLoggedIn(false);
      setMyQuestions([]);
    }
  }, [isUserLoggedIn]);

  // Load questions initially
  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load public questions regardless of auth status
      const publicQs = await getPublicQuestions();
      setPublicQuestions(publicQs);
    } catch (error) {
      console.error("Error loading questions:", error);
      setPublicQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Conexão | Dúvidas";
    
    // Check auth status and load questions
    const initializeData = async () => {
      await checkAuthStatus();
      await loadQuestions();
    };
    
    initializeData();
    
    // Verificar o status de autenticação a cada 30 segundos
    const authCheckInterval = setInterval(() => {
      checkAuthStatus();
    }, 30000);
    
    // Set up event listener for storage changes (login/logout in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'current_user' || event.key === 'auth_token') {
        checkAuthStatus();
      }
    };
    
    // Set up event listener for auth state changes
    window.addEventListener('auth-state-changed', checkAuthStatus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(authCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-changed', checkAuthStatus);
    };
  }, [checkAuthStatus, loadQuestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (question.trim().length < 10) {
      toast({
        title: "Dúvida muito curta",
        description: "Por favor, descreva sua dúvida com mais detalhes (mínimo 10 caracteres)",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar autenticação novamente antes da submissão
    await checkAuthStatus();
    
    if (!isUserLoggedIn) {
      toast({
        title: "Login necessário",
        description: "Faça login para enviar sua dúvida",
        variant: "destructive"
      });
      navigate("/login?redirect=/questions");
      return;
    }
    
    setIsSubmitting(true);
    setDatabaseError(false);
    
    try {
      const result = await addQuestion(question);
      
      if (result) {
        toast({
          title: "Dúvida enviada com sucesso",
          description: "Um líder responderá sua pergunta em breve",
        });
        setQuestion("");
        setMyQuestions(prev => [result, ...prev]);
        setActiveTab("my-questions");
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Não foi possível enviar sua dúvida. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao enviar dúvida:", error);
      
      // Verificar se é um erro de banco de dados (estrutura da tabela ou política RLS)
      if (
        error?.code === 'PGRST204' || 
        (error?.message && error.message.includes("Could not find the 'title' column")) ||
        error?.code === '42501' || 
        (error?.message && error.message.includes("row-level security policy"))
      ) {
        setDatabaseError(true);
        toast({
          title: "Erro no banco de dados",
          description: "Detectamos um problema na estrutura do banco de dados. Instrução para correção são exibidas abaixo.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to login with return URL
  const handleLoginRedirect = () => {
    navigate("/login?redirect=/questions&tab=" + activeTab);
  };

  // Renderizar o componente QuestionsDatabaseFix somente se houver erro de banco e o usuário for admin
  const renderDatabaseError = () => {
    if (databaseError && isUserAdmin) {
      return (
        <div className="mt-8">
          <QuestionsDatabaseFix />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dúvidas e Perguntas</h1>
        <p className="text-muted-foreground mb-8">
          Envie suas dúvidas de forma confidencial ou consulte as respostas já disponíveis
        </p>
        
        {renderDatabaseError()}
        
        <Tabs defaultValue="ask" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="ask" className="flex items-center gap-2">
              <MessageCircleQuestion size={16} />
              <span>Perguntar</span>
            </TabsTrigger>
            <TabsTrigger value="my-questions" className="flex items-center gap-2">
              <Send size={16} />
              <span>Minhas Perguntas</span>
            </TabsTrigger>
            <TabsTrigger value="public-answers" className="flex items-center gap-2">
              <Lightbulb size={16} />
              <span>Respostas</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ask">
            <Card>
              <CardHeader>
                <CardTitle>Envie sua dúvida</CardTitle>
                <CardDescription>
                  Sua identidade será confidencial e somente líderes terão acesso ao seu nome
                </CardDescription>
              </CardHeader>
              {!isUserLoggedIn ? (
                <CardContent>
                  <div className="text-center py-6">
                    <p className="mb-4">Faça login para enviar sua dúvida</p>
                    <Button onClick={handleLoginRedirect}>
                      Fazer Login
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <form onSubmit={handleSubmit}>
                  <CardContent>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Digite sua dúvida aqui. Seja específico para receber a melhor resposta possível."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={5}
                        className="resize-y"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || question.length < 10}>
                      {isSubmitting ? "Enviando..." : "Enviar Pergunta"}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="my-questions">
            {!isUserLoggedIn ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <p className="mb-4">Faça login para ver suas perguntas</p>
                    <Button onClick={handleLoginRedirect}>
                      Fazer Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Carregando suas perguntas...</p>
                  </div>
                </CardContent>
              </Card>
            ) : myQuestions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageCircleQuestion size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Você ainda não fez nenhuma pergunta</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myQuestions.map((q) => (
                  <QuestionCard 
                    key={q.id} 
                    question={q} 
                    onDelete={async () => {
                      await checkAuthStatus(); // Refresh questions after deletion
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="public-answers">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Carregando respostas...</p>
                  </div>
                </CardContent>
              </Card>
            ) : publicQuestions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    <Lightbulb size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Ainda não há respostas públicas disponíveis</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {publicQuestions.map((q) => (
                  <PublicQuestionCard key={q.id} question={q} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 