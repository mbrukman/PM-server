import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { BasicPermissions } from '@app/services/interfaces/basic-permissions.interface';
import { BasicPolicy } from '@app/services/interfaces/basic-policy.interface';

@Component({
  selector: 'app-basic-policy',
  templateUrl: './basic-policy.component.html',
  styleUrls: ['./basic-policy.component.scss']
})
export class BasicPolicyComponent {

  public toggleCheckboxes: Subject<boolean> = new Subject<boolean>();
  @Input() name: String;
  @Input() permissions: BasicPermissions = { create: false, read: false, update: false, remove: false };
  @Input() policy: Subject<BasicPolicy>;
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
