// src/app/core/haspermission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthenticationService } from './services/auth.service';

@Directive({ selector: '[appHasPermission]' })
export class HasPermissionDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthenticationService
  ) {}

  @Input() set appHasPermission(permission: string | number | Array<string | number>) {
    // Leer SIEMPRE permisos actualizados y normalizarlos
    const currentUserPermissions = (this.authService.getPermissions() || [])
      .map(p => String(p).trim());

    const required = Array.isArray(permission) ? permission : [permission];
    const requiredNorm = required
      .filter(v => v != null)
      .map(v => String(v).trim());

    const allowed = requiredNorm.length === 0
      ? true
      : requiredNorm.some(perm => currentUserPermissions.includes(perm));

    // Evitar duplicados al recrear
    this.viewContainer.clear();
    if (allowed) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
