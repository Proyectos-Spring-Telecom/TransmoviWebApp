import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaBitacoraComponent } from './lista-bitacora/lista-bitacora.component';

const routes: Routes = [
  { path: 'lista-bitacora',component:ListaBitacoraComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BitacoraRoutingModule { }
