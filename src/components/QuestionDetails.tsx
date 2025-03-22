import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Question } from "@/types/question";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, CheckCircle2, MessageCircleQuestion } from "lucide-react";
import { answerQuestion } from "@/services/questionService";

interface QuestionDetailsProps {
  question: Question;
  onAnswer?: () => void;
}

export function QuestionDetails({ question, onAnswer }: QuestionDetailsProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      toast({
        title: "Resposta vazia",
        description: "Por favor, escreva uma resposta",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await answerQuestion(question.id, answer, isPublic);
      
      if (success) {
        toast({
          title: "Resposta enviada",
          description: "A resposta foi enviada com sucesso",
        });
        setAnswer("");
        onAnswer?.();
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Não foi possível enviar a resposta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = format(new Date(question.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">
            {question.question}
          </CardTitle>
          <Badge variant={question.answered ? "default" : "outline"} className="ml-2">
            {question.answered ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} />
                Respondida
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Aguardando
              </span>
            )}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          Enviada em {formattedDate}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-sm">
          {question.answered ? (
            <div className="bg-muted p-3 rounded-md">
              <div className="font-medium mb-1">Resposta do líder:</div>
              <p>{question.answer}</p>
              <div className="text-xs text-muted-foreground mt-2">
                Respondido por {question.answeredByName}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="answer" className="text-sm font-medium">
                  Sua resposta
                </label>
                <Textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isPublic" className="text-sm text-muted-foreground">
                  Tornar resposta pública
                </label>
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Resposta"}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 