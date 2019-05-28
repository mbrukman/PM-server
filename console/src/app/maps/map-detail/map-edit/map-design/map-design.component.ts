import {Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as joint from 'jointjs';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Link, MapStructure, Process, ProcessViewWrapper } from '@maps/models';
import { MapsService } from '@maps/maps.service';
import { PluginsService } from '@plugins/plugins.service';
import { Plugin } from '@plugins/models/plugin.model';
import {MapGraphComponent} from '@shared/components/map-graph/map-graph.component';


@Component({
  selector: 'app-map-design',
  templateUrl: './map-design.component.html',
  styleUrls: ['./map-design.component.scss']
})
export class MapDesignComponent implements OnInit {
  graph: joint.dia.Graph;
  paper: joint.dia.Paper;
  mapStructure: MapStructure;
  dropSubscription: Subscription;
  editing: boolean = false;
  plugins: Plugin[];
  process: Process;
  mapStructureSubscription: Subscription;
  link: Link;
  init: boolean = false;
  scale: number = 1;
  cellView:any;
  processViewWrapper: ProcessViewWrapper;

  @ViewChild(MapGraphComponent) mapGraph: MapGraphComponent;

  constructor(
    private mapsService: MapsService,
    private pluginsService: PluginsService) { }

  ngOnInit() {
    this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins;
      this.getCurrentMapStructure();
    });

  }

  getCurrentMapStructure(){
    this.mapsService.getCurrentMapStructure()
    .subscribe(structure => {
      this.mapStructure = structure;
   })
  }
  

  addNewProcess(process) {
    if (!this.mapStructure.processes) {
      this.mapStructure.processes = [process];
    } else {
      this.mapStructure.processes.push(process);
    }
  }

  editProcess(process) {
    this.process = process;
    this.processViewWrapper = new ProcessViewWrapper(this.process, this.mapStructure, this.plugins)

    if (this.editing) {
      this.editing = false;
      setTimeout(() => {
        this.editing = true;
      }, 300);
    } else {
      this.editing = true;
    }
  }

  onClose() {
    if(this.process){
      this.editing = false;
      this.process = null;
    }
  }

  onDelete() {
    let processIndex = _.findIndex(this.mapStructure.processes, (o) => {
      return o.uuid === this.process.uuid;
    });
    this.mapStructure.processes.splice(processIndex, 1);
    this.editing = false;
    this.process = null;
    this.mapsService.setCurrentMapStructure(this.mapStructure);
    this.mapGraph.onDelete();
  }

  onClone(){
    this.mapGraph.onClone();
  } 

  onSave(process) {
    let index = _.findIndex(this.mapStructure.processes, (o) => {
      return o.uuid === this.process.uuid;
    });
    this.mapGraph.updateNodeLabel(process.uuid, process.name || this.process.used_plugin.name)
    let updateFields = ['name', 'description', 'mandatory', 'condition', 'coordination', 'actions', 'correlateAgents', 'flowControl', 'filterAgents', 'postRun', 'preRun']
    for (let i=0, length=updateFields.length;i<length;i++){
      this.mapStructure.processes[index][updateFields[i]] =  process[updateFields[i]];
    }
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

  onScale(scale) {
    this.scale += scale;
    this.paper.scale(this.scale, this.scale);
  }

}
