import { Component, OnInit } from '@angular/core';

import { Subscription } from "rxjs/Subscription";

import { MapsService } from "../../maps.service";
import { Map } from "../../models/map.model";

@Component({
  selector: 'app-map-metadata',
  templateUrl: './map-properties.component.html',
  styleUrls: ['./map-properties.component.scss']
})
export class MapPropertiesComponent implements OnInit {
  map: Map;
  mapSubscription: Subscription;
  constructor(private mapsService: MapsService) { }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.map = map;
    });
  }

  archiveMap() {
    this.mapsService.archive(this.map.id).subscribe(() => {
      this.map.archived = true;
      this.mapsService.setCurrentMap(this.map);
    });
  }

}
