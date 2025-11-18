import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarKilometrajeComponent } from './agregar-kilometraje.component';

describe('AgregarKilometrajeComponent', () => {
  let component: AgregarKilometrajeComponent;
  let fixture: ComponentFixture<AgregarKilometrajeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarKilometrajeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarKilometrajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
