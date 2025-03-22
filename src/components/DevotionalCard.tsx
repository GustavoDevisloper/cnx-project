import { Heart, Share2, ChevronDown, ChevronUp, Copy, MessageSquare, Facebook, Twitter, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import ScriptureViewer from "@/components/ScriptureViewer";
import { BibleVersion, getScriptureText } from "@/services/bibleService";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toggleDevotionalLike } from "@/services/devotionalService";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

export interface DevotionalProps {
  id: string;
  title: string;
  scripture: string;
  content: string;
  author: string;
  date: string;
  dayOfWeek?: string;
  transmissionLink?: string;
  isAIGenerated?: boolean;
  references?: string[];
  imageSrc?: string;
  likes?: number;
  commentsCount?: number;
  onLike?: () => void;
  onComment?: (comment: string) => void;
  onShare?: () => void;
  hasLiked?: boolean;
  scriptureText?: string;
}

const DevotionalCard = ({ 
  id,
  title, 
  scripture, 
  content, 
  author, 
  date, 
  dayOfWeek,
  transmissionLink,
  references,
  imageSrc,
  likes = 0,
  commentsCount = 0,
  onLike,
  onComment,
  onShare,
  hasLiked = false,
  scriptureText: initialScriptureText
}: DevotionalProps) => {
  const [liked, setLiked] = useState(hasLiked);
  const [likesCount, setLikesCount] = useState(likes);
  const [showScripture, setShowScripture] = useState(false);
  const [scriptureText, setScriptureText] = useState<string>(initialScriptureText || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [preferredBibleVersion] = useState<BibleVersion>(
    localStorage.getItem("preferredBibleVersion") as BibleVersion || "NVI"
  );
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();

  // Safe date formatting with fallback if date is invalid
  const formattedDate = (() => {
    try {
      // Try to parse the date safely
      const dateObj = date ? new Date(date) : new Date();
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        // If date is not valid, return the original string or a fallback
        return date || 'Data não disponível';
      }
      
      // If date is valid, format it
      return format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: pt });
    } catch (error) {
      console.error("Error formatting date:", error);
      return date || 'Data não disponível';
    }
  })();

  // Buscar o texto do versículo ao carregar o componente
  useEffect(() => {
    if (initialScriptureText) {
      setScriptureText(initialScriptureText);
      return;
    }
    
    const fetchScriptureText = async () => {
      setIsLoading(true);
      try {
        const text = await getScriptureText(scripture, preferredBibleVersion);
        setScriptureText(text?.text || "");
      } catch (error) {
        console.error("Erro ao buscar texto do versículo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScriptureText();
  }, [scripture, preferredBibleVersion, initialScriptureText]);

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
    
    setIsLikeLoading(true);
    try {
      const result = await toggleDevotionalLike(id);
      if (result.success) {
        setLiked(result.isLiked);
        setLikesCount(prev => result.isLiked ? prev + 1 : prev - 1);
        if (onLike) onLike();
      }
    } catch (error) {
      console.error("Erro ao processar curtida:", error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleComment = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    
    if (!comment.trim()) return;
    
    if (onComment) onComment(comment);
    setComment("");
    setIsCommenting(false);
  };

  // Função auxiliar para formatar o texto de compartilhamento
  const getShareText = () => {
    const formattedText = `
📖 *${title}*

🕊️ *${scripture}*
"${scriptureText || scripture}"

💭 *Reflexão*:
${content}

🙏 Compartilhado via Conexão Jovem | ${formattedDate}
    `.trim();
    
    return formattedText;
  };

  // Compartilhar via área de transferência
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getShareText());
    toast({
      title: "Copiado para a área de transferência",
      description: "Agora você pode compartilhar este devocional"
    });
    setIsShareDialogOpen(false);
  };

  // Compartilhar via WhatsApp
  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    setIsShareDialogOpen(false);
  };

  // Compartilhar via Telegram
  const handleShareTelegram = () => {
    const encodedText = encodeURIComponent(getShareText());
    window.open(`https://t.me/share/url?url=Conexão Jovem&text=${encodedText}`, '_blank');
    setIsShareDialogOpen(false);
  };
  
  // Compartilhar via Facebook
  const handleShareFacebook = () => {
    const encodedUrl = encodeURIComponent("https://Conexão Jovem.vercel.app");
    const encodedQuote = encodeURIComponent(`${title} - ${scripture}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`, '_blank');
    setIsShareDialogOpen(false);
  };
  
  // Compartilhar via Twitter/X
  const handleShareTwitter = () => {
    const encodedText = encodeURIComponent(`${title} - ${scripture}\n\n"${scriptureText}"\n\nCompartilhado via @Conexão Jovem`);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
    setIsShareDialogOpen(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `${title} - ${scripture}\n\n${scriptureText}`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      setIsShareDialogOpen(true);
    }
    
    if (onShare) onShare();
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      {imageSrc && (
        <div className="relative w-full h-48">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
          {dayOfWeek && (
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded">
              {dayOfWeek}
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="p-6 bg-accent/20">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            {dayOfWeek && !imageSrc && (
              <span className="text-sm font-medium text-primary">
                {dayOfWeek}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-semibold mt-1">{title}</h3>
          
          <button
            onClick={() => setShowScripture(!showScripture)}
            className="inline-flex items-center text-primary italic mt-1 hover:underline focus:outline-none"
          >
            {scripture}
            <ChevronDown 
              size={16} 
              className={cn(
                "ml-1 transition-transform", 
                showScripture && "transform rotate-180"
              )} 
            />
          </button>
          
          {showScripture && (
            <div className="mt-2 p-3 bg-muted/50 rounded-md italic text-muted-foreground">
              {isLoading ? (
                <div className="animate-pulse h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
              ) : (
                <p>{scriptureText}</p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
          {content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4">{paragraph}</p>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <span>Por {author}</span>
            {isAIGenerated && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                IA
              </span>
            )}
          </div>
          
          {references && references.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <BookOpen size={14} className="mr-1" />
                  Referências
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {references.map((ref, index) => (
                  <DropdownMenuItem key={index}>
                    {ref}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 bg-muted/30 flex justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
            onClick={handleLike}
            disabled={isLikeLoading}
          >
            <Heart 
              size={16} 
              className={liked ? "fill-primary text-primary" : ""} 
            />
            <span>{likesCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => navigate(`/devotional/${id}#comments`)}
          >
            <MessageSquare size={16} />
            <span>{commentsCount}</span>
          </Button>
        </div>
        
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                if (navigator.share) {
                  handleShare();
                } else {
                  setIsShareDialogOpen(true);
                }
              }}
            >
              <Share2 size={16} />
              <span>Compartilhar</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Compartilhar Devocional</DialogTitle>
              <DialogDescription>
                Escolha como deseja compartilhar este devocional.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button 
                variant="outline"
                className="flex justify-center items-center gap-2"
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4" />
                Copiar Texto
              </Button>
              <Button 
                variant="outline"
                className="flex justify-center items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                onClick={handleShareWhatsApp}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </Button>
              <Button 
                variant="outline"
                className="flex justify-center items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                onClick={handleShareTelegram}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram
              </Button>
              <Button 
                variant="outline"
                className="flex justify-center items-center gap-2"
                onClick={handleShareFacebook}
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button 
                variant="outline"
                className="flex justify-center items-center gap-2"
                onClick={handleShareTwitter}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default DevotionalCard;
