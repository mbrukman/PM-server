import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, tap, mergeMap } from "rxjs/operators";;
import { MapsService } from '../../maps.service';
import { Map } from '@maps/models/map.model';
import { ProjectsService } from '@projects/projects.service';
import { Project } from '@projects/models/project.model';
import { SelectItem } from 'primeng/primeng';
import { SubscriptionManager } from '@app/shared/model/subscription-manager.model';


@Component({
  selector: 'app-map-properties',
  templateUrl: './map-properties.component.html',
  styleUrls: ['./map-properties.component.scss']
})
export class MapPropertiesComponent implements OnInit, OnDestroy {
  map: Map;
  projects: Project[];
  projectsDropDown:SelectItem[] = [];
  selectedProject: string;
  queue: number;
  onInit:boolean;
  subscriptionManager: SubscriptionManager = new SubscriptionManager();
  processesDropDown:SelectItem[] = [];
  apiResponseAfterProcess:string;
  apiResponseCodeRefrence:string;
  constructor(private mapsService: MapsService, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.onInit = true;
    let mapSubscription = this.mapsService.getCurrentMap().pipe(
      tap(map => this.map = map),
      filter(map => map),
      mergeMap(() => this.projectsService.list(null,null,{isArchived:false,globalFilter:null,sort:'-createdAt'}))// filtering empty map result
    ).subscribe(data => {

        if(this.onInit){
          this.getProcessByMapId();
          this.apiResponseCodeRefrence = this.map.apiResponseCodeReference;
        }

        this.projects = data.items;
        this.projectsDropDown = this.projects.map(project => {
          return {label:project.name,value:project._id}
        })
        
        let project = this.projects.find((o) => (<string[]>o.maps).indexOf(this.map.id) > -1);
        if (project && this.onInit) {
          this.selectedProject = this.map.project ? this.map.project.id : project._id;
          this.onInit = false;
        }
      });
      this.subscriptionManager.add(mapSubscription)
  }

  getProcessByMapId(){
    let mapStructureSubscription = this.mapsService.getCurrentMapStructure().pipe(filter((structure) => !!structure))
    .subscribe(structure => {
      if(structure.processes.length){
        this.apiResponseAfterProcess = this.map.processResponse;
        this.onChangeProcessResponse();
        this.processesDropDown.push({label:'Select a Process',value:null});
        let processes = structure.processes.map(process => {
          return {label:process.name || process.used_plugin.name, value:process.uuid}
        })
        this.processesDropDown.push(...processes);

      }
    })

    this.subscriptionManager.add(mapStructureSubscription)
  }

  onChangeProcessResponse(){
    let mapObj = Object.assign({}, this.map, { processResponse: this.apiResponseAfterProcess });
    this.mapsService.setCurrentMap(mapObj);
  }

  onapiResponseCodeReference(){
    let mapObj = Object.assign({}, this.map, { apiResponseCodeReference: this.apiResponseCodeRefrence });
    this.mapsService.setCurrentMap(mapObj);
  }

  ngOnDestroy() {
    this.subscriptionManager.unsubscribe();
  }

  onMapUpdate() {
    this.mapsService.setCurrentMap(this.map);
  }

  onChangeProject() {
    let mapObj = Object.assign({}, this.map, { project: {id:this.selectedProject} });
    this.mapsService.setCurrentMap(mapObj);
  }

  archiveMap(isArchive:boolean) {
    this.mapsService.archive(this.map.id, isArchive).subscribe(() => {
      this.map.archived = isArchive;
      this.mapsService.setCurrentMap(this.map);
    });
  }

}
