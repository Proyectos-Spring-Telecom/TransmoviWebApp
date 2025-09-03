import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaClientesComponent } from './lista-clientes/lista-clientes.component';
import { AltaClientesComponent } from './alta-clientes/alta-clientes.component';

const routes: Routes = 
[
  { path: '',
    component: ListaClientesComponent
  },
  { path: 'agregar-cliente',
    component: AltaClientesComponent
  },
  {
    path: 'editar-cliente/:idCliente',
    component: AltaClientesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientesRoutingModule { }
