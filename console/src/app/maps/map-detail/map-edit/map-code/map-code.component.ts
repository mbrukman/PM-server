import {Component, OnInit, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {MapsService} from '@app/services/map/maps.service';
import {MapStructure} from '@maps/models';

@Component({
  selector: 'app-map-code',
  templateUrl: './map-code.component.html',
  styleUrls: ['./map-code.component.scss']
})
export class MapCodeComponent implements OnInit, OnDestroy {
  structure: MapStructure = new MapStructure();
  mapSubscription: Subscription;
  editorOptions = {
    theme: 'vs-dark',
    language: 'javascript'
  };

  constructor(private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMapStructure()
      .subscribe(structure => {
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

  ngOnDestroy(): void {
    this.mapSubscription.unsubscribe();
  }
}
