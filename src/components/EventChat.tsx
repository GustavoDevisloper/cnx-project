import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventMessage } from '@/types/event';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EventChatProps {
  messages: EventMessage[];
  onSendMessage: (content: string) => Promise<void>;
}

export function EventChat({ messages, onSendMessage }: EventChatProps) {
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
  
  const getInitials = (name: string) => {
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
    <Card className="flex flex-col" style={{ height: '500px' }}>
      <CardContent className="flex-grow overflow-y-auto p-4">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={msg.user_avatar} alt={msg.user_name} />
                  <AvatarFallback>{getInitials(msg.user_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{msg.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Ainda não há mensagens. Inicie a conversa!</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="min-h-[60px] flex-grow"
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