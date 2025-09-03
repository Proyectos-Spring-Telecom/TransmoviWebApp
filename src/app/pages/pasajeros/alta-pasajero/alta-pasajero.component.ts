import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-pasajero',
  templateUrl: './alta-pasajero.component.html',
  styleUrl: './alta-pasajero.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaPasajeroComponent implements OnInit {

  public submitButton: string = 'Guardar';
    public loading: boolean = false;
    public pasajeroForm: FormGroup;
    public idPasajero: number;
    public title = 'Agregar Pasajero';
    selectedFileName: string = '';
    previewUrl: string | ArrayBuffer | null = null;
  
    constructor(
      private fb: FormBuilder,
      private modalService: NgbModal,
      private pasajService: PasajerosService,
      private activatedRouted: ActivatedRoute,
      private route: Router
    ) { }
  
    ngOnInit(): void {
      this.initForm()
      this.activatedRouted.params.subscribe(
        (params) => {
          this.idPasajero = params['idPasajero'];
          if (this.idPasajero) {
            this.title = 'Actualizar Pasajero';
            this.obtenerPasajeroID();
          }
        }
      )
    }
  
    obtenerPasajeroID() {
      this.pasajService.obtenerPasajero(this.idPasajero).subscribe(
        (response: any) => {
          const fecha = response.pasajero.FechaNacimiento
            ? response.pasajero.FechaNacimiento.split('T')[0]
            : '';
          this.pasajeroForm.patchValue({
            Estatus: response.pasajero.Estatus,
            Nombre: response.pasajero.Nombre,
            ApellidoPaterno: response.pasajero.ApellidoPaterno,
            ApellidoMaterno: response.pasajero.ApellidoMaterno,
            Telefono: response.pasajero.Telefono,
            Correo: response.pasajero.Correo,
            FechaNacimiento: fecha,
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
  
    initForm() {
      this.pasajeroForm = this.fb.group({
        Nombre: ['', Validators.required],
        ApellidoPaterno: ['', Validators.required],
        ApellidoMaterno: ['', Validators.required],
        FechaNacimiento: ['', Validators.required],
        Correo: ['', [Validators.required, Validators.email]],
        Telefono: ['', Validators.required],
        Estatus: [1, Validators.required],
      });
    }
  
    submit() {
      this.submitButton = 'Cargando...';
      this.loading = true;
      if (this.idPasajero) {
        this.actualizar();
      } else {
        this.agregar();
      }
    }
  
    agregar() {
      this.submitButton = 'Cargando...';
      this.loading = true;
      if (this.pasajeroForm.invalid) {
        this.submitButton = 'Guardar';
        this.loading = false;
        const etiquetas: any = {
          Nombre: 'Nombre',
          ApellidoPaterno: ' Apellido Paterno',
          ApellidoMaterno: 'Apellido Materno',
          FechaNacimiento: 'Fecha de Nacimiento',
          Correo: 'Correo Electrónico',
          Telefono: 'Teléfono',
        };
  
        const camposFaltantes: string[] = [];
        Object.keys(this.pasajeroForm.controls).forEach(key => {
          const control = this.pasajeroForm.get(key);
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
      this.pasajeroForm.removeControl('id');
      this.pasajService.agregarPasajero(this.pasajeroForm.value).subscribe(
        (response) => {
          this.submitButton = 'Guardar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#22252f',
            text: `Se agregó un nuevo pasajero de manera exitosa.`,
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
            text: `Ocurrió un error al agregar el pasajero.`,
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
      if (this.pasajeroForm.invalid) {
        this.submitButton = 'Guardar';
        this.loading = false;
        const etiquetas: any = {
          Nombre: 'Nombre',
          ApellidoPaterno: ' Apellido Paterno',
          ApellidoMaterno: 'Apellido Materno',
          FechaNacimiento: 'Fecha de Nacimiento',
          Correo: 'Correo Electrónico',
          Telefono: 'Teléfono',
        };
  
        const camposFaltantes: string[] = [];
        Object.keys(this.pasajeroForm.controls).forEach(key => {
          const control = this.pasajeroForm.get(key);
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
      this.pasajService.actualizarPasajero(this.idPasajero, this.pasajeroForm.value).subscribe(
        (response) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#22252f',
            text: `Los datos del pasajero se actualizaron correctamente.`,
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
            text: `Ocurrió un error al actualizar el pasajero.`,
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      );
    }
  
    regresar() {
      this.route.navigateByUrl('/pasajeros')
    }

}
