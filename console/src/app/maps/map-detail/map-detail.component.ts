import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { Subscription } from 'rxjs/Subscription';
import * as _ from 'lodash';
import { BsModalService } from 'ngx-bootstrap/modal';

import { MapsService } from '../maps.service';
import { MapStructureConfiguration, Map, MapStructure } from '@maps/models';
import { ConfirmComponent } from '@shared/confirm/confirm.component';
import { SocketService } from '@shared/socket.service';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-map-detail',
  templateUrl: './map-detail.component.html',
  styleUrls: ['./map-detail.component.scss'],
  host: {
    '(document:keydown)': 'onKeyDown($event)'
  }
})
export class MapDetailComponent implements OnInit, OnDestroy {
  id: string;
  originalMap: Map;
  map: Map;
  routeReq: any;
  mapReq: any;
  mapExecReq: any;
  mapStructure: MapStructure;
  mapStructureReq: any;
  mapStructuresListReq: any;
  structuresList: MapStructure[] = [];
  structureIndex: number;
  originalMapStructure: MapStructure;
  mapStructureSubscription: Subscription;
  edited: boolean = false;
  structureEdited: boolean = false;
  initiated: boolean = false;
  mapExecutionSubscription: Subscription;
  executing: boolean;
  downloadJson: SafeUrl;
  selected: number;
  navItems: [{
    name: string,
    routerLink: string[]
  }];

  constructor(private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private mapsService: MapsService,
    private socketService: SocketService,
    private modalService: BsModalService) {

    this.navItems = [
      { name: 'Properties', routerLink: ['properties'] },
      { name: 'Design', routerLink: ['edit', 'design'] },
      { name: 'Code', routerLink: ['edit', 'code'] },
      { name: 'Configurations', routerLink: ['configurations'] },
      { name: 'Execution Results', routerLink: ['results'] },
      { name: 'Revisions', routerLink: ['revisions'] }
    ];
  }

  ngOnInit() {
    this.routeReq = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.mapReq = this.mapsService.getMap(this.id).subscribe(map => {
        if (!map) {
          this.router.navigate(['NotFound']);
        }
        this.map = map;
        this.originalMap = _.cloneDeep(map);
        this.mapsService.setCurrentMap(map);
        this.mapStructuresListReq = this.mapsService.structuresList(this.id).subscribe(structureList => {
          this.structuresList = structureList;
        });
        this.mapStructureReq = this.mapsService.getMapStructure(this.id).subscribe(structure => {

          if (structure === null) {
            structure = new MapStructure();
            structure.map = params['id'];
          }
          this.mapsService.setCurrentMapStructure(structure);
        }, error => {
          // if there is an error, return a new map structure
          let structure = new MapStructure();
          structure.map = params['id'];
          this.mapsService.setCurrentMapStructure(structure);
          console.log('Error getting map structure', error);
        });
      }, () => {
        console.log('Couldn\'t get map model');
        this.router.navigate(['NotFound']);
      });
    });

    this.mapsService.getCurrentMap()
      .filter(map => map)
      .subscribe(map => {
        this.map = map;
        this.originalMap.archived = map.archived;
        if (!_.isEqual(map, this.originalMap)) {
          this.edited = true;
        } else {
          this.edited = false;
        }
      });

    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure()
      .filter(structure => !!structure)
      .subscribe(structure => {
        let newContent;
        let oldContent;
        if (!this.initiated) {
          this.originalMapStructure = _.cloneDeep(structure);
        }
        try {
          newContent = JSON.parse(structure.content).cells
            .filter(c => c.type = 'devs.MyImageModel')
            .map(c => {
              return {
                position: c.position
              };
            });
          oldContent = JSON.parse(this.originalMapStructure.content).cells
            .filter(c => c.type = 'devs.MyImageModel')
            .map(c => {
              return {
                position: c.position
              };
            });
        } catch (e) { }

        const compareStructure = this.cleanStructure(JSON.parse(JSON.stringify(structure)));
        const compareOriginalStructure = this.cleanStructure(JSON.parse(JSON.stringify(this.originalMapStructure)));
        delete compareStructure.content;
        delete compareOriginalStructure.content;
        this.structureEdited = (JSON.stringify(compareStructure) !== JSON.stringify(compareOriginalStructure)) || !_.isEqual(newContent, oldContent);

        this.mapStructure = structure;
        this.structureIndex = this.structuresList.length - this.structuresList.findIndex((o) => {
          return o.id === structure.id;
        });
        this.initiated = true;
        this.generateDownloadJsonUri();

        if (this.mapStructure.configurations && this.mapStructure.configurations.length > 0) {
          const selected = this.mapStructure.configurations.findIndex(o => o.selected);
          this.selected = selected !== -1 ? selected : 0;
        }
      });


    // get the current executing maps
    this.mapsService.currentExecutionList()
      .take(1)
      .subscribe(executions => {
        const maps = Object.keys(executions).map(key => executions[key]);
        this.executing = maps.indexOf(this.id) > -1;
      });

    // subscribing to executions updates
    this.mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable().subscribe(executions => {
      const maps = Object.keys(executions).map(key => executions[key]);
      this.executing = maps.indexOf(this.id) > -1;
    });
  }

  ngOnDestroy() {
    this.routeReq.unsubscribe();
    this.mapReq.unsubscribe();
    if (this.mapStructureReq) {
      this.mapStructureReq.unsubscribe();
    }
    if (this.mapExecReq) {
      this.mapExecReq.unsubscribe();
    }
    this.mapsService.clearCurrentMap();
    this.mapsService.clearCurrentMapStructure();
    this.mapExecutionSubscription.unsubscribe();
  }

  cleanStructure(structure) {
    structure.processes.forEach((p, i) => {
      delete structure.processes[i].plugin;
      delete p['_id'];
      delete p['createdAt'];
      for (let propName in p) {
        if (p[propName] === null || p[propName] === undefined || p[propName] === '') {
          delete p[propName];
        }
      }
      if (p.actions) {
        p.actions.forEach(a => {
          delete a['_id'];
          delete a['id'];
          for (let propName in a) {
            if (a[propName] === null || a[propName] === undefined || a[propName] === '') {
              delete a[propName];
            }
          }
          a.params.forEach(param => {
            delete param['_id'];
            delete param['id'];
            delete param['param'];
          });
        });
      }
    });
    structure._id = undefined;
    structure.id = undefined;

    return structure;
  }

  generateDownloadJsonUri() {
    let structure;
    try {
      structure = JSON.parse(JSON.stringify(this.mapStructure));
    } catch (e) {
      structure = Object.assign({}, this.mapStructure);
    }
    delete structure._id;
    delete structure.id;
    delete structure.map;
    delete structure.map;
    if (structure.used_plugins) {
      structure.used_plugins.forEach(plugin => {
        plugin ? delete plugin._id : null;
      });
    }
    structure.processes.forEach((process, i) => {
      delete structure.processes[i]._id;
      delete structure.processes[i].plugin;
      structure.processes[i].used_plugin ? delete structure.processes[i].used_plugin._id : null;
      delete structure.processes[i].createdAt;
      delete structure.createdAt;
      delete structure.updatedAt;
      if (process.actions) {
        process.actions.forEach((action, j) => {
          delete structure.processes[i].actions[j]._id;
          delete structure.processes[i].actions[j].id;
        });
      }
    });
    structure.links.forEach((link, i) => {
      delete structure.links[i]._id;
      delete structure.links[i].createdAt;
    });

    this.downloadJson = this.sanitizer.bypassSecurityTrustUrl('data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(structure)));
  }

  discardChanges() {
    this.mapsService.setCurrentMapStructure(this.originalMapStructure);
  }

  executeMap() {
    this.mapExecReq = this.mapsService.execute(this.id, (!this.selected || this.selected !== 0) ? undefined : this.mapStructure.configurations[this.selected].name).subscribe();
  }

  saveMap() {
    if (this.edited) {
      this.mapsService.updateMap(this.map.id, this.map).subscribe(() => {
        this.originalMap = _.cloneDeep(this.map);
        this.edited = false;
      }, error => {
        console.log(error);
      });
    }

    if (this.structureEdited) {
      let content = JSON.parse(this.mapStructure.content);
      content.cells.forEach(cell => {
        if (cell.type !== 'devs.MyImageModel') {
          return;
        }
        cell.attrs.rect.fill = '#2d3236';
      });
      this.mapStructure.content = JSON.stringify(content);
      if (!this.checkConfigurationValidity(this.mapStructure.configurations)) {
        return;
      }
      delete this.mapStructure._id;
      delete this.mapStructure.id;
      delete this.mapStructure.createdAt;
      this.mapsService.createMapStructure(this.map.id, this.mapStructure).subscribe((structure) => {

        this.originalMapStructure = _.cloneDeep(this.mapStructure);

        this.structureEdited = false;
        this.structuresList.unshift(structure);
        this.mapStructure.id = structure.id;
      }, error => {
        console.log('Error saving map', error);
      });
    }

  }

  checkConfigurationValidity(configurations: MapStructureConfiguration[]): boolean {
    for (let i = 0; i < configurations.length; i++) {
      try {
        if (typeof (configurations[i].value) === 'string') {
          configurations[i].value = JSON.parse(<string>(configurations[i].value));
        }
      } catch (e) {

        this.socketService.setNotification({
          title: 'bad configuration',
          message: `configuration '${configurations[i].name}' is invalid`,
          type: 'error'
        });

        return false;
      }
    }
    return true;
  }

  /**
   * Will be invoked when trying to deactivate the detail route. If needed, promotes the user with a
   * @returns {boolean}
   */
  canDeactivate() {
    // will be triggered by deactivate guard
    if (!this.edited && !this.structureEdited) {
      return true;
    }
    let modal = this.modalService.show(ConfirmComponent);
    let answers = {
      confirm: 'Discard',
      third: 'Save and continue',
      cancel: 'Cancel'
    };
    modal.content.message = 'You have unsaved changes that will be lost by this action. Discard changes?';
    modal.content.confirm = answers.confirm;
    modal.content.third = answers.third;
    modal.content.cancel = answers.cancel;

    let subject = new Subject<boolean>();

    this.modalService.setDismissReason('Yes');
    this.modalService.onHide.subscribe(() => {
      return subject.next(false)
    })

    modal.content.result.subscribe(result => {
      if (result === answers.third) {
        this.saveMap();
        return subject.next(true);
      }
      return subject.next(result === answers.confirm);
    })

    return subject.asObservable()
  }

  /**
   * Updating selected configuration
   * @param {number} index
   */
  changeSelected() {
    this.mapStructure.configurations.forEach((configuration, i) => {
      configuration.selected = (this.selected.toString() === i.toString());
    });
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

  onKeyDown($event: KeyboardEvent) {
    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.ctrlKey && charCode === 's') {
      // Action on Ctrl + S
      this.saveMap();
      $event.preventDefault();
    }
  }


}
