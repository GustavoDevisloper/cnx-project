import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "xl";
}

export function Spinner({ className, size = "default" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "default",
          "h-8 w-8": size === "lg",
          "h-12 w-12": size === "xl",
        },
        className
      )}
      role="status"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
} 