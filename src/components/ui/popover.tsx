import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  // Referência do elemento de conteúdo
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Manipulador para o evento personalizado de seleção de data
  React.useEffect(() => {
    const handleDateSelected = () => {
      // Quando uma data é selecionada, feche o popover
      if (contentRef.current) {
        // Procurar pelo botão mais próximo (PopoverTrigger) e simular um clique
        const popoverRoot = contentRef.current.closest('[data-radix-popper-content-wrapper]');
        if (popoverRoot) {
          const trigger = document.querySelector('[aria-expanded="true"][aria-controls]');
          if (trigger && trigger instanceof HTMLElement) {
            setTimeout(() => {
              trigger.click();
            }, 100);
          }
        }
      }
    };
    
    window.addEventListener('calendar-date-selected', handleDateSelected);
    return () => {
      window.removeEventListener('calendar-date-selected', handleDateSelected);
    };
  }, []);
  
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={(node) => {
          // Combinar as refs
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          contentRef.current = node;
        }}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        onPointerDownOutside={(e) => {
          if (e.pointerType === 'touch') {
            // No mobile, permitir que o usuário interaja com o calendário
            const target = e.target as HTMLElement;
            const isCalendarClick = target.closest('.rdp') || 
                                    target.closest('.mobile-calendar-fix');
            
            if (isCalendarClick) {
              e.preventDefault();
            }
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          
          // Verificar se o clique foi dentro do calendário
          const isCalendarClick = target.closest('.rdp') || 
                                  target.closest('.mobile-calendar-fix');
          
          // Permitir interação se for dentro do calendário
          if (isCalendarClick || target.closest('[data-radix-focus-guard]')) {
            e.preventDefault();
          }
        }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
