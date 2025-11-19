import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarTallerComponent } from './agregar-taller.component';

describe('AgregarTallerComponent', () => {
  let component: AgregarTallerComponent;
  let fixture: ComponentFixture<AgregarTallerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarTallerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarTallerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
