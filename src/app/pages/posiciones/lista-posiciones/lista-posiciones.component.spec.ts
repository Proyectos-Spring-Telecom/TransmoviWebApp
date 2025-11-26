import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPosicionesComponent } from './lista-posiciones.component';

describe('ListaPosicionesComponent', () => {
  let component: ListaPosicionesComponent;
  let fixture: ComponentFixture<ListaPosicionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPosicionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaPosicionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
