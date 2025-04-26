import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, X, Upload, FileUp } from 'lucide-react';
import { saveImageLocally, uploadImageWithLocalFallback } from '@/services/storageService';

interface FileUploaderProps {
  onFileUploaded: (filePath: string) => void;
  folder?: string;
  userId?: string;
  maxSize?: number; // tamanho máximo em MB
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  className?: string;
  accept?: string;
  buttonText?: string;
  useFallback?: boolean;
  previewClass?: string;
}

const FileUploader = ({ 
  onFileUploaded, 
  folder = '', 
  userId = '',
  maxSize = 2, 
  aspectRatio = 'square',
  className = '',
  accept = 'image/*',
  buttonText = 'Selecionar imagem',
  useFallback = true,
  previewClass = ''
}: FileUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculando a classe do aspect ratio
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      default: return '';
    }
  };
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificando tamanho (maxSize em MB)
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `Por favor, selecione um arquivo com menos de ${maxSize}MB`,
        variant: "destructive"
      });
      return;
    }
    
    // Verificação para imagens
    if (file.type.startsWith('image/')) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        toast({
          title: "Formato não suportado",
          description: "Use apenas imagens JPG, PNG, GIF ou WebP",
          variant: "destructive"
        });
        return;
      }
    }
    
    setSelectedFile(file);
    
    // Criar preview apenas para imagens
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null);
    }
  }, [maxSize]);
  
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [filePreview]);
  
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      let filePath: string | null = null;
      
      if (useFallback && userId) {
        // Usar a estratégia com fallback (local -> Supabase -> base64)
        filePath = await uploadImageWithLocalFallback(selectedFile, userId, folder);
      } else {
        // Upload apenas local
        filePath = await saveImageLocally(selectedFile, folder);
      }
      
      if (filePath) {
        onFileUploaded(filePath);
        
        toast({
          title: "Arquivo carregado",
          description: "O arquivo foi salvo com sucesso",
          variant: "default"
        });
        
        // Limpar após upload bem-sucedido
        handleRemoveFile();
      } else {
        throw new Error("Não foi possível salvar o arquivo");
      }
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível salvar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, folder, userId, useFallback, handleRemoveFile, onFileUploaded]);
  
  return (
    <div className={`flex flex-col ${className}`}>
      <input 
        type="file" 
        accept={accept}
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        id="file-uploader-input"
      />
      
      {selectedFile && filePreview ? (
        // Preview do arquivo (para imagens)
        <div className={`relative overflow-hidden border rounded-md ${previewClass || 'border-zinc-700'}`}>
          <img 
            src={filePreview} 
            alt="Prévia" 
            className={`w-full ${getAspectRatioClass()} object-cover`}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveFile}
              className="rounded-full w-9 h-9 p-0"
            >
              <X size={16} />
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleUpload}
              disabled={isUploading}
              className="rounded-full w-9 h-9 p-0 bg-emerald-500 hover:bg-emerald-600"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
            </Button>
          </div>
        </div>
      ) : selectedFile ? (
        // Preview para arquivos não-imagem
        <div className="border border-zinc-700 rounded-md p-3">
          <div className="flex items-center gap-3">
            <FileUp className="text-zinc-400" size={24} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{selectedFile.name}</div>
              <div className="text-xs text-zinc-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X size={14} />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
                className="h-8 w-8 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Botão para selecionar arquivo
        <Button 
          variant="outline" 
          className="border-dashed border-zinc-700 text-zinc-400 hover:text-white h-24 flex flex-col gap-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={20} />
          <span className="text-xs">{buttonText}</span>
        </Button>
      )}
      
      <p className="text-xs text-zinc-500 mt-2">
        {accept === 'image/*' 
          ? 'Formatos: JPG, PNG, GIF, WebP' 
          : 'Selecione um arquivo'}
        {` (máx. ${maxSize}MB)`}
      </p>
    </div>
  );
};

export default FileUploader; 