import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 transition-all" />
            ) : (
              <Moon className="h-5 w-5 transition-all" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alternar para tema {theme === 'dark' ? 'claro' : 'escuro'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 