import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs/Subscription';
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
export class MapTriggersComponent implements OnInit, OnDestroy {
  mapStructure: MapStructure;
  mapStructureSubscription: Subscription;
  triggers: MapTrigger[];
  mapSubscription: Subscription;
  id: string;
  map: Map;
  triggerReq: any;
  deleteReq: any;
  resultSubscription: Subscription;

  constructor(private modalService: BsModalService, private mapsService: MapsService) { }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.map = map;
      this.triggerReq = this.mapsService.triggersList(map.id).subscribe(triggers => {
        this.triggers = triggers;
      });
    });

    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure()
      .subscribe(structure => {
        this.mapStructure = structure;
      });
  }

  ngOnDestroy() {
    this.mapSubscription.unsubscribe();
    this.triggerReq.unsubscribe();
    if (this.resultSubscription) {
      this.resultSubscription.unsubscribe();
    }
    if (this.deleteReq) {
      this.deleteReq.unsubscribe();
    }
  }

  openTriggerFormModal(index?) {
    const edit = index || index === 0;
    let modal: BsModalRef;
    modal = this.modalService.show(TriggerFormComponent);
    modal.content.trigger = this.triggers[index];
    modal.content.configurations = this.mapStructure.configurations.map(o => o.name);
    this.resultSubscription = modal.content.result.subscribe(result => {
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
    modal = this.modalService.show(ConfirmComponent);
    let answers = {
      message:'Are you sure to delete the trigger ?',

      confirm:'Yes'
    }
    modal.content.message = answers.message;
    modal.content.confirm = answers.confirm;
    modal.content.result.asObservable().subscribe(ans => {
      if (ans === answers.confirm) {
        let trigger = this.triggers[index];
        this.mapsService.deleteTrigger(this.map.id, trigger.id).subscribe(() => {
          this.triggers.splice(index, 1);
        });
      }
    })
   
  }

}
