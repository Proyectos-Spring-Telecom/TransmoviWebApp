import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { RegionesService } from 'src/app/shared/services/regiones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-region',
  templateUrl: './alta-region.component.html',
  styleUrl: './alta-region.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaRegionComponent implements OnInit {

  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public regionesForm: FormGroup;
  public idRegion: number;
  public title = 'Agregar Región';
  loadingDependientes = false;
  listaClientes: any[] = [];
  listaDipositivos: any[] = [];
  listaBlueVox: any[] = [];
  listaVehiculos: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private regiService: RegionesService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private clieService: ClientesService
  ) { }

  // --- igual que ya lo tienes ---
  ngOnInit(): void {
    this.initForm();
    this.obtenerClientes()

    this.activatedRouted.params.subscribe(params => {
      this.idRegion = params['idRegion'];
      if (this.idRegion) {
        this.title = 'Actualizar Región';
        this.obtenerRegion()
      }
    });
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response: any) => {
      this.listaClientes = this.normalizeId(response?.data);
    });
  }

  obtenerRegion() {
    this.regiService.obtenerRegion(this.idRegion).subscribe((response: any) => {;
      this.regionesForm.patchValue({
        nombre: response.data.idRegion2.nombre,
        descripcion: response.data.idRegion2.descripcion,
        idCliente: response.data.idRegion2.idCliente,
      });
    });
  }

  private normalizeId<T extends { id: any }>(arr: T[] = []): (T & { id: number })[] {
    return arr.map((x: any) => ({ ...x, id: Number(x.id) }));
  }

  initForm() {
    this.regionesForm = this.fb.group({
      estatus: [1, Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      idCliente: [null, Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idRegion) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.regionesForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        idCliente: 'Cliente'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.regionesForm.controls).forEach(key => {
        const control = this.regionesForm.get(key);
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
    this.regionesForm.removeControl('id');
    this.regiService.agregarRegion(this.regionesForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo módulo de manera exitosa.`,
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
          text: error,
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
    if (this.regionesForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        idCliente: 'Cliente'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.regionesForm.controls).forEach(key => {
        const control = this.regionesForm.get(key);
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
    this.regiService.actualizarRegion(this.idRegion, this.regionesForm.value).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del módulo se actualizaron correctamente.`,
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
          text: `Ocurrió un error al actualizar el módulo.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/regiones');
  }

}
