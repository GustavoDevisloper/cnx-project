import { useEffect, useState } from "react";
import DevotionalCard, { DevotionalProps } from "@/components/DevotionalCard";
import { isAdmin, isAuthenticated } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, ArrowLeft, ArrowRight, Heart, Share2, BookOpen, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, subDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { 
  getTodayDevotional,
  getDevotionalComments,
  addDevotionalComment,
  toggleDevotionalLike,
  checkAndPublishDailyDevotional,
  Devotional as DevotionalType,
  DevotionalComment
} from "@/services/devotionalService";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Dias da semana em português
const daysOfWeek = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira", 
  "Sexta-feira",
  "Sábado"
];

// Função para obter o dia da semana atual
const getCurrentDayOfWeek = (): string => {
  const today = new Date();
  return daysOfWeek[today.getDay()];
};

const Devotional = () => {
  const [devotional, setDevotional] = useState<DevotionalType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [comments, setComments] = useState<DevotionalComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Conexão Jovem | Devocional Diário";
    
    const checkAuth = async () => {
      const authStatus = await isAuthenticated();
      setIsLoggedIn(authStatus);
      
      // Verificar se é admin
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
    };
    
    checkAuth();
    loadDevotional();
  }, []);

  const loadDevotional = async () => {
    setIsLoading(true);
    try {
      // Verificar se é necessário publicar um novo devocional
      await checkAndPublishDailyDevotional();
      
      // Buscar o devocional do dia
      const todayDevotional = await getTodayDevotional();
      setDevotional(todayDevotional);
      
      if (todayDevotional) {
        setLikeCount(todayDevotional.likes || 0);
        setHasLiked(todayDevotional.hasLiked || false);
        
        // Carregar comentários
        loadComments(todayDevotional.id);
      }
    } catch (error) {
      console.error("Erro ao carregar devocional:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o devocional de hoje",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (devotionalId: string) => {
    setCommentsLoading(true);
    try {
      const comments = await getDevotionalComments(devotionalId);
      setComments(comments);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    if (!devotional) return;
    
    setLikeAnimation(true);
    setIsLikeLoading(true);
    
    try {
      const result = await toggleDevotionalLike(devotional.id);
      if (result.success) {
        setHasLiked(result.isLiked);
        setLikeCount(prev => result.isLiked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error("Erro ao curtir devocional:", error);
    } finally {
      setIsLikeLoading(false);
      setTimeout(() => {
        setLikeAnimation(false);
      }, 1000);
    }
  };

  const handleAddComment = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    if (!devotional || !newComment.trim()) return;
    
    setIsCommentLoading(true);
    try {
      const comment = await addDevotionalComment(devotional.id, newComment);
      if (comment) {
        setComments(prev => [...prev, comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Erro ao comentar:", error);
    } finally {
      setIsCommentLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Devocional Diário</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isLoading 
                  ? "Carregando..." 
                  : devotional 
                    ? `Devocional para ${isToday(new Date(devotional.date)) ? "hoje" : format(new Date(devotional.date), "dd 'de' MMMM", { locale: ptBR })}`
                    : "Nenhum devocional disponível para hoje"}
              </p>
            </div>
            
            {isAdminUser && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => navigate('/devotional/new')}
              >
                <Plus size={16} />
                Adicionar
              </Button>
            )}
          </div>
          
          {/* Conteúdo principal */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : devotional ? (
            <div className="space-y-8">
              {/* Card do devocional */}
              <Card className="overflow-hidden transition-all">
                {devotional.imageSrc && (
                  <div className="relative w-full h-48">
                    <img 
                      src={devotional.imageSrc} 
                      alt={devotional.title} 
                      className="w-full h-full object-cover" 
                    />
                    {devotional.dayOfWeek && (
                      <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded">
                        {devotional.dayOfWeek}
                      </div>
                    )}
                  </div>
                )}
                
                <CardHeader className="p-6 bg-accent/20">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(devotional.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {devotional.dayOfWeek && !devotional.imageSrc && (
                        <span className="text-sm font-medium text-primary">
                          {devotional.dayOfWeek}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-semibold mt-1">{devotional.title}</h3>
                    
                    <div className="mt-2 p-3 bg-muted/50 rounded-md italic text-muted-foreground">
                      <p className="mb-1 font-medium">{devotional.scripture}</p>
                      <p>{devotional.scriptureText}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
                    {devotional.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <span>Por {devotional.author}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 bg-muted/30 flex justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      className={`flex items-center gap-2 relative overflow-hidden ${
                        likeAnimation ? (hasLiked ? 'animate-like-active' : 'animate-like-inactive') : ''
                      }`}
                      onClick={handleLike}
                      disabled={isLikeLoading}
                    >
                      <Heart 
                        size={20} 
                        className={cn(
                          "transition-all duration-300",
                          hasLiked && "fill-primary text-primary",
                          likeAnimation && hasLiked && "animate-like-heart"
                        )}
                      />
                      <span className={likeAnimation ? (hasLiked ? "animate-bounce-once" : "") : ""}>
                        {likeCount}
                      </span>
                      
                      {likeAnimation && hasLiked && (
                        <>
                          <span className="heart-particle absolute animate-particle-1" />
                          <span className="heart-particle absolute animate-particle-2" />
                          <span className="heart-particle absolute animate-particle-3" />
                          <span className="heart-particle absolute animate-particle-4" />
                        </>
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageSquare size={16} />
                      <span>{comments.length}</span>
                    </Button>
                  </div>
                  
                  <div>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Share2 size={16} />
                      <span>Compartilhar</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Seção de comentários */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Comentários</CardTitle>
                </CardHeader>
                
                <CardContent>
                  {isLoggedIn ? (
                    <div className="flex gap-4 mb-6">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea 
                          placeholder="Compartilhe seus pensamentos..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          className="resize-none mb-2"
                        />
                        <Button 
                          onClick={handleAddComment}
                          disabled={isCommentLoading || !newComment.trim()}
                          size="sm"
                        >
                          {isCommentLoading ? "Enviando..." : "Comentar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-md mb-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Faça login para deixar seu comentário
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate("/login")}
                      >
                        Fazer Login
                      </Button>
                    </div>
                  )}
                  
                  <Separator className="my-4" />
                  
                  {commentsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4">
                            <Avatar className="w-8 h-8">
                              {comment.authorAvatar ? (
                                <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                              ) : (
                                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted/50 p-3 rounded-md">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">{comment.author}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="py-8 text-center">
                      <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
                      <p className="text-muted-foreground">Seja o primeiro a comentar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Nenhum devocional para hoje</h3>
              <p className="text-muted-foreground mb-4">
                Não há devocionais disponíveis para {getCurrentDayOfWeek()}
              </p>
              {isAdminUser && (
                <Button onClick={() => navigate('/devotional/new')}>
                  Adicionar devocional para hoje
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Devotional;
