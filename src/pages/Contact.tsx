import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { AtSign, MessageSquare, Send, MapPin, Phone, Clock } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    document.title = "Conexão Jovem | Contato";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simular envio
    setTimeout(() => {
      toast({
        title: "Mensagem enviada",
        description: "Agradecemos pelo contato! Responderemos em breve."
      });
      
      // Limpar formulário
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">Entre em Contato</h1>
      <p className="mt-2 text-muted-foreground">
        Estamos ansiosos para ouvir você! Envie-nos uma mensagem e responderemos o mais breve possível.
      </p>
      
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="seu@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Do que se trata sua mensagem?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem <span className="text-red-500">*</span></Label>
              <Textarea 
                id="message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Escreva sua mensagem aqui..."
                rows={5}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </span>
              )}
            </Button>
          </form>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold">Informações de Contato</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-start">
                <MapPin className="mr-3 mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-muted-foreground">Av. Principal, 123 - Centro, Cidade - Estado</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="mr-3 mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-muted-foreground">(00) 1234-5678</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <AtSign className="mr-3 mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">contato@conexaojovem.org</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="mr-3 mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Horário de Atendimento</p>
                  <p className="text-muted-foreground">Segunda a Sexta: 9h às 18h</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">Redes Sociais</h2>
            <div className="mt-4 flex space-x-4">
              <Button variant="outline" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Button>
              <Button variant="outline" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Button>
              <Button variant="outline" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 