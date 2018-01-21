import { Component, OnInit } from '@angular/core';

import { Subscription } from "rxjs/Subscription";

import { Map } from '../../../models/map.model';
import { MapsService } from "../../../maps.service";
import { MapStructure } from "../../../models/map-structure.model";

@Component({
  selector: 'app-map-code',
  templateUrl: './map-code.component.html',
  styleUrls: ['./map-code.component.scss']
})
export class MapCodeComponent implements OnInit {
  structure: MapStructure;
  mapSubscription: Subscription;
  editorOptions = {
    theme: 'vs-dark',
    language: 'javascript'
  };
  code: string;

  constructor(private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      if (structure) {
        this.structure = structure;
        this.code = structure.code;
      }
    });
  }

  onKeyDown() {
    this.structure.code = this.code;
    this.mapsService.setCurrentMapStructure(this.structure);
  }

}
