import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTransaccionesComponent } from './lista-transacciones/lista-transacciones.component';
import { AgregarTransaccionComponent } from './agregar-transaccion/agregar-transaccion.component';

const routes: Routes = [
  { 
    path: '',
    component:ListaTransaccionesComponent
  },
  { path: 'agregar-transaccion',
    component: AgregarTransaccionComponent
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransaccionesRoutingModule { }
