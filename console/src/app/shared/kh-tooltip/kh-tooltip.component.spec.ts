import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KhTooltipComponent } from './kh-tooltip.component';

describe('KhTooltipComponent', () => {
  let component: KhTooltipComponent;
  let fixture: ComponentFixture<KhTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KhTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KhTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
