import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ModulosService } from 'src/app/shared/services/modulos.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-usuario',
  templateUrl: './alta-usuario.component.html',
  styleUrl: './alta-usuario.component.scss',
  animations: [fadeInUpAnimation],
})
export class AltaUsuarioComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public usuarioForm: FormGroup;
  public idUsuario: number;
  public inputContrasena: boolean = true;
  public title = 'Agregar Usuario';
  public listaModulos: any[] = [];
  type = 'password';
  minCaracteres = false;
  maxCaracteres = false;
  hasNumber = false;
  hasMinus = false;
  hasMayus = false;
  espCaracter = false;

  constructor(
    private fb: FormBuilder,
    private usuaService: UsuariosService,
    private route: Router,
    private activatedRouted: ActivatedRoute,
    private moduService: ModulosService
  ) {}

  ngOnInit(): void {
    this.obtenerModulos();
    this.initForm();
    this.activatedRouted.params.subscribe(
      (params) => {
      this.idUsuario = params['idUsuario'];
      if (this.idUsuario) {
        this.title = 'Actualizar Usuario';
        this.obtenerUsuarioID();
        this.inputContrasena = false;
      }
    }
  )
  }

  initForm() {
    this.usuarioForm = this.fb.group({
      UserName: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required]],
      Telefono: ['', [Validators.required]],
      Nombre: ['', [Validators.required]],
      ApellidoPaterno: ['', [Validators.required]],
      ApellidoMaterno: ['', [Validators.required]],
      IdRol: [1],
      Estatus: [1],
      IdCliente: [1],
    });
  }

  obtenerModulos() {
    this.moduService.obtenerModulos().subscribe((response: any) => {
      let raw: any = response;
      if (Array.isArray(response) && Array.isArray(response[0])) {
        raw = response[0];
      }
      if (!Array.isArray(raw)) raw = [];
      this.listaModulos = raw.map((m: any) => ({
        id:          m?.Id ?? m?.id,
        nombre:      m?.Nombre ?? m?.nombre,
        descripcion: m?.Descripcion ?? m?.descripcion,
        estatus:     m?.Estatus ?? m?.estatus,
        permisos: (m?.Permisos ?? m?.permisos ?? []).map((p: any) => ({
          id:          p?.Id ?? p?.id,
          nombre:      p?.Nombre ?? p?.nombre,
          descripcion: p?.Descripcion ?? p?.descripcion,
          estatus:     p?.Estatus ?? p?.estatus
        }))
      }));
    });
  }

  trackModulo = (_: number, m: any) => m.id ?? m.Id;
  trackPermiso = (_: number, p: any) => p.id ?? p.Id;

  onToggle(permiso: any, checked: boolean) {
    permiso.estatus = checked ? 1 : 0;
  }

  obtenerUsuarioID() {
    this.usuaService.obtenerUsuario(this.idUsuario).subscribe(
      (response: any) => {
        this.usuarioForm.patchValue({
          Nombre: response.user.Nombre,
          ApellidoPaterno: response.user.ApellidoPaterno,
          ApellidoMaterno: response.user.ApellidoMaterno,
          Telefono: response.user.Telefono,
          UserName: response.user.UserName,
          Password: response.user.Password,
        });
      }
    );
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  myFunctionPasswordCurrent() {
    if (this.type === "password") {
      this.type = "text";
    } else {
      this.type = "password";
    }
  }

  onPasswordInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.minCaracteres = value.length >= 6;
    this.maxCaracteres = value.length <= 16;
    this.hasNumber = /\d/.test(value);
    this.hasMinus = /[a-z]/.test(value);
    this.hasMayus = /[A-Z]/.test(value);
    this.espCaracter = /[^\w\d]/.test(value);
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idUsuario) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.usuarioForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        Nombre: 'Nombre',
        ApellidoPaterno: 'Apellido Paterno',
        ApellidoMaterno: 'Apellido Paterno',
        telefono: 'Teléfono',
        Correo: 'Correo electrónico',
        Contraseña: 'Contraseña',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.usuarioForm.controls).forEach((key) => {
        const control = this.usuarioForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
        </div>
      `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#22252f',
        html: `
          <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
            Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
            Por favor complétalos antes de continuar:
          </p>
          <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }
    this.usuarioForm.removeControl('id');
    this.usuaService.agregarUsuario(this.usuarioForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Se agregó un nuevo usuario de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#22252f',
          text: `Ocurrió un error al agregar el usuario.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.usuarioForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        Nombre: 'Nombre',
        ApellidoPaterno: 'Apellido Paterno',
        ApellidoMaterno: 'Apellido Paterno',
        telefono: 'Teléfono',
        Correo: 'Correo electrónico',
        Contraseña: 'Contraseña',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.usuarioForm.controls).forEach((key) => {
        const control = this.usuarioForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
        </div>
      `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#22252f',
        html: `
          <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
            Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
            Por favor complétalos antes de continuar:
          </p>
          <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border',
        },
      });
    }
    this.usuaService.actualizarUsuario(this.idUsuario, this.usuarioForm.value).subscribe(
        (response) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#22252f',
            text: `Los datos del usuario se actualizaron correctamente.`,
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          this.regresar();
        },
        (error) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Ops!',
            background: '#22252f',
            text: `Ocurrió un error al actualizar el usuario.`,
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      );
  }

  regresar() {
    this.route.navigateByUrl('/usuarios')
  }

}
