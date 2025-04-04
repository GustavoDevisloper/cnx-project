import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDevotional, testCreateDevotionalRPC, diagnoseDevotionalsTable, testInsertDevotional } from '@/services/devotionalService';
import { useAuth } from '@/hooks/auth';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Conexão Jovem | Novo Devocional";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      console.log('Já existe uma submissão em andamento...');
      return;
    }

    if (!titulo || !livro || !capitulo || !versiculo || !conteudo) {
      toast({
        title: "Campos incompletos",
        description: "Preencha todos os campos obrigatórios (título, versículo e conteúdo)",
        variant: "destructive"
      });
      return;
    }

    const versiculoRef = `${livro} ${capitulo}:${versiculo}`;
    const temaFinal = tema === 'Outro' ? temaCustom : tema;

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      console.log('Preparando dados para envio:', {
        title: titulo,
        scripture: versiculoRef,
        content: conteudo,
        theme: temaFinal
      });

      const devotionalId = await createDevotional({
        title: titulo,
        content: conteudo,
        scripture: versiculoRef,
        theme: temaFinal,
        date: new Date().toISOString().split('T')[0]
      });

      if (devotionalId) {
        console.log('Devocional criado com sucesso, ID:', devotionalId);
        toast({
          title: "Devocional criado",
          description: "O devocional foi criado com sucesso"
        });
        navigate('/devotional');
      } else {
        console.error('Falha ao criar devocional: ID não retornado');
        toast({
          title: "Erro",
          description: "Não foi possível criar o devocional. Verifique os logs para mais detalhes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao criar devocional:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o devocional",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
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