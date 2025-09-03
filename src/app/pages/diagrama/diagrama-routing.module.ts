import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiagramasComponent } from './diagramas/diagramas.component';

const routes: Routes = [
  {
      path: 'generador-diagrama',
      component: DiagramasComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiagramaRoutingModule { }
