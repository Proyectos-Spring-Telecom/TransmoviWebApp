import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaOperadoresComponent } from './lista-operadores/lista-operadores.component';
import { AltaOperadorComponent } from './alta-operador/alta-operador.component';

const routes: Routes = 
[
  { 
    path: '',
    component:ListaOperadoresComponent
  },
  { path: 'agregar-operador',
    component: AltaOperadorComponent
  },
  {
    path: 'editar-operador/:idOperador',
    component: AltaOperadorComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperadoresRoutingModule { }
