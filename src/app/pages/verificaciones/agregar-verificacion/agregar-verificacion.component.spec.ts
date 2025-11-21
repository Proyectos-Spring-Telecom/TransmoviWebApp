import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarVerificacionComponent } from './agregar-verificacion.component';

describe('AgregarVerificacionComponent', () => {
  let component: AgregarVerificacionComponent;
  let fixture: ComponentFixture<AgregarVerificacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarVerificacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarVerificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
