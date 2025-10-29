import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionDipositivoInstalacionComponent } from './recaudacion-dipositivo-instalacion.component';

describe('RecaudacionDipositivoInstalacionComponent', () => {
  let component: RecaudacionDipositivoInstalacionComponent;
  let fixture: ComponentFixture<RecaudacionDipositivoInstalacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionDipositivoInstalacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecaudacionDipositivoInstalacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
