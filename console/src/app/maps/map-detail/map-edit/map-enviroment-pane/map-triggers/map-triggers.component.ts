import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";

import { MapsService } from "../../../../maps.service";
import { MapTrigger } from "../../../../models/map-trigger.model";
import { Subscription } from "rxjs/Subscription";
import { Map } from "../../../../models/map.model";
import { BsModalRef, BsModalService } from "ngx-bootstrap";
import { TriggerFormComponent } from "./trigger-form/trigger-form.component";

@Component({
  selector: 'app-map-triggers',
  templateUrl: './map-triggers.component.html',
  styleUrls: ['./map-triggers.component.scss']
})
export class MapTriggersComponent implements OnInit, OnDestroy {
  triggers: MapTrigger[];
  mapSubscription: Subscription;
  id: string;
  map: Map;
  triggerReq: any;
  triggerCreateReq: any;
  deleteReq: any;
  resultSubscription: Subscription;

  constructor(private modalService: BsModalService, private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.map = map;
      this.triggerReq = this.mapsService.triggersList(map.id).subscribe(triggers => {
        this.triggers = triggers;
      });
    });
  }

  ngOnDestroy() {
    this.mapSubscription.unsubscribe();
    this.triggerReq.unsubscribe();
    if (this.resultSubscription)
      this.resultSubscription.unsubscribe();
    if (this.deleteReq)
      this.deleteReq.unsubscribe();
  }

  openTriggerFormModal(index?) {
    let edit = false;
    if (index !== null) {
      edit = true;
    }
    let modal: BsModalRef;
    modal = this.modalService.show(TriggerFormComponent);
    modal.content.trigger = this.triggers[index];
    this.resultSubscription = modal.content.result.subscribe(result => {
      if (!edit) {
        this.mapsService.createTrigger(this.map.id, result).subscribe(trigger => {
          this.triggers.push(trigger);
        });
      } else {
        result._id = this.triggers[index]._id;
        this.triggers[index] = result;
        this.mapsService.updateTrigger(this.map.id, result).subscribe(trigger => {
          console.log(trigger);
          this.triggers[index] = trigger;
        });
      }
    });
  }

  removeTrigger(index: number) {
    let trigger = this.triggers[index];
    this.mapsService.deleteTrigger(this.map.id, trigger.id).subscribe(() => {
      this.triggers.splice(index, 1);
    });
  }

}
