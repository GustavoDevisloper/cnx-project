import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAllQuestions, answerQuestion, deleteQuestion } from "@/services/questionService";
import { Question } from "@/types/question";
import { toast } from "@/hooks/use-toast";
import { MessageCircleQuestion, CheckCircle2, Clock, Trash2 } from "lucide-react";
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

export function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Carregar todas as dúvidas
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    const allQuestions = getAllQuestions();
    setQuestions(allQuestions);
  };

  // Filtrar dúvidas pendentes e respondidas
  const pendingQuestions = questions.filter(q => !q.answered);
  const answeredQuestions = questions.filter(q => q.answered);

  const handleAnswerQuestion = async () => {
    if (!selectedQuestion || answer.trim().length < 5) {
      toast({
        title: "Resposta muito curta",
        description: "Por favor, forneça uma resposta mais detalhada",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = answerQuestion(selectedQuestion.id, answer, isPublic);
      
      if (success) {
        toast({
          title: "Resposta enviada",
          description: "A dúvida foi respondida com sucesso",
        });
        
        loadQuestions();
        setSelectedQuestion(null);
        setAnswer("");
        setIsPublic(false);
      } else {
        toast({
          title: "Erro ao responder",
          description: "Não foi possível enviar a resposta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao responder dúvida:", error);
      toast({
        title: "Erro ao responder",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    
    try {
      const success = deleteQuestion(questionToDelete);
      
      if (success) {
        toast({
          title: "Pergunta excluída",
          description: "A pergunta foi excluída com sucesso",
        });
        
        if (selectedQuestion?.id === questionToDelete) {
          setSelectedQuestion(null);
          setAnswer("");
          setIsPublic(false);
        }
        
        loadQuestions();
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
      setQuestionToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gestão de Dúvidas</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Lista de perguntas */}
        <Card className="md:max-h-[800px] overflow-hidden flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle>Dúvidas dos Usuários</CardTitle>
            <CardDescription>
              {pendingQuestions.length} pendentes, {answeredQuestions.length} respondidas
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending" className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Pendentes ({pendingQuestions.length})</span>
                </TabsTrigger>
                <TabsTrigger value="answered" className="flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  <span>Respondidas ({answeredQuestions.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="flex-1 overflow-auto">
              <TabsContent value="pending" className="space-y-2 mt-4">
                {pendingQuestions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageCircleQuestion size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Não há dúvidas pendentes</p>
                  </div>
                ) : (
                  pendingQuestions.map((q) => (
                    <div 
                      key={q.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedQuestion?.id === q.id 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        setSelectedQuestion(q);
                        setAnswer("");
                        setIsPublic(false);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{q.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(q.createdAt), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                      <p className="mt-1 text-sm line-clamp-2">{q.question}</p>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="answered" className="space-y-2 mt-4">
                {answeredQuestions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Nenhuma dúvida foi respondida ainda</p>
                  </div>
                ) : (
                  answeredQuestions.map((q) => (
                    <div 
                      key={q.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedQuestion?.id === q.id 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        setSelectedQuestion(q);
                        setAnswer(q.answer || "");
                        setIsPublic(q.isPublic);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{q.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(q.createdAt), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                      <p className="mt-1 text-sm line-clamp-2">{q.question}</p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {q.isPublic ? "Resposta pública" : "Resposta privada"}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
        
        {/* Área de resposta */}
        <Card className={selectedQuestion ? "opacity-100" : "opacity-50 pointer-events-none"}>
          <CardHeader>
            <CardTitle>Responder Dúvida</CardTitle>
            <CardDescription>
              {selectedQuestion 
                ? `Respondendo à dúvida de ${selectedQuestion.username}` 
                : "Selecione uma dúvida para responder"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedQuestion && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Pergunta</h3>
                  <p className="bg-muted p-3 rounded-md">{selectedQuestion.question}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Enviada por:</span> {selectedQuestion.username} em {formatDate(selectedQuestion.createdAt)}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Sua resposta</h3>
                  <Textarea 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Digite sua resposta aqui..."
                    rows={6}
                    disabled={selectedQuestion.answered}
                    className="resize-y"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="public-answer" 
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      disabled={selectedQuestion.answered}
                    />
                    <Label htmlFor="public-answer">Tornar esta resposta pública</Label>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => setQuestionToDelete(selectedQuestion.id)}
                        >
                          <Trash2 size={16} className="mr-1" />
                          Excluir
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
                            onClick={handleDeleteQuestion}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    {!selectedQuestion.answered && (
                      <Button 
                        onClick={handleAnswerQuestion} 
                        disabled={isSubmitting || answer.length < 5}
                      >
                        {isSubmitting ? "Enviando..." : "Enviar Resposta"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 