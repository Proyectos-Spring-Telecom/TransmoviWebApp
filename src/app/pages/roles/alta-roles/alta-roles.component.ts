import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { RolesService } from 'src/app/shared/services/roles.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-roles',
  templateUrl: './alta-roles.component.html',
  styleUrl: './alta-roles.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaRolesComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public rolForm: FormGroup;
  public idRol: number;
  public title = 'Agregar Rol';
  public listaClientes: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private rolService: RolesService,
    private activatedRouted: ActivatedRoute,
    private route: Router
  ) { }

  ngOnInit(): void {
    // this.obtenerClientes()
    this.initForm();
    this.activatedRouted.params.subscribe(
      (params) => {
        this.idRol = params['idRol'];
        if (this.idRol) {
          this.title = 'Actualizar Rol';
          this.obtenerRol();
        }
      }
    )
  }

  obtenerRol() {
    this.rolService.obtenerRole(this.idRol).subscribe(
      (response: any) => {
        this.rolForm.patchValue({
          nombre: response.nombre,
          descripcion: response.descripcion,
          idRol: response.idRol,
        });
      }
    );
  }

  initForm() {
    this.rolForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idRol) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.rolForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.rolForm.controls).forEach(key => {
        const control = this.rolForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
          <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                      background: #caa8a8; text-align: center; margin-bottom: 8px;
                      border-radius: 4px;">
            <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
          </div>
        `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
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
          popup: 'swal2-padding swal2-border'
        }
      });
      return;
    }
    this.rolForm.removeControl('id');
    this.rolService.agregarRole(this.rolForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo rol de manera exitosa.`,
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
          background: '#002136',
          text: `Ocurrió un error al agregar el rol.`,
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
    if (this.rolForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.rolForm.controls).forEach(key => {
        const control = this.rolForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
          <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                      background: #caa8a8; text-align: center; margin-bottom: 8px;
                      border-radius: 4px;">
            <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
          </div>
        `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
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
          popup: 'swal2-padding swal2-border'
        }
      });
    }
    this.rolService.actualizarRoles(this.idRol, this.rolForm.value).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del rol se actualizaron correctamente.`,
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
          background: '#002136',
          text: `Ocurrió un error al actualizar el rol.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/roles');
  }


}
