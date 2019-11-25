import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {filter, tap, mergeMap} from 'rxjs/operators';
import {MapsService} from '@app/services/map/maps.service';
import {Map} from '@app/services/map/models/map.model';
import {ProjectsService} from '@projects/projects.service';
import {Project} from '@projects/models/project.model';
import {SelectItem} from 'primeng/primeng';


@Component({
  selector: 'app-map-properties',
  templateUrl: './map-properties.component.html',
  styleUrls: ['./map-properties.component.scss']
})
export class MapPropertiesComponent implements OnInit, OnDestroy {
  map: Map;
  projects: Project[];
  projectsDropDown: SelectItem[] = [];
  selectedProject: string;
  onInit: boolean;
  processesDropDown: SelectItem[] = [];
  apiResponseAfterProcess: string;
  apiResponseCodeReference: string;

  private mainSubscription = new Subscription();

  constructor(private mapsService: MapsService, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.onInit = true;

    const projectsSubscription = this.projectsService.list(
      null,
      null,
      {isArchived: false, globalFilter: null, sort: '-createdAt'}
    ).subscribe(data=>{
        this.projects = data.items;
        this.projectsDropDown = this.projects.map(foundProject => {
          return {label: foundProject.name, value: foundProject._id};
        });

        const project = this.projects.find((o) => (<string[]>o.maps).indexOf(this.map.id) > -1);
        if (project && this.onInit) {
          this.selectedProject = this.map.project ? this.map.project.id : project._id;
          this.onInit = false;
        }
    })


    const mapSubscription = this.mapsService.getCurrentMap()
      .pipe(
        tap(map => this.map = map),
        filter(map => map)
        // filtering empty map result
      ).subscribe(data => {
        if (this.onInit) {
          this.getProcessByMapId();
          this.apiResponseCodeReference = this.map.apiResponseCodeReference;
        }
      });

    this.mainSubscription.add(mapSubscription);
    this.mainSubscription.add(projectsSubscription);
  }

  getProcessByMapId() {
    const currentMapSubscription = this.mapsService.getCurrentMapStructure()
      .pipe(
        filter((structure) => !!structure)
      ).subscribe(structure => {
        if (structure.processes.length) {
          this.apiResponseAfterProcess = this.map.processResponse;
          this.processesDropDown.push({label: 'Select a Process', value: null});
          const processes = structure.processes.map(process => {
            return {label: process.name || process.used_plugin.name, value: process.uuid};
          });
          this.processesDropDown.push(...processes);
        }
      });
    this.mainSubscription.add(currentMapSubscription);
  }

  onChangeProcessResponse() {
    const mapObj = Object.assign({}, this.map, {processResponse: this.apiResponseAfterProcess});
    this.mapsService.setCurrentMap(mapObj);
  }

  onapiResponseCodeReference() {
    const mapObj = Object.assign({}, this.map, {apiResponseCodeReference: this.apiResponseCodeReference});
    this.mapsService.setCurrentMap(mapObj);
  }

  onMapUpdate() {
    this.mapsService.setCurrentMap(this.map);
  }

  onChangeProject() {
    const mapObj = Object.assign({}, this.map, {project: this.selectedProject});
    this.mapsService.setCurrentMap(mapObj);
  }

  archiveMap(isArchive: boolean) {
    const archiveSub = this.mapsService.archive(this.map.id, isArchive).subscribe(() => {
      this.map.archived = isArchive;
      this.mapsService.setCurrentMap(this.map);
    });
    this.mainSubscription.add(archiveSub);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
