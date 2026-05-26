import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Examenes } from './examenes';

describe('Examenes', () => {
  let component: Examenes;
  let fixture: ComponentFixture<Examenes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Examenes],
    }).compileComponents();

    fixture = TestBed.createComponent(Examenes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
