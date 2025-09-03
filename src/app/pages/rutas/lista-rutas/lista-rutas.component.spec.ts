import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaRutasComponent } from './lista-rutas.component';

describe('ListaRutasComponent', () => {
  let component: ListaRutasComponent;
  let fixture: ComponentFixture<ListaRutasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaRutasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaRutasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
