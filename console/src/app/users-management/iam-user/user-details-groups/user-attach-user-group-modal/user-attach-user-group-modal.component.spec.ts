import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAttachUserGroupModalComponent } from './user-attach-user-group-modal.component';

describe('UserAttachUserGroupModalComponent', () => {
  let component: UserAttachUserGroupModalComponent;
  let fixture: ComponentFixture<UserAttachUserGroupModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserAttachUserGroupModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAttachUserGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
