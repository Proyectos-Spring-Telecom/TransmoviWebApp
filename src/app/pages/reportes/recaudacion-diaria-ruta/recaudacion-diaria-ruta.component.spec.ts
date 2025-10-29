import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionDiariaRutaComponent } from './recaudacion-diaria-ruta.component';

describe('RecaudacionDiariaRutaComponent', () => {
  let component: RecaudacionDiariaRutaComponent;
  let fixture: ComponentFixture<RecaudacionDiariaRutaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionDiariaRutaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecaudacionDiariaRutaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
