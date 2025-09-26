import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaDerroterosComponent } from './lista-derroteros/lista-derroteros.component';
import { AltaDerroteroComponent } from './alta-derrotero/alta-derrotero.component';

const routes: Routes = 
[
  { 
    path: '',
    component:ListaDerroterosComponent
  },
  { path: 'agregar-derrotero',
    component: AltaDerroteroComponent
  },
  {
    path: 'editar-derrotero/:idDerrotero',
    component: AltaDerroteroComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DerroterosRoutingModule { }
