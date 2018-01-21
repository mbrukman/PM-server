import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-map-environment-pane',
  templateUrl: './map-environment-pane.component.html',
  styleUrls: ['./map-environment-pane.component.scss']
})
export class MapEnvironmentPaneComponent implements OnInit {
  tab: string = 'plugins';
  constructor() { }

  ngOnInit() {
  }

}
