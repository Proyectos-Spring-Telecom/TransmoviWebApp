import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DerroterosService } from 'src/app/shared/services/derroteros.service';
import { TarifasService } from 'src/app/shared/services/tarifa.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-tarifa',
  templateUrl: './agregar-tarifa.component.html',
  styleUrl: './agregar-tarifa.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarTarifaComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public tarifaForm: FormGroup;
  public idTarifa: number;
  public title = 'Agregar Tarifa';
  public listaDerroteros: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;
  listaTipoTarifa = [
    { id: 0, nombre: 'Estacionaria' },
    { id: 1, nombre: 'Incremental' },
  ];
  displayDerrotero = (d: any) => (d ? d.nombreDerrotero : '');

  constructor(
    private fb: FormBuilder,
    private tarSerice: TarifasService,
    private activatedRouted: ActivatedRoute,
    private derroService: DerroterosService,
    private route: Router
  ) { }

  ngOnInit(): void {
    this.obtenerDerroteros();
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idTarifa = params['idTarifa'];
      if (this.idTarifa) {
        this.title = 'Actualizar Tarifa';
        this.obtenerTarifa();
      }
    });
  }

  obtenerDerroteros() {
    this.derroService.obtenerDerroteros().subscribe((response) => {
      this.listaDerroteros = response.data;
    });
  }

  private toNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  onTarifaFocus(): void {
    const c = this.tarifaForm.get('tarifaBase');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onTarifaBlur(): void {
    const c = this.tarifaForm.get('tarifaBase');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      c.setValue('');
      return;
    }
    c.setValue(`$${num.toFixed(2)}`);
  }

  onCostoFocus(): void {
    const c = this.tarifaForm.get('costoAdicional');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onCostoBlur(): void {
    const c = this.tarifaForm.get('costoAdicional');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      c.setValue('');
      return;
    }
    c.setValue(`$${num.toFixed(2)}`);
  }

  onDistanciaFocus(): void {
    const c = this.tarifaForm.get('distanciaBaseKm');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9]/g, ''));
  }

  onDistanciaBlur(): void {
    const c = this.tarifaForm.get('distanciaBaseKm');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9]/g, '');
    if (!raw) {
      c.setValue('');
      return;
    }
    c.setValue(`${raw} km`);
  }

  onIncrementoFocus(): void {
    const c = this.tarifaForm.get('incrementoCadaMetros');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9]/g, ''));
  }

  onIncrementoBlur(): void {
    const c = this.tarifaForm.get('incrementoCadaMetros');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9]/g, '');
    if (!raw) {
      c.setValue('');
      return;
    }
    c.setValue(`${raw} m`);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // Permitir solo enteros
  allowInteger(event: KeyboardEvent): void {
    const key = event.key;
    // permitir controles
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key))
      return;
    // permitir solo dígitos
    if (!/^[0-9]$/.test(key)) event.preventDefault();
  }

  // Permitir decimales con un solo punto o coma
  allowDecimal(event: KeyboardEvent): void {
    const key = event.key;
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key))
      return;
    const target = event.target as HTMLInputElement;
    // dígitos
    if (/^[0-9]$/.test(key)) return;
    // punto o coma solo una vez
    if ((key === '.' || key === ',') && !/[.,]/.test(target.value)) return;
    event.preventDefault();
  }

  // Parser común para enviar solo números
  private parseNumeric(value: any): number | null {
    if (value === null || value === undefined) return null;
    const raw = value
      .toString()
      .replace(/[^0-9.,-]/g, '')
      .replace(',', '.');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }

  // Si quieres que el formulario también quede en number antes de enviar:
  private normalizeFormToNumbers(): void {
    const v = this.tarifaForm.value;
    this.tarifaForm.patchValue(
      {
        tarifaBase: this.parseNumeric(v.tarifaBase),
        distanciaBaseKm: this.parseNumeric(v.distanciaBaseKm),
        incrementoCadaMetros: this.parseNumeric(v.incrementoCadaMetros),
        costoAdicional: this.parseNumeric(v.costoAdicional),
      },
      { emitEvent: false }
    );
  }

  obtenerTarifa() {
    this.tarSerice.obtenerTarifa(this.idTarifa).subscribe({
      next: (response: any) => {
        const data = response?.data;

        const item = Array.isArray(data)
          ? data.find((x: any) => Number(x?.id) === Number(this.idTarifa)) ?? data[0]
          : data;

        if (!item) return;

        const tipoTarifa = this.toNumber(
          item.tipoTarifa ??
          item.TipoTarifa ??
          item.idTipoTarifa ??
          item.IdTipoTarifa
        );

        const dto = {
          tipoTarifa: tipoTarifa,
          tarifaBase: this.toNumber(item.tarifaBase ?? item.TarifaBase),
          distanciaBaseKm: this.toNumber(item.distanciaBaseKm ?? item.DistanciaBaseKm),
          incrementoCadaMetros: this.toNumber(item.incrementoCadaMetros ?? item.IncrementoCadaMetros),
          costoAdicional: this.toNumber(item.costoAdicional ?? item.CostoAdicional),
          estatus: this.toNumber(item.estatus ?? item.estatusTarifa) ?? 1,
          idDerrotero: this.toNumber(item.idDerrotero ?? item.idderrotero),
        };

        this.tarifaForm.patchValue(
          {
            tipoTarifa: dto.tipoTarifa,
            tarifaBase:
              dto.tarifaBase != null && !isNaN(dto.tarifaBase)
                ? dto.tarifaBase.toString()
                : '',
            distanciaBaseKm:
              dto.distanciaBaseKm != null && !isNaN(dto.distanciaBaseKm)
                ? dto.distanciaBaseKm.toString()
                : '',
            incrementoCadaMetros:
              dto.incrementoCadaMetros != null && !isNaN(dto.incrementoCadaMetros)
                ? dto.incrementoCadaMetros.toString()
                : '',
            costoAdicional:
              dto.costoAdicional != null && !isNaN(dto.costoAdicional)
                ? dto.costoAdicional.toString()
                : '',
            estatus: dto.estatus,
            idDerrotero: dto.idDerrotero,
          },
          { emitEvent: false }
        );

        this.onTarifaBlur();
        this.onCostoBlur();
        this.onDistanciaBlur();
        this.onIncrementoBlur();

        this.actualizarCamposPorTipoTarifa(dto.tipoTarifa);

        const derroteroCtrl = this.tarifaForm.get('idDerrotero');
        if (derroteroCtrl && dto.idDerrotero != null && !isNaN(dto.idDerrotero)) {
          derroteroCtrl.disable({ emitEvent: false });
        }
      },
      error: (e) => {
        console.error('Error obtenerTarifa', e);
      },
    });
  }

  private actualizarCamposPorTipoTarifa(tipo: any): void {
    let tipoNum: number;

    if (tipo !== null && typeof tipo === 'object') {
      tipoNum = this.toNum(
        (tipo as any).id ??
        (tipo as any).Id ??
        (tipo as any).value ??
        (tipo as any).valor
      );
    } else {
      tipoNum = this.toNum(tipo);
    }

    const tarifaBaseCtrl = this.tarifaForm.get('tarifaBase');
    const distanciaBaseCtrl = this.tarifaForm.get('distanciaBaseKm');
    const incrementoMetrosCtrl = this.tarifaForm.get('incrementoCadaMetros');
    const costoAdicionalCtrl = this.tarifaForm.get('costoAdicional');

    if (!tarifaBaseCtrl || !distanciaBaseCtrl || !incrementoMetrosCtrl || !costoAdicionalCtrl) {
      return;
    }

    if (tipoNum === 0) {
      tarifaBaseCtrl.enable({ emitEvent: false });

      distanciaBaseCtrl.disable({ emitEvent: false });
      distanciaBaseCtrl.setValue(null, { emitEvent: false });

      incrementoMetrosCtrl.disable({ emitEvent: false });
      incrementoMetrosCtrl.setValue(null, { emitEvent: false });

      costoAdicionalCtrl.disable({ emitEvent: false });
      costoAdicionalCtrl.setValue(null, { emitEvent: false });

    } else if (tipoNum === 1) {
      tarifaBaseCtrl.enable({ emitEvent: false });
      distanciaBaseCtrl.enable({ emitEvent: false });
      incrementoMetrosCtrl.enable({ emitEvent: false });
      costoAdicionalCtrl.enable({ emitEvent: false });

    } else {
      tarifaBaseCtrl.disable({ emitEvent: false });
      tarifaBaseCtrl.setValue(null, { emitEvent: false });

      distanciaBaseCtrl.disable({ emitEvent: false });
      distanciaBaseCtrl.setValue(null, { emitEvent: false });

      incrementoMetrosCtrl.disable({ emitEvent: false });
      incrementoMetrosCtrl.setValue(null, { emitEvent: false });

      costoAdicionalCtrl.disable({ emitEvent: false });
      costoAdicionalCtrl.setValue(null, { emitEvent: false });
    }
  }

  private toNum(v: any): number {
    if (v === null || v === undefined) return NaN;
    if (typeof v === 'string') v = v.replace(',', '.').trim();
    return Number(v);
  }

  initForm() {
    this.tarifaForm = this.fb.group({
      tipoTarifa: [null, Validators.required],
      tarifaBase: [null, Validators.required],
      distanciaBaseKm: [null, Validators.required],
      incrementoCadaMetros: [null, Validators.required],
      costoAdicional: [null, Validators.required],
      estatus: [1, Validators.required],
      idDerrotero: [null, Validators.required],
    });

    const campos = ['tarifaBase', 'distanciaBaseKm', 'incrementoCadaMetros', 'costoAdicional'];
    campos.forEach(nombre => {
      this.tarifaForm.get(nombre)?.disable({ emitEvent: false });
    });

    const tipoCtrl = this.tarifaForm.get('tipoTarifa');
    if (tipoCtrl) {
      tipoCtrl.valueChanges.subscribe(v => this.actualizarCamposPorTipoTarifa(v));
    }
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idTarifa) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.tarifaForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: Record<string, string> = {
        tipoTarifa: 'Tipo Tarifa',
        tarifaBase: 'Tarifa Base',
        distanciaBaseKm: 'Distancia Base',
        incrementoCadaMetros: 'Incremento de Distancia por Metro',
        costoAdicional: 'Costo por Incremento',
        estatus: 'Estatus',
        idDerrotero: 'Derrotero',
      };

      const faltantes: string[] = [];
      Object.keys(this.tarifaForm.controls).forEach((key) => {
        const control = this.tarifaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          faltantes.push(etiquetas[key] || key);
        }
      });

      const lista = faltantes
        .map(
          (campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
      </div>
    `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Completa los siguientes campos antes de continuar:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const v = this.tarifaForm.value;
    const tipoTarifaNum = this.toNum(v.tipoTarifa);
    const esEstacionaria = tipoTarifaNum === 0;

    const payload = {
      tipoTarifa: tipoTarifaNum,
      tarifaBase: this.parseNumeric(v.tarifaBase),
      distanciaBaseKm: esEstacionaria ? null : this.parseNumeric(v.distanciaBaseKm),
      incrementoCadaMetros: esEstacionaria ? null : this.parseNumeric(v.incrementoCadaMetros),
      costoAdicional: esEstacionaria ? null : this.parseNumeric(v.costoAdicional),
      estatus: this.toNum(v.estatus),
      idDerrotero: this.toNum(v.idDerrotero),
    };

    this.tarSerice.agregarTarifa(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó una nueva tarifa de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: error.error,
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

    if (this.tarifaForm.invalid) {
      this.submitButton = 'Actualizar';
      this.loading = false;

      const etiquetas: Record<string, string> = {
        tipoTarifa: 'Tipo Tarifa',
        tarifaBase: 'Tarifa Base',
        distanciaBaseKm: 'Distancia Base',
        incrementoCadaMetros: 'Incremento de Distancia por Metro',
        costoAdicional: 'Costo por Incremento',
        estatus: 'Estatus',
        idDerrotero: 'Derrotero',
      };

      const faltantes: string[] = [];
      Object.keys(this.tarifaForm.controls).forEach((key) => {
        const control = this.tarifaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          faltantes.push(etiquetas[key] || key);
        }
      });

      const lista = faltantes
        .map(
          (campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
      </div>
    `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Completa los siguientes campos antes de continuar:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const v = this.tarifaForm.getRawValue();      // incluye idDerrotero aunque esté disabled
    const tipoTarifaNum = this.toNum(v.tipoTarifa);
    const esEstacionaria = tipoTarifaNum === 0;

    const payload = {
      tipoTarifa: tipoTarifaNum,                                 // ✅ AHORA SÍ SE MANDA EN UPDATE
      tarifaBase: this.parseNumeric(v.tarifaBase),
      distanciaBaseKm: esEstacionaria ? null : this.parseNumeric(v.distanciaBaseKm),
      incrementoCadaMetros: esEstacionaria ? null : this.parseNumeric(v.incrementoCadaMetros),
      costoAdicional: esEstacionaria ? null : this.parseNumeric(v.costoAdicional),
      estatus: this.toNum(v.estatus),
      idDerrotero: this.toNum(v.idDerrotero),
    };

    this.tarSerice.actualizarTarifa(this.idTarifa, payload).subscribe(
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos de la tarifa se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error: any) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/tarifas');
  }

  moneyKeydown(e: KeyboardEvent) {
    const allowed = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End',
    ];
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
    this.tarifaForm.get('tarifaBase')?.setValue(v, { emitEvent: false });
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
    this.tarifaForm.get('tarifaBase')?.setValue(v, { emitEvent: false });
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
    this.tarifaForm.get('tarifaBase')?.setValue(v, { emitEvent: false });
  }

  costoKeydown(e: KeyboardEvent) {
    const allowed = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End',
    ];
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

  costoInput(e: Event) {
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
    this.tarifaForm.get('costoAdicional')?.setValue(v, { emitEvent: false });
  }

  costoPaste(e: ClipboardEvent) {
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
    this.tarifaForm.get('costoAdicional')?.setValue(v, { emitEvent: false });
  }

  costoBlur(e: FocusEvent) {
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
    this.tarifaForm.get('costoAdicional')?.setValue(v, { emitEvent: false });
  }

  incrementoKeydown(e: KeyboardEvent) {
    const allowed = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End',
    ];
    if (allowed.includes(e.key)) return;
    const input = e.target as HTMLInputElement;
    const value = input.value || '';
    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  incrementoInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    input.value = v;
    this.tarifaForm
      .get('incrementoCadaMetros')
      ?.setValue(v, { emitEvent: false });
  }

  incrementoPaste(e: ClipboardEvent) {
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
    input.value = v;
    this.tarifaForm
      .get('incrementoCadaMetros')
      ?.setValue(v, { emitEvent: false });
  }

  distanciaKeydown(e: KeyboardEvent) {
    const allowed = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End',
    ];
    if (allowed.includes(e.key)) return;
    const input = e.target as HTMLInputElement;
    const value = input.value || '';
    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  distanciaInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    input.value = v;
    this.tarifaForm.get('distanciaBaseKm')?.setValue(v, { emitEvent: false });
  }

  distanciaPaste(e: ClipboardEvent) {
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
    input.value = v;
    this.tarifaForm.get('distanciaBaseKm')?.setValue(v, { emitEvent: false });
  }
}
