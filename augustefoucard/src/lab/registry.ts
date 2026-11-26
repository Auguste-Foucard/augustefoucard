import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Expériences interactives du LAB.
 * Pour en ajouter une : crée un composant dans src/lab/, référence-le ici,
 * puis indique son nom dans le champ "interactive" de src/content/lab.json.
 */
export const LAB_REGISTRY: Record<string, LazyExoticComponent<ComponentType>> = {
  'voice-move': lazy(() => import('./VoiceMove')),
};
