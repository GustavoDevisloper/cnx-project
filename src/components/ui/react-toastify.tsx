import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from "next-themes";

type ToastifyContainerProps = React.ComponentProps<typeof ToastContainer>;

/**
 * Componente personalizado para o ToastContainer do react-toastify
 * que se adapta ao tema claro/escuro do aplicativo
 */
const ToastifyContainer = ({ ...props }: ToastifyContainerProps) => {
  const { theme = "system" } = useTheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={isDarkTheme ? "dark" : "light"}
      {...props}
    />
  );
};

export { ToastifyContainer }; 