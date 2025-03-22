import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question } from "@/types/question";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PublicQuestionCardProps {
  question: Question;
}

export function PublicQuestionCard({ question }: PublicQuestionCardProps) {
  const formattedDate = format(new Date(question.createdAt), "dd 'de' MMMM", { locale: ptBR });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <div className="bg-muted p-3 rounded-md">
            <p>{question.answer}</p>
            <div className="text-xs text-muted-foreground mt-2 flex justify-between">
              <span>Respondido por {question.answeredByName}</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 