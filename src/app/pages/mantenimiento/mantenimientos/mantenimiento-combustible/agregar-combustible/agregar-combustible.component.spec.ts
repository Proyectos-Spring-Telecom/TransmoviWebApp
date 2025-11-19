import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarCombustibleComponent } from './agregar-combustible.component';

describe('AgregarCombustibleComponent', () => {
  let component: AgregarCombustibleComponent;
  let fixture: ComponentFixture<AgregarCombustibleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarCombustibleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarCombustibleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
