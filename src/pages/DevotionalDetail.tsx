import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getDevotionalById, 
  getDevotionalComments, 
  addDevotionalComment, 
  toggleDevotionalLike,
  Devotional,
  DevotionalComment
} from "@/services/devotionalService";
import { isAuthenticated } from "@/utils/auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, Share2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const DevotionalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [comments, setComments] = useState<DevotionalComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const isLoggedIn = isAuthenticated();

  useEffect(() => {
    if (id) {
      loadDevotionalAndComments(id);
    }
  }, [id]);

  const loadDevotionalAndComments = async (devotionalId: string) => {
    setIsLoading(true);
    try {
      // Carregar devocional
      const devotionalData = await getDevotionalById(devotionalId);
      if (devotionalData) {
        setDevotional(devotionalData);
        setLikeCount(devotionalData.likes || 0);
        setHasLiked(devotionalData.hasLiked || false);
        document.title = `Conexão Jovem | ${devotionalData.title}`;
        
        // Carregar comentários
        await loadComments(devotionalId);
      } else {
        toast({
          title: "Devocional não encontrado",
          description: "Não foi possível encontrar este devocional",
          variant: "destructive"
        });
        navigate("/devotional");
      }
    } catch (error) {
      console.error("Erro ao carregar devocional:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o devocional",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (devotionalId: string) => {
    setCommentsLoading(true);
    try {
      const commentsData = await getDevotionalComments(devotionalId);
      setComments(commentsData);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    } finally {
      setCommentsLoading(false);
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

    if (!id || !newComment.trim()) return;
    
    setIsCommentLoading(true);
    try {
      const comment = await addDevotionalComment(id, newComment);
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

    if (!id) return;
    
    setLikeAnimation(true);
    setIsLikeLoading(true);
    
    try {
      const result = await toggleDevotionalLike(id);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex-1 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!devotional) {
    return (
      <div className="min-h-screen flex-1 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">Devocional não encontrado</h2>
            <Button onClick={() => navigate("/devotional")}>
              Voltar para Devocionais
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Botão Voltar */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 -ml-4" 
              onClick={() => navigate("/devotional")}
            >
              <ArrowLeft size={16} />
              Voltar para Devocionais
            </Button>
          </div>
          
          {/* Card do devocional */}
          <Card className="overflow-hidden transition-all mb-8">
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
                  {devotional.isAIGenerated && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      IA
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-4 bg-muted/30 flex justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`flex items-center gap-2 relative overflow-hidden transition-all ${
                    likeAnimation ? (hasLiked ? 'animate-like-active' : 'animate-like-inactive') : ''
                  }`}
                  onClick={handleLike}
                  disabled={isLikeLoading}
                >
                  <Heart 
                    size={16} 
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
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>{comments.length}</span>
                </Button>
              </div>
              
              <div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <Share2 size={16} />
                  <span>Compartilhar</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Seção de comentários */}
          <Card className="overflow-hidden" id="comments">
            <CardHeader className="pb-3">
              <h2 className="text-xl font-semibold">Comentários ({comments.length})</h2>
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
              ) : (
                <div className="py-8 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
                  <p className="text-muted-foreground">Seja o primeiro a comentar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DevotionalDetail; 