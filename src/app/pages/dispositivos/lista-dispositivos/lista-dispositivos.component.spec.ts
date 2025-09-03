import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaDispositivosComponent } from './lista-dispositivos.component';

describe('ListaDispositivosComponent', () => {
  let component: ListaDispositivosComponent;
  let fixture: ComponentFixture<ListaDispositivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDispositivosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaDispositivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
