import { animate, style, transition, trigger } from '@angular/animations';

export const fadeInRightAnimation = trigger('fadeInRight', [
  transition(':enter', [
    style({
      transform: 'translateX(-2vw)',
      opacity: 0
    }),
    animate('0.3s cubic-bezier(0.35, 0, 0.25, 1)', style({
      transform: 'translateX(0)',
      opacity: 1
    }))
  ])
]);
