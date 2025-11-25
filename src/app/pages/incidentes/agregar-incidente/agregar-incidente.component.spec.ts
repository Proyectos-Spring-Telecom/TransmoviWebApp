import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarIncidenteComponent } from './agregar-incidente.component';

describe('AgregarIncidenteComponent', () => {
  let component: AgregarIncidenteComponent;
  let fixture: ComponentFixture<AgregarIncidenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarIncidenteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarIncidenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
