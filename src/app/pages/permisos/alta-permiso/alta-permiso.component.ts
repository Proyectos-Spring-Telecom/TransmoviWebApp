import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ModulosService } from 'src/app/shared/services/modulos.service';
import { PermisosService } from 'src/app/shared/services/permisos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-permiso',
  templateUrl: './alta-permiso.component.html',
  styleUrl: './alta-permiso.component.scss',
  animations: [fadeInUpAnimation],
})
export class AltaPermisoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public listaModulos: any;
  public permisoForm: FormGroup;
  public idPermiso: number;
  public title = 'Agregar Permiso';
  public listaClientes: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private permiService: PermisosService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private moduSer: ModulosService
  ) {}

  ngOnInit(): void {
    this.obtenerModulo();
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idPermiso = params['idPermiso'];
      if (this.idPermiso) {
        this.title = 'Actualizar Permiso';
        this.obtenerPermiso();
      }
    });
  }

  public info: any;
  obtenerModulo() {
    this.moduSer.obtenerModulos().subscribe((response) => {
      this.listaModulos = response.map((m: any) => ({
        ...m,
        id: Number(m.id), // 🔹 normaliza ids a number
      }));
    });
  }

  obtenerPermiso() {
    this.permiService
      .obtenerPermiso(this.idPermiso)
      .subscribe((response: any) => {
        this.info = Number(response.id); // 🔹 ahora es number

        this.permisoForm.patchValue({
          nombre: response.nombre,
          descripcion: response.descripcion,
          idModulo: Number(response.id), // 👈 convierte a number
        });
      });
  }

  initForm() {
    this.permisoForm = this.fb.group({
      idModulo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idPermiso) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.permisoForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        idModulo: 'Módulo',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.permisoForm.controls).forEach((key) => {
        const control = this.permisoForm.get(key);
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
    this.permisoForm.removeControl('id');
    this.permiService.agregarPermiso(this.permisoForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Se agregó un nuevo permiso de manera exitosa.`,
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
          text: `Ocurrió un error al agregar el permiso.`,
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
    if (this.permisoForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        idModulo: 'Módulo',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.permisoForm.controls).forEach((key) => {
        const control = this.permisoForm.get(key);
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
    this.permiService
      .actualizarPermiso(this.idPermiso, this.permisoForm.value)
      .subscribe(
        (response) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#22252f',
            text: `Los datos del permiso se actualizaron correctamente.`,
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
            text: `Ocurrió un error al actualizar el permiso.`,
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      );
  }

  regresar() {
    this.route.navigateByUrl('/permisos');
  }
}
