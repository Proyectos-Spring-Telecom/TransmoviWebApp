import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaDispositivosComponent } from './lista-dispositivos/lista-dispositivos.component';
import { AltaDispositivoComponent } from './alta-dispositivo/alta-dispositivo.component';

const routes: Routes = [
  { 
    path: '',
    component:ListaDispositivosComponent
  },
  { path: 'agregar-dispositivo',
    component: AltaDispositivoComponent
  },
  {
    path: 'editar-dispositivo/:idDispositivo',
    component: AltaDispositivoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DispositivosRoutingModule { }
