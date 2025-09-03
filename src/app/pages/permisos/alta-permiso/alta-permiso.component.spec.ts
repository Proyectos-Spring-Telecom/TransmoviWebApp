import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaPermisoComponent } from './alta-permiso.component';

describe('AltaPermisoComponent', () => {
  let component: AltaPermisoComponent;
  let fixture: ComponentFixture<AltaPermisoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaPermisoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaPermisoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
