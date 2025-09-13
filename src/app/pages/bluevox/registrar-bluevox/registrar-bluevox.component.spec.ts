import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarBluevoxComponent } from './registrar-bluevox.component';

describe('RegistrarBluevoxComponent', () => {
  let component: RegistrarBluevoxComponent;
  let fixture: ComponentFixture<RegistrarBluevoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarBluevoxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistrarBluevoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
