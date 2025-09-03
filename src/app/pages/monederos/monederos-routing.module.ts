import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaMonederosComponent } from './lista-monederos/lista-monederos.component';

const routes: Routes = [
  { path: 'lista-monederos',component:ListaMonederosComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MonederosRoutingModule { }
