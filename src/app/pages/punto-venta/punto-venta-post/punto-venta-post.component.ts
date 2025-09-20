import { Component } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

/* Tipado */
interface Monedero {
  id: number;
  numeroSerie: string;
  titular: string;
  saldo: number;
}
@Component({
  selector: 'app-punto-venta-post',
  templateUrl: './punto-venta-post.component.html',
  styleUrl: './punto-venta-post.component.scss',
  animations: [fadeInUpAnimation],
})
export class PuntoVentaPostComponent {
 wallets: Monedero[] = [
    { id: 1, numeroSerie: 'MN-001-AZ', titular: 'María López', saldo: 320.5 },
    { id: 2, numeroSerie: 'MN-002-BX', titular: 'Juan Pérez', saldo: 1520 },
    { id: 3, numeroSerie: 'MN-003-QW', titular: 'Logística MX SA', saldo: 90 },
    { id: 4, numeroSerie: 'MN-004-ZZ', titular: 'Luis Hernández', saldo: 780.25 },
    { id: 5, numeroSerie: 'MN-005-KL', titular: 'Sofía Ramos', saldo: 245.75 }
  ];
  selectedWalletId: number | null = null;

  get selectedWallet(): Monedero | null {
    return this.wallets.find(w => w.id === this.selectedWalletId) || null;
  }

}
