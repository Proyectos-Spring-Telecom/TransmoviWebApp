import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPasajerosComponent } from './lista-pasajeros.component';

describe('ListaPasajerosComponent', () => {
  let component: ListaPasajerosComponent;
  let fixture: ComponentFixture<ListaPasajerosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPasajerosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaPasajerosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
