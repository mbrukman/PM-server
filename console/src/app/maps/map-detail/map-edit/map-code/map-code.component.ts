import { Component, OnInit } from '@angular/core';

import { Subscription } from "rxjs";

import { MapsService } from "../../../maps.service";
import { MapStructure } from "../../../models/map-structure.model";

@Component({
  selector: 'app-map-code',
  templateUrl: './map-code.component.html',
  styleUrls: ['./map-code.component.scss']
})
export class MapCodeComponent implements OnInit {
  structure: MapStructure = new MapStructure();
  mapSubscription: Subscription;
  editorOptions = {
    theme: 'vs-dark',
    language: 'javascript'
  };

  constructor(private mapsService: MapsService) {
  }

  ngOnInit() {
    
    this.mapSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      if (structure) {
        this.structure = structure;
      }
    });
  }
 
  onKeyDown($event) {

    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.ctrlKey && charCode === 's') {
        return;
    } 

    this.structure.code = this.structure.code || undefined;
    this.mapsService.setCurrentMapStructure(this.structure);
  }

}
