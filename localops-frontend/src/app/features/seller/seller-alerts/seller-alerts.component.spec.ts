import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerAlertsComponent } from './seller-alerts.component';

describe('SellerAlertsComponent', () => {
  let component: SellerAlertsComponent;
  let fixture: ComponentFixture<SellerAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerAlertsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SellerAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
