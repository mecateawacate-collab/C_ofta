import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Solicitar } from './solicitar';

describe('Solicitar', () => {
  let component: Solicitar;
  let fixture: ComponentFixture<Solicitar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Solicitar],
    }).compileComponents();

    fixture = TestBed.createComponent(Solicitar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
