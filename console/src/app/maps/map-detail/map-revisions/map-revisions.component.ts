import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import * as $ from 'jquery';
import * as joint from 'jointjs';

import { MapsService } from '../../maps.service';
import { MapStructure } from '../../models/map-structure.model';
import { SocketService } from '../../../shared/socket.service';
import { ProjectsService } from '../../../projects/projects.service';
import { Project } from '../../../projects/models/project.model';

@Component({
  selector: 'app-map-revisions',
  templateUrl: './map-revisions.component.html',
  styleUrls: ['./map-revisions.component.scss']
})
export class MapRevisionsComponent implements OnInit {
  structures: MapStructure[];
  structureId: string;
  mapId: string;
  graph: joint.dia.Graph;
  paper: joint.dia.Paper;
  projectsReq: any;
  project: Project;
  @ViewChild('wrapper') wrapper: ElementRef;

  constructor(private mapsService: MapsService, private router: Router, private route: ActivatedRoute, private projectsService: ProjectsService, private socketServiec: SocketService) {
  }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.mapId = params.id;
      this.getMapProject();
      this.mapsService.structuresList(params.id).subscribe(structures => {
        this.structures = structures
      });
    });
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



  }

  getMapProject() {
    this.projectsReq = this.projectsService.filter().subscribe(data => {
      data.items.forEach(project => {
        if ((<string[]>project.maps).indexOf(this.mapId) > -1 ) {
          this.project = project;
        }
      });
    });
  }

  changeStructure(structureId) {
    this.mapsService.getMapStructure(this.mapId, structureId).subscribe(structure => {
      this.mapsService.setCurrentMapStructure(structure);
      this.socketServiec.setNotification({
        title: 'Changed version',
        type: 'info'
      })
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
            stroke: '#7f7f7f',
            rx: 3,
            ry: 3,
            fill: '#2d3236'
            // 'fill-opacity': .5
          },
          circle: {
            stroke: 'gray'
          },
          '.label': {
            text: '',
            'ref-y': 5,
            'font-size': 14,
            fill: '#bbbbbb'
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
            fill: '#c8c8c8'
          },
          '.outPorts circle': {
            fill: '#262626'
          }
        }
      }, joint.shapes.devs.Model.prototype.defaults)
    });
  }

  duplicateMap(structureId) {
    this.mapsService.duplicateMap(this.mapId, structureId, this.project.id).subscribe(map => {
      this.router.navigate(['/maps', map.id])
    });
  }

  previewStructure(structureId) {
    this.mapsService.getMapStructure(this.mapId, structureId).subscribe(structure => {
      this.graph.fromJSON(JSON.parse(structure.content));
    });
  }

  onResize(event) {
    // when resizing window paper size should be updated
    this.paper.setDimensions(this.wrapper.nativeElement.offsetWidth, this.wrapper.nativeElement.offsetHeight);
  }

}
