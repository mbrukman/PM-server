import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserGroupDetailsUsersComponent } from './user-group-details-users.component';

describe('UserGroupDetailsUsersComponent', () => {
  let component: UserGroupDetailsUsersComponent;
  let fixture: ComponentFixture<UserGroupDetailsUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserGroupDetailsUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserGroupDetailsUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
