import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MapsService } from "../../maps.service";
import { Subscription } from "rxjs/Subscription";
import { Map } from "../../models/map.model";
import { MapStructure } from "../../models/map-structure.model";
import { MapDesignService } from "./map-design.service";

@Component({
  selector: 'app-map-edit',
  templateUrl: './map-edit.component.html',
  styleUrls: ['./map-edit.component.scss'],
  providers: [MapDesignService]
})
export class MapEditComponent implements OnInit, OnDestroy {
  mapStructure: MapStructure;
  map: Map;
  mapSubscription: Subscription;
  mapStructureSubscription: Subscription;
  tab: string;
  @ViewChild('wrapper') wrapper: ElementRef;

  constructor(private mapsService: MapsService, public designService: MapDesignService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      if (map) {
        this.map = map;
      }
    });

    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      this.mapStructure = structure;
    });
  }

  ngOnDestroy() {
    this.mapSubscription.unsubscribe();
    this.mapStructureSubscription.unsubscribe();

  }

}
