import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={true}
      closeButton={true}
      richColors={true}
      duration={5000}
      invert={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:border-2 group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg group-[.toaster]:p-4 group-[.toaster]:min-w-[360px] group-[.toaster]:max-w-[420px] group-[.toaster]:animate-slide-in-right data-[swipe=move]:group-[.toaster]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:group-[.toaster]:translate-x-0 data-[swipe=end]:group-[.toaster]:animate-slide-out-to-left data-[state=closed]:group-[.toaster]:animate-slide-out-to-left",
          title: "group-[.toast]:text-lg group-[.toast]:font-semibold",
          description: "group-[.toast]:text-base group-[.toast]:text-muted-foreground group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:py-2 group-[.toast]:px-4",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toast]:border-rose-500 group-[.toast]:bg-rose-50 dark:group-[.toast]:bg-red-950/50 group-[.toast]:animate-bounce-small",
          success: "group-[.toast]:border-green-500 group-[.toast]:bg-green-50 dark:group-[.toast]:bg-green-950/50 group-[.toast]:animate-pulse-gentle",
          warning: "group-[.toast]:border-yellow-500 group-[.toast]:bg-yellow-50 dark:group-[.toast]:bg-yellow-950/50 group-[.toast]:animate-pulse-gentle",
          info: "group-[.toast]:border-blue-500 group-[.toast]:bg-blue-50 dark:group-[.toast]:bg-blue-950/50 group-[.toast]:animate-pulse-gentle",
        },
        duration: 5000, // Duração maior para melhor visibilidade
      }}
      {...props}
    />
  )
}

export { Toaster }
