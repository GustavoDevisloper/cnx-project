import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { useState, useEffect } from "react"
import { User } from "lucide-react"

import { cn } from "@/lib/utils"

// Função para validar se uma string é uma imagem base64 válida
const isValidBase64Image = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  // Verificar o padrão básico de dados base64 de imagem
  const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
  
  // Verificar se é um formato suportado e se não excede o tamanho máximo
  if (base64Regex.test(str)) {
    // Permitir imagens base64 até 150kb para garantir compatibilidade
    if (str.length > 150000) {
      console.warn('Base64 muito longo detectado no Avatar. Tamanho:', str.length);
    }
    return true;
  }
  
  return false;
};

// Função para validar fonte de imagem
const validateImageSource = (src: string | undefined): boolean => {
  if (!src) return false;
  
  // URLs HTTP/HTTPS
  if (src.startsWith('http')) return true;
  
  // Imagem base64
  if (isValidBase64Image(src)) return true;
  
  // Caminho local
  if (src.startsWith('./') || src.startsWith('/')) return true;

  return false;
};

// Função auxiliar para extrair iniciais do nome
const getInitials = (name?: string): string => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, alt, ...props }, ref) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  
  // Função para lidar com erros de carregamento de imagem
  const handleError = () => {
    console.log('Erro ao carregar imagem do avatar', src?.substring(0, 50) + '...');
    setHasError(true);
    setImgSrc(undefined);
  };
  
  // Resetar o estado quando a src mudar
  useEffect(() => {
    setHasError(false);
    
    if (!src) {
      setImgSrc(undefined);
      return;
    }
    
    // Validar a fonte da imagem
    if (validateImageSource(src)) {
      setImgSrc(src);
    } else {
      console.log('Fonte de imagem inválida', src?.substring(0, 50) + '...');
      setImgSrc(undefined);
      setHasError(true);
    }
  }, [src]);
  
  // Se tiver erro ou não houver fonte válida, mostrar o fallback
  if (hasError || !imgSrc) {
    return (
      <AvatarFallback>
        {alt ? getInitials(alt) : <User className="h-5 w-5" />}
      </AvatarFallback>
    );
  }
  
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
