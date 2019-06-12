import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as _ from 'lodash';
import { MapsService } from '../maps.service';
import { MapStructureConfiguration, Map, MapStructure } from '@maps/models';
import { PopupService } from '@shared/services/popup.service';
import { SocketService } from '@shared/socket.service';
import { filter, take } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { SeoService, PageTitleTypes } from '@app/seo.service';
import { SelectItem } from 'primeng/primeng';

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
  mapStructure: MapStructure;
  originalMapStructure: MapStructure;
  mapStructureSubscription: Subscription;
  mapSubscription: Subscription;
  isMapChangedSubscription : Subscription;

  edited: boolean = false;
  structureEdited: boolean = false;
  initiated: boolean = false;
  mapExecutionSubscription: Subscription;
  executing: boolean;
  downloadJson: SafeUrl;
  configurationDropDown:SelectItem[] = [];
  selected: string ;
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
    private seoService: SeoService, ) {

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
      this.mapsService.getMap(this.id).subscribe(map => {
        if (!map) {
          this.router.navigate(['NotFound']);
        }
        this.map = map;
        this.seoService.setTitle(map.name + PageTitleTypes.Map)
        this.originalMap = _.cloneDeep(map);
        this.mapsService.setCurrentMap(map);
        this.mapsService.getMapStructure(this.id).subscribe(structure => {
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

    this.mapSubscription = this.mapsService.getCurrentMap().pipe(
      filter(map => map)
    ).subscribe(map => {
      this.map = map;
      this.originalMap.archived = map.archived;
      if (!_.isEqual(map, this.originalMap)) {
        this.edited = true;
      } else {
        this.edited = false;
      }
    });

    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().pipe(
      filter(structure => !!structure)
    ).subscribe(structure => {
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
        this.configurationDropDown = this.mapStructure.configurations.map(config => {
          return {label:config.name, value:config}
        })
        if(this.configurationDropDown.length == 0){
          this.configurationDropDown.push({label:"No config",value:''})
        }
        
        if ((this.mapStructure.configurations && this.mapStructure.configurations.length > 0 && !this.initiated) || (!this.selected && this.mapStructure.configurations.length > 0)) {
          this.selected = this.mapStructure.configurations[0].name;
        }
        else if(!this.initiated){
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

    this.isMapChangedSubscription =  this.mapsService.isMapChanged().subscribe(res=>{
      this.structureEdited = res
    })

    // subscribing to executions updates
    this.mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable().subscribe(executions => {
      const maps = Object.keys(executions).map(key => executions[key]);
      this.executing = maps.indexOf(this.id) > -1;
    });
  }

  ngOnDestroy() {
    this.routeReq.unsubscribe();  
    this.mapsService.clearCurrentMap();
    this.mapsService.clearCurrentMapStructure();
    this.mapExecutionSubscription.unsubscribe();
    this.mapSubscription.unsubscribe();
    this.mapStructureSubscription.unsubscribe()
    this.isMapChangedSubscription.unsubscribe()
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
    this.mapsService.execute(this.id, this.selected ? this.selected['name'] || this.selected : undefined ).subscribe();
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
    let confirm = 'Save and continue';
    let third = 'Discard'
    let popup = this.popupService.openConfirm(null, 'You have unsaved changes that will be lost by this action. Discard changes?', confirm, 'Cancel', third)


    let subject = new Subject<boolean>();


    popup.subscribe(result => {
      if (result === confirm) {
        this.saveMap();
        return subject.next(true);
      }
      return subject.next(result === third);
    })

    return subject.asObservable()
  }

  /**
   * Updating selected configuration
   * @param {number} index
   */

  onKeyDown($event: KeyboardEvent) {
    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.ctrlKey && charCode === 's') {
      // Action on Ctrl + S
      this.saveMap();
      $event.preventDefault();
    }
  }


}
