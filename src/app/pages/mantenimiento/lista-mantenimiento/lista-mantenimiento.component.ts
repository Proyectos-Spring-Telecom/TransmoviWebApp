import { Component } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-lista-mantenimiento',
  templateUrl: './lista-mantenimiento.component.html',
  styleUrl: './lista-mantenimiento.component.scss',
  animations: [fadeInUpAnimation],
})
export class ListaMantenimientoComponent {

  tabs = [
    { id: 'vehicular', text: 'Mantenimiento Vehicular', icon: 'car' },
    { id: 'combustible', text: 'Mantenimiento Combustible', icon: 'money' },
    { id: 'kilometraje', text: 'Mantenimiento Kilometraje', icon: 'chart' }
  ];

  selectedTabIndex = 0;
  selectedTab: 'vehicular' | 'combustible' | 'kilometraje' = 'vehicular';

  onTabClick(e: any) {
    const item = e.itemData;
    this.selectedTab = item.id;
    this.selectedTabIndex = e.itemIndex;
  }

}
