import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as joint from 'jointjs';
import { DiffEditorModel } from 'ngx-monaco-editor';
import {PopupService} from '@shared/services/popup.service'
import { MapsService } from '../../maps.service';
import { MapStructure, Process } from '@maps/models';
import { JOINT_OPTIONS } from '@maps/constants'
import { Project } from '@projects/models/project.model';
import { ProjectsService } from '@projects/projects.service';
import { SocketService } from '@shared/socket.service';
import { MapDuplicateComponent } from '@maps/map-detail/map-revisions/mapduplicate-popup/mapduplicate-popup.component';
import { FilterOptions } from '@shared/model/filter-options.model';
import { take, filter, mergeMap } from 'rxjs/operators';
import { MapDuplicateOptions } from '@maps/models/map-duplicate-options.model';
import { Subscription } from 'rxjs';
import { MapGraphComponent } from '@app/shared/components/map-graph/map-graph.component';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-map-revisions',
  templateUrl: './map-revisions.component.html',
  styleUrls: ['./map-revisions.component.scss']
})
export class MapRevisionsComponent implements OnInit {
  load_structures = 25;
  previewProcess: Process;
  structures: MapStructure[] = [];
  maxLengthReached:boolean = false;
  structureId: string;
  mapId: string;
  project: Project;
  scrollCallback: any;
  page: number = 1;
  morePages: boolean = true;
  currentStructure: MapStructure;
  viewMode: 'code' | 'design' = 'design';
  latestStructure: MapStructure;
  editorOptions = {
    theme: 'vs-dark',
    language: 'javascript',
    readOnly: true
  };
  latestCode: string;
  currentCode: string;

  monacoOptions = {
    theme: 'vs-dark'
  };
  @ViewChild(MapGraphComponent) mapGraph: MapGraphComponent;
  

  constructor(private mapsService: MapsService, private router: Router, private route: ActivatedRoute, private projectsService: ProjectsService, private socketService: SocketService, private popupService:PopupService) {}

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.mapId = params.id;
      this.getMapProject();
      this.loadStructureOnScroll(this.mapId,true);
    });
  }

  originalModel: DiffEditorModel = {
    code: this.latestCode,
    language: 'text/javascript'
  };

  modifiedModel: DiffEditorModel = {
    code: this.currentCode,
    language: 'text/javascript'
  };


  loadStructureOnScroll(mapId = this.mapId,OnInit = false){
    this.mapsService.structuresList(mapId,this.page)
    .subscribe(structures => {
      if(OnInit && structures.length){
        this.previewStructure(structures[0].id)
      }
      if(structures.length < this.load_structures){
        this.maxLengthReached = true
      }
      for(let i=0,length = structures.length;i<length;i++){
        this.structures.push(structures[i])
      }
    })
  }

  onScroll(){
    if (!this.maxLengthReached) {
      return;
    }
    this.page++;
    this.loadStructureOnScroll();
  }

  getMapProject() {
    let mapIdFilter = {maps:{$in:[this.mapId]}}
    var filterOptions : FilterOptions = {isArchived:false,globalFilter:null,sort:'-createdAt',filter:mapIdFilter};
    this.projectsService.filter(null,null,filterOptions).subscribe(data => {
      data.items.forEach(project => {
        if ((<string[]>project.maps).indexOf(this.mapId) > -1) {
          this.project = project;
        }
      });
    });
  }

  changeStructure(structureId) {
    this.mapsService.getMapStructure(this.mapId, structureId).subscribe(structure => {
      this.mapsService.setCurrentMapStructure(structure);
      this.socketService.setNotification({
        title: 'Changed version',
        type: 'info'
      });
    });
  }


  duplicateMap(structureId: string) {
    this.popupService.openComponent(MapDuplicateComponent,{})
    .pipe(
      take(1),
      filter(obj => !!(<MapDuplicateOptions>obj).name), // filtering only results with a name
    mergeMap(obj =>  this.mapsService.duplicateMap(this.mapId, structureId, this.project.id,<MapDuplicateOptions>obj))
      ).subscribe(map => { this.router.navigate(['/maps', map.id]);
    });
  }

  previewStructure(structureId: string) {
    this.previewProcess = null;
    this.mapsService.getMapStructure(this.mapId, structureId)
      .subscribe(structure => {
        this.currentStructure = structure;
        this.originalModel = {
          code : structure.code,
          language : 'javascript'
        }
        if (!this.latestStructure) {
          this.setLatestStructure(this.mapId, this.structures[0].id);
        }

        if (this.viewMode === 'code') {
          this.loadCodeDiff();
        }
      });

  }


  onVersionScroll(event) {
  }

  loadRevisions() {

    this.page++;
    this.loadStructureOnScroll();
  }

  changeMode(mode: 'code' | 'design') {
    this.viewMode = mode;
    this.mapGraph.onClear();
    if (mode === 'code') {
      this.loadCodeDiff();
    } else {
      setTimeout(() => {

        this.mapGraph.reloadContent()
      }, 0);
    }
  }

  loadCodeDiff() {
    this.latestCode = this.latestStructure.code || '';
    this.currentCode = this.currentStructure.code || '';
  }

  setLatestStructure(mapId: string, structureId: string) {
    this.mapsService.getMapStructure(mapId, structureId).pipe(
    take(1)
    ).subscribe(structure => {
        this.latestStructure = structure
        //this.latestGraph.fromJSON(JSON.parse(this.latestStructure.content));
        this.modifiedModel.code = structure.code;
      });
  }

  onClose() {
    this.previewProcess = null;
  }
}
