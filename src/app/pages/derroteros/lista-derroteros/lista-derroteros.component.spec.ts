import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaDerroterosComponent } from './lista-derroteros.component';

describe('ListaDerroterosComponent', () => {
  let component: ListaDerroterosComponent;
  let fixture: ComponentFixture<ListaDerroterosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDerroterosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaDerroterosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
