import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaUsuarioComponent } from './alta-usuario.component';

describe('AltaUsuarioComponent', () => {
  let component: AltaUsuarioComponent;
  let fixture: ComponentFixture<AltaUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaUsuarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
