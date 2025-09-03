import { animate, style, transition, trigger } from '@angular/animations';

export const scaleInAnimation = trigger('scaleIn', [
  transition(':enter', [
    style({
      transform: 'scale(0)'
    }),
    animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({
      transform: 'scale(1)'
    }))
  ])
]);
