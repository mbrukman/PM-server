import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as $ from 'jquery';
import * as joint from 'jointjs';
import { DiffEditorModel } from 'ngx-monaco-editor';
import {PopupService} from '@shared/services/popup.service'
import { MapsService } from '../../../maps/maps.service';
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
import { Content } from '@angular/compiler/src/render3/r3_ast';



@Component({
  selector: 'app-map-graph',
  templateUrl: './map-graph.component.html',
  styleUrls: ['./map-graph.component.scss']
})
export class MapGraphComponent implements OnInit,OnChanges {
  @Input('wrapper') wrapper;
  @Input('content') content;
  structureId: string;
  mapId: string;
  graph: joint.dia.Graph;

  paper: joint.dia.Paper;


  latestStructure: MapStructure;
  constructor() { }

  ngOnInit() {

    this.wrapper.nativeElement.maxHeight = this.wrapper.nativeElement.offsetHeight;
    this.graph = new joint.dia.Graph;
    this.paper = new joint.dia.Paper({
      el: $('#graph'),
      width: this.wrapper.nativeElement.offsetWidth,
      height: this.wrapper.nativeElement.offsetHeight,
      gridSize: 1,
      model: this.graph, 
      interactive: false
    });
    this.defineShape();
    this.paper.scale(0.75, 0.75);
    this.addPaperDrag();
    this.listeners();
  }

  ngOnChanges(){
    if(this.content){
      this.graph.fromJSON(JSON.parse(this.content));
    }
  }

  addPaperDrag() {
    let initialPosition = { x: 0, y: 0 };
    let move = false;

    let paperOnPointerDown = (event, x, y) => {
      initialPosition = { x: x * 0.75, y: y * 0.75 };
      move = true;
    };

    let paperOnPointerUp = (event, x, y) => {
      move = false;
    };

    let graphMouseMove = (paper) => (event)=>{
      if (move) {
        paper.translate(event.offsetX - initialPosition.x, event.offsetY - initialPosition.y);
      }
    };


    this.paper.on('blank:pointerdown', paperOnPointerDown);
    this.paper.on('blank:pointerup', paperOnPointerUp);


    $('#graph').mousemove(graphMouseMove(this.paper));

  }

  listeners() {
    this.paper.on('cell:pointerup', (cellView, evt, x, y) => {
      if (cellView.model.isLink()) {
        return;
      }
      //this.previewProcess = this.currentStructure.processes.find(p => p.uuid === cellView.model.id);
    });
  }

  defineShape() {
    joint.shapes.devs['MyImageModel'] = joint.shapes.devs.Model.extend({
      markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
      defaults: joint.util.deepSupplement({
        type: 'devs.MyImageModel',
        size: {
          width: 80,
          height: 80
        },
        attrs: {
          rect: {
            'stroke-width': '1',
            'stroke-opacity': .7,
            stroke: JOINT_OPTIONS.RECT_STROKE_COLOR,
            rx: 3,
            ry: 3,
            fill: JOINT_OPTIONS.RECT_FILL_COLOR
            // 'fill-opacity': .5
          },
          circle: {
            stroke: 'gray'
          },
          '.label': {
            text: '',
            'ref-y': 5,
            'font-size': 14,
            fill: JOINT_OPTIONS.LABEL_FILL_COLOR
          },
          image: {
            'xlink:href': 'http://via.placeholder.com/350x150',
            width: 46,
            height: 32,
            'ref-x': 50,
            'ref-y': 50,
            ref: 'rect',
            'x-alignment': 'middle',
            'y-alignment': 'middle'
          },
          '.inPorts circle': {
            fill: JOINT_OPTIONS.INPORT_FILL_COLOR
          },
          '.outPorts circle': {
            fill: JOINT_OPTIONS.OUTPORT_FILL_COLOR
          }
        }
      }, joint.shapes.devs.Model.prototype.defaults)
    });

    joint.shapes.devs['PMStartPoint'] = joint.shapes.devs.Model.extend({
      markup: JOINT_OPTIONS.startPoint.markup,
      portMarkup: JOINT_OPTIONS.startPoint.portMarkup,
      defaults: joint.util.deepSupplement(JOINT_OPTIONS.startPoint.defaults, joint.shapes.devs.Model.prototype.defaults)
    });
  }

}
