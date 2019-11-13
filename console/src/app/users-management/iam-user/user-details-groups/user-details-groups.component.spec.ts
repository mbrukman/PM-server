import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailsGroupsComponent } from './user-details-groups.component';

describe('UserDetailsGroupsComponent', () => {
  let component: UserDetailsGroupsComponent;
  let fixture: ComponentFixture<UserDetailsGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserDetailsGroupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDetailsGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
