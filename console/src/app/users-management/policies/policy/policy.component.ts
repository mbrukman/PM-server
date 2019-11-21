import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {

  public policyToggled: Subject<boolean> = new Subject<boolean>();

  constructor() { }

  ngOnInit() {
  }

  toggleWholePolicy(newValue: boolean) {
    console.log(newValue);
    this.policyToggled.next(newValue);
  }

  togglePermission(permissionName: string, newValue: boolean) {
    console.log(permissionName, newValue);
    throw new Error('not implemented');
  }

}
