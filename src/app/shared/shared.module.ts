import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UIModule } from './ui/ui.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { HasPermissionDirective } from '../core/haspermission.directive';

@NgModule({
  declarations: [HasPermissionDirective],
  imports: [
    CommonModule,
    UIModule,
    NgxPermissionsModule.forRoot(),
  ],
  exports: [HasPermissionDirective] 
})

export class SharedModule { }
