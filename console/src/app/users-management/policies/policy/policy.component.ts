import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { IAMPolicy } from '@app/services/iam-policy/iam-policy.interface';
import { IAMPermissions } from '@app/services/iam-policy/iam-permissions.interface';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent {

  public toggleCheckboxes: Subject<boolean> = new Subject<boolean>();
  @Input() name: String;
  @Input() permissions: IAMPermissions = { create: false, read: false, update: false, remove: false };
  @Input() policy: Subject<IAMPolicy>;
  constructor() { }

  get wholePolicyTrue() {
    return this.permissions.create && this.permissions.read && this.permissions.update && this.permissions.remove;
  }

  toggleWholePolicy(newValue: boolean) {
    this.toggleCheckboxes.next(newValue);
    for (const permissionName in this.permissions) {
      if (this.permissions.hasOwnProperty(permissionName)) {
        this.togglePermission(permissionName, newValue);
      }
    }
  }

  togglePermission(permissionName: string, newValue: boolean) {
    this.permissions[permissionName] = newValue;
    this.policy.next({ permissions: this.permissions });
  }

}
