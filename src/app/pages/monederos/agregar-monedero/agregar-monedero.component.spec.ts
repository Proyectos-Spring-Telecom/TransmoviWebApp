import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarMonederoComponent } from './agregar-monedero.component';

describe('AgregarMonederoComponent', () => {
  let component: AgregarMonederoComponent;
  let fixture: ComponentFixture<AgregarMonederoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarMonederoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarMonederoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
