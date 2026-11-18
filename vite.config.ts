import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Chemins relatifs : l'application fonctionne quel que soit le sous-dossier où elle est servie
  // (GitHub Pages : https://<compte>.github.io/<dépôt>/), sans avoir à connaître le nom du dépôt.
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});
