import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPendingQuestions, Question } from '@/services/questionService';
import { toast } from '@/hooks/use-toast';

export default function QuestionsList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await getPendingQuestions();
        setQuestions(data);
      } catch (error: any) {
        console.error('Erro ao carregar dúvidas:', error);
        toast({
          title: 'Erro ao carregar dúvidas',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleViewQuestion = (questionId: string) => {
    navigate(`/questions/${questionId}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">Nenhuma dúvida pendente</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as dúvidas foram respondidas!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-md border">
      {questions.map((question) => (
        <div
          key={question.id}
          className="flex items-start justify-between p-4"
        >
          <div className="space-y-1">
            <h4 className="font-medium leading-none">{question.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {question.content}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Por: {question.author?.display_name || question.author?.username || 'Usuário'}</span>
              <span>{format(new Date(question.created_at), "dd 'de' MMMM', às' HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewQuestion(question.id)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
} 