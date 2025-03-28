import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventMessage } from '@/types/event';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface EventChatProps {
  messages: EventMessage[];
  onSendMessage: (content: string) => Promise<void>;
  currentUserId: string;
}

export function EventChat({ messages, onSendMessage, currentUserId }: EventChatProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Rolar para a última mensagem sempre que novas mensagens chegarem
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      setSending(true);
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  const formatMessageTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR
    });
  };
  
  return (
    <Card className="flex flex-col h-[500px]">
      <CardContent className="flex-grow overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map(msg => {
                const isCurrentUser = msg.user_id === currentUserId;
                
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex gap-3",
                      isCurrentUser && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.user_avatar || ''} alt={msg.user_name || 'Usuário'} />
                      <AvatarFallback>{getInitials(msg.user_name)}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "flex-grow max-w-[70%]",
                      isCurrentUser && "flex flex-col items-end"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{msg.user_name || 'Usuário'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                      <div className={cn(
                        "mt-1 px-4 py-2 rounded-lg",
                        isCurrentUser 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Ainda não há mensagens. Inicie a conversa!</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="min-h-[60px] flex-grow resize-none"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || sending}
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
} 