/** Outil de l'écran affiché, transmis aux listes (écrans sans défilement propre) pour y ajouter « Pour aller plus loin ». */
import React from 'react';
export const ScreenToolContext = React.createContext<string | null>(null);
