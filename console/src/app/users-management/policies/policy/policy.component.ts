import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  toggleWholePolicy(newValue: boolean) {
    console.log('toggleWholePolicy', newValue);
    throw new Error('not implemented');
  }

  togglePermission(permissionName: string, newValue: boolean) {
    console.log('permissionName', newValue);
    throw new Error('not implemented');
  }

}
