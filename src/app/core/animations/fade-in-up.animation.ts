import { animate, style, transition, trigger } from '@angular/animations';

export const fadeInUpAnimation = trigger('fadeInUp', [
  transition(':enter', [
    style({
      transform: 'translateY(3vh)',
      opacity: 0
    }),
    animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({
      transform: 'translateY(0)',
      opacity: 1
    }))
  ])
]);
