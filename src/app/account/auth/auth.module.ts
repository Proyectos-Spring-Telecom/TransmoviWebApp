import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

import { UIModule } from '../../shared/ui/ui.module';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AuthRoutingModule } from './auth-routing';
import { PasswordresetComponent } from './passwordreset/passwordreset.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { InterceptService } from './login/intercept.service';
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthGuard } from './login/Guard/auth.guard';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [LoginComponent, SignupComponent, PasswordresetComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbAlertModule,
    ToastrModule.forRoot(), // Asegúrate de que está configurado aquí
    UIModule,
    AuthRoutingModule,
  ],
  /*providers: [
    InterceptService,
    {
        provide: HTTP_INTERCEPTORS,
        useClass: InterceptService,
        multi: true
    }
  ]*/
})


export class AuthModule {
/*static forRoot(): ModuleWithProviders<any> {
  return {
      ngModule: AuthModule,
      providers: [
          AuthenticationService,
          AuthGuard
      ]
  };
}*/
}
