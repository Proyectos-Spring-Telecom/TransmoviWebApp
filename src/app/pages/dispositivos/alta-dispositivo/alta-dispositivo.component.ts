import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-dispositivo',
  templateUrl: './alta-dispositivo.component.html',
  styleUrl: './alta-dispositivo.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaDispositivoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public dispositivoForm: FormGroup;
  public idDispositivo: number;
  public title = 'Agregar Dispositivo';
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private route: Router, 
    private fb: FormBuilder, 
    private dispoService: DispositivosService,
    private activatedRouted: ActivatedRoute,
  ) {

  }

  ngOnInit(): void {
    this.initForm()
    this.activatedRouted.params.subscribe(
      (params) => {
        this.idDispositivo = params['idDispositivo'];
        if (this.idDispositivo) {
          this.title = 'Actualizar Dispositivo';
          this.obtenerDispositivoID();
        }
      }
    )

  }

  obtenerDispositivoID() {
    this.dispoService.obtenerDispositivo(this.idDispositivo).subscribe(
      (response: any) => {
        this.dispositivoForm.patchValue({
          NumeroSerie: response.dispositivo.NumeroSerie,
          Marca: response.dispositivo.Marca,
          Modelo: response.dispositivo.Modelo,
          Estatus: response.dispositivo.Estatus,
        });
      }
    );
  }

  initForm() {
    this.dispositivoForm = this.fb.group({
      NumeroSerie: ['', Validators.required],
      Marca: ['', Validators.required],
      Modelo: ['', Validators.required],
      Estatus: [1, Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idDispositivo) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.dispositivoForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any =
      {
        NumeroSerie: 'Número de Serie',
        Marca: 'Marca',
        Modelo: 'Modelo',
        Estatus: 'Estatus',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.dispositivoForm.controls).forEach(key => {
        const control = this.dispositivoForm.get(key);
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
          popup: 'swal2-padding swal2-border'
        }
      });
      return;
    }
    this.dispositivoForm.removeControl('id');
    this.dispoService.agregarDispositivo(this.dispositivoForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Se agregó un nuevo dispositivo de manera exitosa.`,
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
          text: `Ocurrió un error al agregar el dispositivo.`,
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
    if (this.dispositivoForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any =
      {
        NumeroSerie: 'Número de Serie',
        Marca: 'Marca',
        Modelo: 'Modelo',
        Estatus: 'Estatus',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.dispositivoForm.controls).forEach(key => {
        const control = this.dispositivoForm.get(key);
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
          popup: 'swal2-padding swal2-border'
        }
      });
    }
    this.dispoService.actualizarDispositivo(this.idDispositivo, this.dispositivoForm.value).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Los datos del dispositivo se actualizaron correctamente.`,
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
          text: `Ocurrió un error al actualizar el dispositivo.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/dispositivos');
  }

}
