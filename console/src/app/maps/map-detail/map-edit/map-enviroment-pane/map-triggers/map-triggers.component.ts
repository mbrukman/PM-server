import {Component, OnInit, OnDestroy} from '@angular/core';
import {MapsService} from '@maps/maps.service';
import {Map, MapStructure, MapTrigger} from '@maps/models';
import {TriggerFormComponent} from './trigger-form/trigger-form.component';
import {PopupService} from '@shared/services/popup.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map-triggers',
  templateUrl: './map-triggers.component.html',
  styleUrls: ['./map-triggers.component.scss']
})
export class MapTriggersComponent implements OnInit, OnDestroy {
  mapStructure: MapStructure;
  triggers: MapTrigger[];
  currentMapSubscription : Subscription;
  id: string;
  map: Map;

  constructor(
    private popupService: PopupService, 
    private mapsService: MapsService) { }

  ngOnInit() {
    this.currentMapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.map = map;
      this.mapsService.triggersList(map.id).subscribe(triggers => {
        this.triggers = triggers;
      });
    });

    this.mapsService.getCurrentMapStructure()
      .subscribe(structure => {
        this.mapStructure = structure;
      });
  }

  ngOnDestroy() {
    this.currentMapSubscription.unsubscribe();
  }

  openTriggerFormModal(index?) {
    const edit = index || index === 0;
    this.popupService.openComponent(TriggerFormComponent,{trigger:this.triggers[index],configurations:this.mapStructure.configurations.map(o => o.name)})
    .subscribe(result => {
      if (!edit) {
        this.mapsService.createTrigger(this.map.id, result).subscribe(trigger => {
          this.triggers.push(trigger);
        });
      } else {
        result._id = this.triggers[index]._id;
        this.triggers[index] = result;
        this.mapsService.updateTrigger(this.map.id, result).subscribe(trigger => {
          this.triggers[index] = trigger;
        });
      }
    });
  }

  removeTrigger(index: number) {
    let trigger = this.triggers[index];
    let confirm = 'Yes';
    this.popupService.openConfirm('Delete Trigger',`Are you sure you want to delete ${trigger.name}?`,confirm,'No',null).subscribe(ans => {
      if (ans === confirm) {
        this.mapsService.deleteTrigger(this.map.id, trigger.id).subscribe(() => {
          this.triggers.splice(index, 1);
        });
      }
    })
   
  }

}
