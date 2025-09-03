import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaMonederosComponent } from './lista-monederos.component';

describe('ListaMonederosComponent', () => {
  let component: ListaMonederosComponent;
  let fixture: ComponentFixture<ListaMonederosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaMonederosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaMonederosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
