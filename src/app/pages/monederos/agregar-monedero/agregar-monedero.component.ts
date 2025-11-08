import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-monedero',
  templateUrl: './agregar-monedero.component.html',
  styleUrl: './agregar-monedero.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarMonederoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public monederoForm: FormGroup;
  public idMonedero: number;
  public title = 'Agregar Monedero';
  public listaClientes: any;
  public listaPasajeros: any;
  public showDatosID = true;
  public idCliente: any;
  selectedFileName: string = '';
  displayPasajero = (p: any) => p ? `${p.nombre ?? ''} ${p.apellidoPaterno ?? ''} ${p.apellidoMaterno ?? ''}`.trim() : '';
  displayCliente = (c: any) => c ? `${c.nombre ?? ''} ${c.apellidoPaterno ?? ''} ${c.apellidoMaterno ?? ''}`.trim() : '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private route: Router,
    private fb: FormBuilder,
    private dispoService: DispositivosService,
    private activatedRouted: ActivatedRoute,
    private clieService: ClientesService,
    private moneService: MonederosServices,
    private pasaService: PasajerosService,
    private users: AuthenticationService,
  ) {
    const user = this.users.getUser();
    this.idCliente = Number(user.idCliente);
  }

  ngOnInit(): void {
    this.obtenerClientes();
    this.initForm();
    this.obtenerPasajeros()
    this.activatedRouted.params.subscribe((params) => {
      this.idMonedero = params['idMonedero'];
      if (this.idMonedero) {
        this.title = 'Actualizar Monedero';
        this.obtenerMonedero();
        this.showDatosID = false;

        const saldoCtrl = this.monederoForm.get('saldo');
        saldoCtrl?.clearValidators();
        saldoCtrl?.updateValueAndValidity();
      }
    });
  }

  obtenerPasajeros() {
    this.pasaService.obtenerPasajeroClienteId(this.idCliente).subscribe((response) => {
      this.listaPasajeros = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c?.id ?? c?.Id ?? c?.ID),
      }));
    })
  }

  displayTipoPasajero = (t: any) => t ? `${t.nombre} (${t.cantidad})` : '';


  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c?.id ?? c?.Id ?? c?.ID),
      }));
    });
  }

  obtenerMonedero() {
    this.moneService.obtenerMonedero(this.idMonedero).subscribe((response) => {
      this.monederoForm.patchValue({
        numeroSerie: response.data.numeroSerie,
        idPasajero: Number(response.data.idPasajero),
        idCliente: Number(response.data.idCliente),
        // saldo: Number(response.data.saldo)
      });
    })
  }

  initForm() {
    this.monederoForm = this.fb.group({
      numeroSerie: ['', Validators.required],
      saldo: [null, Validators.required],
      estatus: [1, Validators.required],
      idPasajero: [null],
      idCliente: [null, Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idMonedero) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  onComisionFocus(): void {
    const c = this.monederoForm.get('saldo');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onComisionBlur(): void {
    const c = this.monederoForm.get('saldo');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) { c.setValue(''); return; }
    c.setValue(`$${num.toFixed(2)}`);
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.monederoForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        numeroSerie: 'Número de Serie',
        saldo: 'Saldo',
        estatus: 'Estatus',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.monederoForm.controls).forEach((key) => {
        const control = this.monederoForm.get(key);
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
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }

    const raw = this.monederoForm.getRawValue();
    const payload: any = { ...raw };

    const s = String(raw.saldo ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
    const n = parseFloat(s);
    if (!Number.isFinite(n)) {
      this.submitButton = 'Guardar';
      this.loading = false;
      Swal.fire({
        title: 'Saldo inválido',
        background: '#002136',
        text: 'Verifica el campo Saldo.',
        icon: 'error',
        confirmButtonText: 'Entendido',
      });
      return;
    }
    payload.saldo = Number(n.toFixed(2));

    this.monederoForm.removeControl('id');
    this.moneService.agregarMonedero(payload).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo monedero de manera exitosa.`,
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
          text: `Ocurrió un error al agregar el monedero.`,
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

    if (this.monederoForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        numeroSerie: 'Número de Serie',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.monederoForm.controls).forEach((key) => {
        const control = this.monederoForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
      </div>
    `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
          Por favor complétalos antes de continuar:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const raw = this.monederoForm.getRawValue();
    const payload: any = { ...raw };

    const saldoStr = raw.saldo != null ? String(raw.saldo).trim() : '';
    if (saldoStr !== '') {
      const s = saldoStr.replace(',', '.').replace(/[^0-9.]/g, '');
      const n = parseFloat(s);
      if (!Number.isFinite(n)) {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: 'Saldo inválido',
          background: '#002136',
          text: 'Verifica el campo Saldo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
        });
        return;
      }
      payload.saldo = Number(n.toFixed(2));
    } else {
      delete payload.saldo;
    }

    this.moneService.actualizarMonedero(this.idMonedero, payload).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del monedero se actualizaron correctamente.`,
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
          text: `Ocurrió un error al actualizar el monedero.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/monederos');
  }

  private toNumber2dec(value: any): number {
    if (value === null || value === undefined) throw new Error('Saldo inválido');
    const s = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
    if (!s) throw new Error('Saldo vacío');
    const n = parseFloat(s);
    if (!Number.isFinite(n)) throw new Error('Saldo no numérico');
    return Number(n.toFixed(2));
  }


  moneyKeydown(e: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    const input = e.target as HTMLInputElement;
    const value = input.value || '';
    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    const selStart = input.selectionStart ?? value.length;
    const selEnd = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, selStart) + e.key + value.slice(selEnd);
    const parts = newValue.split('.');
    if (parts[1] && parts[1].length > 2) e.preventDefault();
  }

  moneyInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);
    input.value = v;
    this.monederoForm.get('saldo')?.setValue(v, { emitEvent: false });
  }

  moneyPaste(e: ClipboardEvent) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const text = (e.clipboardData?.getData('text') || '').replace(',', '.');

    let v = text.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);

    input.value = v;
    this.monederoForm.get('saldo')?.setValue(v, { emitEvent: false });
  }

  moneyBlur(e: FocusEvent) {
    const input = e.target as HTMLInputElement;
    let v = input.value;
    if (!v) return;
    if (/^\d+$/.test(v)) {
      v = v + '.00';
    } else if (/^\d+\.\d$/.test(v)) {
      v = v + '0';
    } else if (/^\d+\.\d{2}$/.test(v)) {
    } else {
      v = v.replace(',', '.').replace(/[^0-9.]/g, '');
      const parts = v.split('.');
      v = parts[0] + (parts[1] ? '.' + parts[1].slice(0, 2) : '.00');
      if (/^\d+$/.test(v)) v = v + '.00';
      if (/^\d+\.\d$/.test(v)) v = v + '0';
    }
    input.value = v;
    this.monederoForm.get('saldo')?.setValue(v, { emitEvent: false });
  }
}
