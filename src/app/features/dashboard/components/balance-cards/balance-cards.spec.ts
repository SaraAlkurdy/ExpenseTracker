import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceCards } from './balance-cards';

describe('BalanceCards', () => {
  let component: BalanceCards;
  let fixture: ComponentFixture<BalanceCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
