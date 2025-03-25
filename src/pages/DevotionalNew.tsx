import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDevotional, testCreateDevotionalRPC, diagnoseDevotionalsTable, testInsertDevotional } from '@/services/devotionalService';
import { isAdmin } from '@/services/authService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, AlignLeft, Calendar, Hash, BookMarked } from 'lucide-react';

// Lista de temas comuns
const temas = [
  'Amor',
  'Fé',
  'Esperança',
  'Sabedoria',
  'Perseverança',
  'Gratidão',
  'Oração',
  'Família',
  'Amizade',
  'Perdão',
  'Santidade',
  'Serviço',
  'Adoração',
  'Outro'
];

// Lista de livros da Bíblia
const livrosBiblia = [
  'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio',
  'Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel',
  '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras',
  'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios',
  'Eclesiastes', 'Cantares', 'Isaías', 'Jeremias', 'Lamentações',
  'Ezequiel', 'Daniel', 'Oséias', 'Joel', 'Amós',
  'Obadias', 'Jonas', 'Miquéias', 'Naum', 'Habacuque',
  'Sofonias', 'Ageu', 'Zacarias', 'Malaquias',
  'Mateus', 'Marcos', 'Lucas', 'João', 'Atos',
  'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios',
  'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo',
  '2 Timóteo', 'Tito', 'Filemom', 'Hebreus', 'Tiago',
  '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João',
  'Judas', 'Apocalipse'
];

const DevotionalNew = () => {
  const [titulo, setTitulo] = useState('');
  const [tema, setTema] = useState('');
  const [temaCustom, setTemaCustom] = useState('');
  const [livro, setLivro] = useState('');
  const [capitulo, setCapitulo] = useState('');
  const [versiculo, setVersiculo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<string | null>(null);
  const [tableStructure, setTableStructure] = useState<any>(null);
  const navigate = useNavigate();

  console.log("DevotionalNew component mounted");

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Verificar se o usuário é administrador - usando função assíncrona
      const isAdminUser = await isAdmin();
      if (!isAdminUser) {
        toast({
          title: "Acesso negado",
          description: "Apenas administradores podem criar devocionais",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      document.title = "Conexão Jovem | Novo Devocional";
    };

    checkAdminStatus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!titulo || !livro || !capitulo || !versiculo) {
      toast({
        title: "Campos incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Construir a referência do versículo
    const versiculoRef = `${livro} ${capitulo}:${versiculo}`;
    
    // Determinar o tema final (padrão ou personalizado)
    const temaFinal = tema === 'Outro' ? temaCustom : tema;

    setIsLoading(true);

    try {
      // Chamar a função de criação de devocional
      const devotionalId = await createDevotional({
        title: titulo,
        scripture: versiculoRef,
        theme: temaFinal,
        content: conteudo,
        date: new Date().toISOString().split('T')[0] // Hoje
      });

      if (devotionalId) {
        toast({
          title: "Devocional criado",
          description: "O devocional foi criado com sucesso"
        });
        navigate('/devotional');
      }
    } catch (error) {
      console.error("Erro ao criar devocional:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o devocional",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRPC = async () => {
    setIsLoading(true);
    try {
      const result = await testCreateDevotionalRPC();
      setRpcStatus(result.message);
      toast({
        title: result.success ? "RPC Disponível" : "Erro RPC",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Erro ao testar RPC:", error);
      setRpcStatus("Erro ao testar RPC: " + (error.message || "Erro desconhecido"));
      toast({
        title: "Erro",
        description: "Erro ao testar RPC",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnose = async () => {
    setIsLoading(true);
    try {
      const result = await diagnoseDevotionalsTable();
      setRpcStatus(result.message);
      setTableStructure(result.structure);
      
      toast({
        title: result.success ? "Diagnóstico Concluído" : "Problema Detectado",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Erro ao diagnosticar tabela:", error);
      setRpcStatus("Erro ao diagnosticar: " + (error.message || "Erro desconhecido"));
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao diagnosticar a tabela",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestInsert = async () => {
    setIsLoading(true);
    try {
      const result = await testInsertDevotional();
      setRpcStatus(result.message);
      
      toast({
        title: result.success ? "Teste Bem-Sucedido" : "Falha no Teste",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Erro ao testar inserção:", error);
      setRpcStatus("Erro ao testar inserção: " + (error.message || "Erro desconhecido"));
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao testar inserção",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/devotional')} className="mr-2">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-3xl font-bold">Novo Devocional</h1>
          </div>

          {/* Adicionar botão de diagnóstico */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={handleTestRPC} 
                disabled={isLoading}
              >
                Testar Função RPC
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDiagnose} 
                disabled={isLoading}
              >
                Diagnosticar Tabela
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTestInsert} 
                disabled={isLoading}
              >
                Testar Inserção
              </Button>
            </div>
            {rpcStatus && (
              <div className={`p-2 rounded text-sm ${rpcStatus.includes('NÃO') || rpcStatus.includes('Erro') || rpcStatus.includes('Falha') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {rpcStatus}
              </div>
            )}
            {tableStructure && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                <pre>{JSON.stringify(tableStructure, null, 2)}</pre>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Criar Devocional</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para criar um novo devocional.
                Os campos marcados com * são obrigatórios.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="titulo" className="flex items-center gap-2">
                    <Hash size={16} />
                    Título *
                  </Label>
                  <Input
                    id="titulo"
                    placeholder="Digite um título para o devocional"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>

                {/* Tema */}
                <div className="space-y-2">
                  <Label htmlFor="tema" className="flex items-center gap-2">
                    <BookMarked size={16} />
                    Tema *
                  </Label>
                  <Select value={tema} onValueChange={setTema} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {temas.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {tema === 'Outro' && (
                    <Input
                      id="tema-custom"
                      placeholder="Digite o tema personalizado"
                      value={temaCustom}
                      onChange={(e) => setTemaCustom(e.target.value)}
                      className="mt-2"
                      required
                    />
                  )}
                </div>

                {/* Referência Bíblica */}
                <div className="space-y-2">
                  <Label htmlFor="versiculo" className="flex items-center gap-2">
                    <BookOpen size={16} />
                    Versículo *
                  </Label>
                  
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <Select value={livro} onValueChange={setLivro} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Livro" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {livrosBiblia.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-3">
                      <Input
                        id="capitulo"
                        placeholder="Capítulo"
                        value={capitulo}
                        onChange={(e) => setCapitulo(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <Input
                        id="versiculo"
                        placeholder="Versículo(s)"
                        value={versiculo}
                        onChange={(e) => setVersiculo(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  {livro && capitulo && versiculo && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Referência: <span className="font-medium">{livro} {capitulo}:{versiculo}</span>
                    </p>
                  )}
                </div>

                {/* Conteúdo (opcional) */}
                <div className="space-y-2">
                  <Label htmlFor="conteudo" className="flex items-center gap-2">
                    <AlignLeft size={16} />
                    Conteúdo (opcional)
                  </Label>
                  <Textarea
                    id="conteudo"
                    placeholder="Digite um conteúdo complementar (opcional)"
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    O conteúdo é opcional. Os usuários poderão compartilhar suas interpretações através dos comentários.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate('/devotional')}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Criando...
                    </>
                  ) : (
                    'Criar Devocional'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DevotionalNew; 