import {Component, OnInit, OnDestroy} from '@angular/core';
import {MapsService} from '@app/services/map/maps.service';
import {MapStructure, MapTrigger} from '@maps/models';
import {Map} from '@app/services/map/models/map.model';
import {TriggerFormComponent} from './trigger-form/trigger-form.component';
import {PopupService} from '@shared/services/popup.service';
import {Subscription} from 'rxjs';
import {filter, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-map-triggers',
  templateUrl: './map-triggers.component.html',
  styleUrls: ['./map-triggers.component.scss']
})
export class MapTriggersComponent implements OnInit, OnDestroy {
  mapStructure: MapStructure;
  triggers: MapTrigger[];
  private mainSubscription = new Subscription();
  id: string;
  map: Map;

  constructor(
    private popupService: PopupService,
    private mapsService: MapsService) {
  }

  ngOnInit() {
    const currentMapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.map = map;
      this.mapsService.triggersList(map.id).subscribe(triggers => {
        this.triggers = triggers;
      });
    });

    const getCurrentMapSubscription = this.mapsService.getCurrentMapStructure()
      .subscribe(structure => {
        this.mapStructure = structure;
      });

    this.mainSubscription.add(currentMapSubscription);
    this.mainSubscription.add(getCurrentMapSubscription);
  }

  openTriggerFormModal(index?) {
    const edit = index || index === 0;
    const openPopupSubscription = this.popupService.openComponent(
      TriggerFormComponent,
      {
        trigger: this.triggers[index],
        configurations: this.mapStructure.configurations.map(config => config.name)
      })
      .pipe(
        switchMap((result: any) => {
          if (!edit) {
            return this.mapsService.createTrigger(this.map.id, result).pipe(tap(trigger => {
              this.triggers.push(trigger);
            }));
          }

          result._id = this.triggers[index]._id;
          this.triggers[index] = result;

          return this.mapsService.updateTrigger(this.map.id, result).pipe(tap(trigger => {
            this.triggers[index] = trigger;
          }));
        })
      ).subscribe();

    this.mainSubscription.add(openPopupSubscription);
  }

  removeTrigger(index: number) {
    const trigger = this.triggers[index];
    const confirm = 'Yes';
    const popupSubscription = this.popupService.openConfirm(
      'Delete Trigger',
      `Are you sure you want to delete ${trigger.name}?`,
      confirm,
      'No',
      null
    )
      .pipe(
        filter(ans => ans === confirm),
        switchMap(() => this.mapsService.deleteTrigger(this.map.id, trigger.id))
      )
      .subscribe(ans => this.triggers.splice(index, 1));

    this.mainSubscription.add(popupSubscription);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
