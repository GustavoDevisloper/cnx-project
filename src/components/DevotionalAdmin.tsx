import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isAdmin } from '@/services/authService';
import { generateDevotionalByTheme, createDevotional } from '@/services/devotionalService';
import { Loader2, Send, BookOpen, Sparkles } from 'lucide-react';
import { getCurrentDayOfWeek } from '@/utils/date';

/**
 * Componente para administradores gerenciarem devocionais
 * Permite criar manualmente ou gerar automaticamente com base em temas
 */
export default function DevotionalAdmin() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [theme, setTheme] = useState('');
  const { toast } = useToast();
  
  // Estados para controlar o formulário manual
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scripture, setScripture] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  
  useEffect(() => {
    // Verificar se o usuário é administrador
    const checkAdmin = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
    };
    
    checkAdmin();
  }, []);
  
  // Gerar um devocional automaticamente baseado em um tema
  const handleGenerateDevotional = async () => {
    if (!theme) {
      toast({
        title: 'Tema obrigatório',
        description: 'Por favor, insira um tema para gerar o devocional',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      // Usar a função atualizada para gerar um devocional
      const devotional = await generateDevotionalByTheme(theme);
      
      if (!devotional) {
        toast({
          title: 'Erro ao gerar devocional',
          description: 'Não foi possível gerar um devocional com esse tema',
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Devocional gerado com sucesso!',
        description: `Título: ${devotional.title}`,
      });
      
      // Resetar o formulário
      setTheme('');
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao gerar devocional',
        description: 'Ocorreu um erro durante a geração',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // Criar um devocional manualmente
  const handleCreateDevotional = async () => {
    if (!title || !content || !scripture) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Título, conteúdo e passagem bíblica são obrigatórios',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar os dados do devocional
      const devotionalData = {
        title,
        content,
        scripture,
        scriptureText,
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: getCurrentDayOfWeek(),
        isAIGenerated: false
      };
      
      // Usar a função atualizada para criar um devocional
      const id = await createDevotional(devotionalData);
      
      if (!id) {
        toast({
          title: 'Erro ao criar devocional',
          description: 'Não foi possível salvar o devocional',
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Devocional criado com sucesso!',
        description: 'O devocional foi publicado'
      });
      
      // Resetar o formulário
      setTitle('');
      setContent('');
      setScripture('');
      setScriptureText('');
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao criar devocional',
        description: 'Ocorreu um erro ao salvar o devocional',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Se não for administrador, mostrar mensagem
  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é restrita para administradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você precisa ter permissões de administrador para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Gerenciar Devocionais</h1>
      
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="generate">Gerar Automaticamente</TabsTrigger>
          <TabsTrigger value="manual">Criar Manualmente</TabsTrigger>
        </TabsList>
        
        {/* Tab para geração automática */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Devocional Automático</CardTitle>
              <CardDescription>
                Entre com um tema e o sistema gerará um devocional automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Tema (ex: fé, esperança, perseverança, etc.)"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    disabled={generating}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Sugestões de temas: amor, fé, esperança, perseverança, gratidão, perdão
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateDevotional} 
                disabled={generating || !theme}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Devocional...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Devocional
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Tab para criação manual */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Criar Devocional Manualmente</CardTitle>
              <CardDescription>
                Preencha todos os campos para criar um novo devocional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Título*
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do devocional"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="scripture" className="block text-sm font-medium mb-1">
                  Passagem Bíblica*
                </label>
                <Input
                  id="scripture"
                  value={scripture}
                  onChange={(e) => setScripture(e.target.value)}
                  placeholder="Ex: João 3:16"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="scriptureText" className="block text-sm font-medium mb-1">
                  Texto da Passagem
                </label>
                <Textarea
                  id="scriptureText"
                  value={scriptureText}
                  onChange={(e) => setScriptureText(e.target.value)}
                  placeholder="Digite o texto da passagem bíblica"
                  rows={3}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                  Conteúdo*
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite o conteúdo do devocional"
                  rows={8}
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateDevotional}
                disabled={loading || !title || !content || !scripture}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Publicar Devocional
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 