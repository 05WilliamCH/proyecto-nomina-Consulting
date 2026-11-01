import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuracion de Vite. VITE_API_URL permite apuntar el frontend al
// backend (por defecto http://localhost:4000).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
