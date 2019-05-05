import {Component, OnInit} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

import {MapsService} from '@maps/maps.service';
import {Map, MapStructure, MapTrigger} from '@maps/models';
import {TriggerFormComponent} from './trigger-form/trigger-form.component';
import {ConfirmComponent} from '@shared/confirm/confirm.component';

@Component({
  selector: 'app-map-triggers',
  templateUrl: './map-triggers.component.html',
  styleUrls: ['./map-triggers.component.scss']
})
export class MapTriggersComponent implements OnInit {
  mapStructure: MapStructure;
  triggers: MapTrigger[];
  id: string;
  map: Map;

  constructor(private modalService: BsModalService, private mapsService: MapsService) { }

  ngOnInit() {
    this.mapsService.getCurrentMap().subscribe(map => {
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

  openTriggerFormModal(index?) {
    const edit = index || index === 0;
    let modal: BsModalRef;
    modal = this.modalService.show(TriggerFormComponent);
    modal.content.trigger = this.triggers[index];
    modal.content.configurations = this.mapStructure.configurations.map(o => o.name);
    modal.content.result.subscribe(result => {
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
    let modal: BsModalRef;
    let trigger = this.triggers[index];
    modal = this.modalService.show(ConfirmComponent);
    let answers = {
      confirm:'Yes'
    }
    modal.content.title = 'Delete Trigger'
    modal.content.message = `Are you sure you want to delete ${trigger.name}?`;
    modal.content.confirm = answers.confirm;
    modal.content.result.asObservable().subscribe(ans => {
      if (ans === answers.confirm) {
        this.mapsService.deleteTrigger(this.map.id, trigger.id).subscribe(() => {
          this.triggers.splice(index, 1);
        });
      }
    })
   
  }

}
