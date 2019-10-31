import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import * as _ from 'lodash';
import {MapsService} from '@app/services/map/maps.service';
import {Map} from '@app/services/map/models/map.model';
import {MapStructureConfiguration, MapStructure} from '@maps/models';
import {PopupService} from '@shared/services/popup.service';
import {SocketService} from '@shared/socket.service';
import {filter, take, map, switchMap} from 'rxjs/operators';
import {Subject, Subscription, throwError} from 'rxjs';
import {SeoService, PageTitleTypes} from '@app/seo.service';
import {SelectItem} from 'primeng/primeng';

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
  mapStructure: MapStructure;
  originalMapStructure: MapStructure;
  mapResultId: Subject<string> = new Subject<string>();
  edited: boolean = false;
  structureEdited: boolean = false;
  initiated: boolean = false;
  private mainSubscription = new Subscription();
  executing: boolean;
  downloadJson: SafeUrl;
  configurationDropDown: SelectItem[] = [];
  selected: string;
  navItems: {
    name: string,
    routerLink: string[]
  }[];

  constructor(private route: ActivatedRoute,
              private router: Router,
              private sanitizer: DomSanitizer,
              private mapsService: MapsService,
              private socketService: SocketService,
              private popupService: PopupService,
              private seoService: SeoService
  ) {

    this.navItems = [
      {name: 'Properties', routerLink: ['properties']},
      {name: 'Design', routerLink: ['edit', 'design']},
      {name: 'Code', routerLink: ['edit', 'code']},
      {name: 'Configurations', routerLink: ['configurations']},
      {name: 'Execution Results', routerLink: ['results']},
      {name: 'Revisions', routerLink: ['revisions']}
    ];
  }

  ngOnInit() {
    let outerParams, outerStructure;
    const routeParamsSubscription = this.route.params
      .pipe(
        map((params) => {
          this.id = params['id'];
          outerParams = Object.assign({}, params);
        }),
        switchMap(() => this.mapsService.getMap(this.id)),
        switchMap((foundMap) => {
          if (!foundMap) {
            return throwError('NotFound');
          }
          this.map = foundMap;
          this.seoService.setTitle(foundMap.name + PageTitleTypes.Map);
          this.originalMap = _.cloneDeep(foundMap);
          this.mapsService.setCurrentMap(foundMap);
          return this.mapsService.getMapStructure(this.id);
        }),
        map(structure => outerStructure = Object.assign({}, structure))
      ).subscribe(
        () => {
        },
        (errMessage) => {
          switch (errMessage) {
            case 'NotFound':
              return this.router.navigate(['NotFound']);
            case 'NoMapStructure':
              console.log('Error getting map structure');
          }
        },
        () => {
          if (!outerStructure) {
            outerStructure = new MapStructure();
            outerStructure.map = outerParams['id'];
          }
          this.mapsService.setCurrentMapStructure(outerStructure);
        }
      );

    const mapSubscription = this.mapsService.getCurrentMap().pipe(
      filter(foundMap => foundMap)
    ).subscribe(foundMap => {
      this.map = foundMap;
      this.originalMap.archived = foundMap.archived;
      this.edited = !_.isEqual(foundMap, this.originalMap);
    });

    const mapStructureSubscription = this.mapsService.getCurrentMapStructure().pipe(
      filter(structure => !!structure)
    ).subscribe(structure => {
      let newContent;
      let oldContent;
      if (!this.initiated) {
        this.originalMapStructure = _.cloneDeep(structure);
      }
      try {
        newContent = JSON.parse(structure.content).cells
          .filter(cell => cell.type = 'devs.MyImageModel')
          .map(cell => {
            return {
              position: cell.position
            };
          });
        oldContent = JSON.parse(this.originalMapStructure.content).cells
          .filter(cell => cell.type = 'devs.MyImageModel')
          .map(cell => {
            return {
              position: cell.position
            };
          });
      } catch (err) {
      }

      const compareStructure = this.cleanStructure(JSON.parse(JSON.stringify(structure)));
      const compareOriginalStructure = this.cleanStructure(JSON.parse(JSON.stringify(this.originalMapStructure)));
      delete compareStructure.content;
      delete compareOriginalStructure.content;
      this.structureEdited = (JSON.stringify(compareStructure) !== JSON.stringify(compareOriginalStructure)) || !_.isEqual(newContent, oldContent);
      this.mapStructure = structure;
      this.configurationDropDown = this.mapStructure.configurations.map(config => {
        return {label: config.name, value: config};
      });
      if (this.configurationDropDown.length === 0) {
        this.configurationDropDown.push({label: 'No config', value: ''});
      }

      if (
        (this.mapStructure.configurations && this.mapStructure.configurations.length > 0) &&
        !this.initiated ||
        (!this.selected && this.mapStructure.configurations.length > 0)
      ) {
        this.selected = this.mapStructure.configurations[0].name;
      } else if (!this.initiated) {
        this.selected = undefined;
      }
      this.initiated = true;
      this.generateDownloadJsonUri();
    });

    // get the current executing maps
    this.mapsService.currentExecutionList().pipe(
      take(1)
    ).subscribe(executions => {
      const maps = Object.keys(executions).map(key => executions[key]);
      this.executing = maps.indexOf(this.id) > -1;
    });

    const isMapChangedSubscription = this.mapsService.isMapChanged().subscribe(res => {
      this.structureEdited = res;
    });

    // subscribing to executions updates
    const mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable().subscribe(executions => {
      const maps = Object.keys(executions).map(key => executions[key]);
      this.executing = maps.indexOf(this.id) > -1;
    });

    this.mainSubscription.add(routeParamsSubscription);
    this.mainSubscription.add(mapSubscription);
    this.mainSubscription.add(mapStructureSubscription);
    this.mainSubscription.add(isMapChangedSubscription);
    this.mainSubscription.add(mapExecutionSubscription);
  }


  cleanStructure(structure) {
    structure.processes.forEach((process, i) => {
      delete structure.processes[i].plugin;
      delete process['_id'];
      delete process['createdAt'];
      for (const propName in process) {
        if (!process.hasOwnProperty(propName)) {
          return;
        } else if (process[propName] === null || process[propName] === undefined || process[propName] === '') {
          delete process[propName];
        }
      }
      if (process.actions) {
        process.actions.forEach(action => {
          delete action['_id'];
          delete action['id'];
          for (const propName in action) {
            if (!action.hasOwnProperty(propName)) {
              return;
            } else if (action[propName] === null || action[propName] === undefined || action[propName] === '') {
              delete action[propName];
            }
          }
          action.params.forEach(param => {
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
        if (plugin) {
          delete plugin._id;
        }
      });
    }
    structure.processes.forEach((process, i) => {
      if (structure.processes[i].used_plugin) {
        delete structure.processes[i].used_plugin._id;
      }
      delete structure.processes[i]._id;
      delete structure.processes[i].plugin;
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

  executeMap() {
    const mapExecutionSubscription = this.mapsService.execute(
      this.id,
      this.selected ? this.selected['name'] || this.selected : undefined
    ).subscribe((result) => {
      this.mapResultId.next(result['id']);
    });
    this.mainSubscription.add(mapExecutionSubscription);
  }

  saveMap() {
    if (this.edited) {
      const updateMapSubscription = this.mapsService.updateMap(this.map.id, this.map).subscribe(() => {
        this.originalMap = _.cloneDeep(this.map);
        this.edited = false;
      }, error => {
        console.log(error);
      });
      this.mainSubscription.add(updateMapSubscription);
    }

    if (this.structureEdited) {
      const content = JSON.parse(this.mapStructure.content);
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
      const createMapSubscription = this.mapsService.createMapStructure(this.map.id, this.mapStructure).subscribe((structure) => {
        this.originalMapStructure = _.cloneDeep(this.mapStructure);
        this.structureEdited = false;
        this.mapStructure.id = structure.id;
      }, error => {
        console.log('Error saving map', error);
      });
      this.mainSubscription.add(createMapSubscription);
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

  // it is used by UnsavedGuard
  canDeactivate() {
    // will be triggered by deactivate guard
    if (!this.edited && !this.structureEdited) {
      return true;
    }
    const confirm = 'Save and continue';
    const third = 'Discard';
    const popup = this.popupService.openConfirm(
      null,
      'You have unsaved changes that will be lost by this action. Discard changes?',
      confirm,
      'Cancel',
      third
    );


    const subject = new Subject<boolean>();


    const popupSubscription = popup.subscribe(result => {
      if (result === confirm) {
        this.saveMap();
        return subject.next(true);
      }
      return subject.next(result === third);
    });

    this.mainSubscription.add(popupSubscription);

    return subject.asObservable();
  }

  /**
   * Updating selected configuration
   * @param {KeyboardEvent} $event
   */

  onKeyDown($event: KeyboardEvent) {
    const charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.ctrlKey && charCode === 's') {
      this.saveMap();
      $event.preventDefault();
    }
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
    this.mapsService.clearCurrentMap();
    this.mapsService.clearCurrentMapStructure();
  }
}
