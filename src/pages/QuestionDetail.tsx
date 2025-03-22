import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionById, answerQuestion } from '@/services/questionService';
import { Question, QuestionDB, convertDBQuestionToUI } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { isAdmin, isLeader } from "@/services/authService";
import { QuestionDatabaseFix } from "@/components/QuestionDatabaseFix";

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [databaseError, setDatabaseError] = useState<{code?: string, message?: string} | null>(null);
  const [canAnswerQuestions, setCanAnswerQuestions] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const adminCheck = await isAdmin();
      const leaderCheck = await isLeader();
      setCanAnswerQuestions(adminCheck || leaderCheck);
    };
    
    checkPermissions();
  }, []);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getQuestionById(id);
        
        if (data) {
          // Convert from QuestionDB to Question
          const uiQuestion = convertDBQuestionToUI(data);
          setQuestion(uiQuestion);
          
          // Se já tiver resposta, preencher o campo
          if (data.answer) {
            setAnswer(data.answer);
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar dúvida:', error);
        toast({
          title: 'Erro ao carregar dúvida',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  const handleSubmitAnswer = async () => {
    if (!id || !answer.trim()) return;
    
    try {
      setSubmitting(true);
      setDatabaseError(null);
      const updatedQuestion = await answerQuestion(id, answer);
      
      if (updatedQuestion) {
        // Convert from QuestionDB to Question
        const uiQuestion = convertDBQuestionToUI(updatedQuestion);
        setQuestion(uiQuestion);
        
        toast({
          title: 'Resposta enviada',
          description: 'A dúvida foi respondida com sucesso',
        });
      }
    } catch (error: any) {
      console.error('Erro ao responder dúvida:', error);
      
      // Mensagem específica para erro de chave estrangeira
      if (error.code === '23503' || 
          error.message?.includes('foreign key constraint') ||
          error.message?.includes('violates foreign key') ||
          error.message?.includes('is not present in table')) {
        
        setDatabaseError({
          code: error.code,
          message: error.message
        });
        
        toast({
          title: 'Erro de relação no banco de dados',
          description: 'Há um problema com o seu usuário no banco de dados. Um administrador precisa executar o script de correção.',
          variant: 'destructive'
        });
      } else {
        // Mensagem para outros erros
        toast({
          title: 'Erro ao responder',
          description: error.message || 'Ocorreu um erro inesperado',
          variant: 'destructive'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Dúvida não encontrada.</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => navigate('/questions')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para dúvidas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/questions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para dúvidas
        </Button>
      </div>

      {databaseError && canAnswerQuestions && (
        <QuestionDatabaseFix 
          errorCode={databaseError.code} 
          errorMessage={databaseError.message} 
        />
      )}
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Dúvida
            </CardTitle>
            <CardDescription>
              Enviada por {question.username} em {' '}
              {format(new Date(question.createdAt), "dd 'de' MMMM 'de' yyyy', às' HH:mm", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Dúvida</h3>
                <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                  {question.question}
                </div>
              </div>
              
              {question.answered ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Resposta</h3>
                  <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                    {question.answer}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Respondida por {question.answeredByName}
                  </p>
                </div>
              ) : canAnswerQuestions ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sua resposta</h3>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Digite sua resposta aqui..."
                    rows={6}
                  />
                  <Button 
                    className="mt-4 w-full"
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !answer.trim()}
                  >
                    {submitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar resposta
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-md">
                  <p>Esta pergunta ainda não foi respondida. Apenas administradores e líderes podem enviar respostas.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 