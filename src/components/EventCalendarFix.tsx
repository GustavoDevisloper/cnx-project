import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface EventCalendarFixProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
}

/**
 * Componente de calendário adaptado para funcionar melhor em dispositivos móveis
 */
export function EventCalendarFix({ selected, onSelect, className, disabled }: EventCalendarFixProps) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  
  // Função para formatar a data para o formato aceito pelo input date
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };
  
  // Handler para quando a data é alterada no input nativo
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && onSelect) {
      const date = new Date(value);
      // Definir hora para meio-dia para evitar problemas de fuso horário
      date.setHours(12, 0, 0, 0);
      onSelect(date);
    }
  };
  
  // Detectar mudança na versão móvel/desktop via resize
  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    };
    
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Em dispositivos móveis, usar input nativo
  if (isMobile) {
    return (
      <div className={cn("relative", className)}>
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={formatDateForInput(selected)}
          onChange={handleDateChange}
          className="pl-10 h-10 text-base"
          onClick={(e) => e.currentTarget.showPicker()}
        />
      </div>
    );
  }
  
  // Em desktops, usar o DayPicker personalizado
  return (
    <DayPicker
      showOutsideDays={true}
      className={cn("p-3", className)}
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      locale={ptBR}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
    />
  );
} 