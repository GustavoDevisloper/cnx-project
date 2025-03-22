import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { deleteQuestion } from "@/services/questionService";
import { Question } from "@/types/question";
import { Trash2, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QuestionCardProps {
  question: Question;
  onDelete: () => void;
}

export function QuestionCard({ question, onDelete }: QuestionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteQuestion(question.id);
      if (success) {
        toast({
          title: "Pergunta excluída",
          description: "Sua pergunta foi excluída com sucesso",
        });
        onDelete();
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir a pergunta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao excluir pergunta:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formattedDate = format(new Date(question.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">
            {question.question.length > 80 
              ? `${question.question.substring(0, 80)}...` 
              : question.question}
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
          <p>{question.question}</p>
          
          {question.answered && (
            <div className="mt-4 bg-muted p-3 rounded-md">
              <div className="font-medium mb-1">Resposta do líder:</div>
              <p>{question.answer}</p>
              <div className="text-xs text-muted-foreground mt-2">
                Respondido por {question.answeredByName}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {!question.answered && (
        <CardFooter className="flex justify-end">
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isDeleting}>
                <Trash2 size={16} className="mr-1 text-destructive" />
                <span>Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir pergunta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
} 