import { AfterContentInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as $ from 'jquery';
import * as joint from 'jointjs';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';

import { MapDesignService } from '../map-design.service';
import { Link, MapStructure, Process } from '../../../models/map-structure.model';
import { MapsService } from '../../../maps.service';
import { PluginsService } from '../../../../plugins/plugins.service';
import { Plugin } from '../../../../plugins/models/plugin.model';


@Component({
  selector: 'app-map-design',
  templateUrl: './map-design.component.html',
  styleUrls: ['./map-design.component.scss']
})
export class MapDesignComponent implements OnInit, AfterContentInit, OnDestroy {
  dropSubscription: Subscription;
  graph: joint.dia.Graph;
  paper: joint.dia.Paper;
  mapStructure: MapStructure;
  mapStructureSubscription: Subscription;
  editing: boolean = false;
  pluginsReq: any;
  plugins: [Plugin];
  process: Process;
  link: Link;
  init: boolean = false;
  scale: number = 1;

  @ViewChild('wrapper') wrapper: ElementRef;

  constructor(private designService: MapDesignService, private mapsService: MapsService, private pluginsService: PluginsService) {
  }

  ngOnInit() {
    this.wrapper.nativeElement.maxHeight = this.wrapper.nativeElement.offsetHeight;
    this.dropSubscription = this.designService.getDrop().subscribe(obj => {
      let offsetLeft = this.wrapper.nativeElement.offsetParent.offsetLeft;
      let offsetTop = this.wrapper.nativeElement.offsetParent.offsetTop;
      let height = this.wrapper.nativeElement.offsetHeight;

      // check if obj is on our map
      if (obj.x - 45 > offsetLeft && obj.y > offsetTop && obj.y < offsetTop + height) {
        this.addNewProcess(obj, offsetLeft, offsetTop);
      }
    });

    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins;
    });
    this.defineShape();
  }

  ngOnDestroy() {
    this.dropSubscription.unsubscribe();
    this.mapStructureSubscription.unsubscribe();
  }

  ngAfterContentInit() {
    this.graph = new joint.dia.Graph;
    this.paper = new joint.dia.Paper({
      el: $('#graph'),
      width: this.wrapper.nativeElement.offsetWidth,
      height: this.wrapper.nativeElement.offsetHeight,
      gridSize: this.scale,
      model: this.graph,
      snapLinks: { radius: 75 },
      linkPinning: true,
      embeddingMode: false,
      defaultLink: new joint.dia.Link({
        router: { name: 'manhattan' },
        connector: { name: 'rounded' },
        attrs: {
          '.connection': {
            stroke: '#87939A',
            'stroke-width': 3
          },
          '.marker-target': {
            fill: '#87939A',
            d: 'M 10 0 L 0 5 L 10 10 z'
          }
        }
      }),
      markAvailable: true,
      validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
        // Prevent linking from input ports.
        if (magnetS && magnetS.getAttribute('port-group') === 'in') {
          return false;
        }
        // Prevent linking from output ports to input ports within one element.
        if (cellViewS === cellViewT) {
          return false;
        }
        // Prevent linking to input ports.
        return magnetT && magnetT.getAttribute('port-group') === 'in';
      },
      validateMagnet: function (cellView, magnet) {
        // Note that this is the default behaviour. Just showing it here for reference.
        // Disable linking interaction for magnets marked as passive (see below `.inPorts circle`).
        return magnet.getAttribute('magnet') !== 'passive';
      },
      interactive: (cellView: any): any => {
        if (cellView.model instanceof joint.dia.Link) {
          // Disable the default vertex add functionality on pointerdown.
          return { vertexAdd: false };
        }
        return true;
      }
    });

    this.resizePaper();

    this.listeners();
    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      this.mapStructure = structure;
      if (structure && !this.init) {
        this.init = true;
        this.drawGraph();
      }
    });
  }

  addNewLink(cell) {
    if (!cell.targetMagnet) {
      cell.remove();
      return;
    }
    if (!this.link) {
      return;
    }
    const link = _.find(this.mapStructure.links, (o) => {
      return (o.targetId === this.link.targetId && o.sourceId === this.link.sourceId)
    });
    if (link) {
      return;
    }

    this.link.uuid = cell.model.id;
    if (!this.mapStructure.links) {
      this.mapStructure.links = [this.link];
    } else {
      this.mapStructure.links.push(this.link);
    }
    this.mapStructure.content = JSON.stringify(this.graph.toJSON());
    this.mapsService.setCurrentMapStructure(this.mapStructure);
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


    joint.shapes.devs['PMStartPoint'] = joint.shapes.devs.Model.extend({

      markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
      portMarkup: '<g class="port"><circle class="port-body"/><text class="port-label"/></g>',

      defaults: joint.util.deepSupplement({

        type: 'devs.PMStartPoint',
        size: { width: 40, height: 39 },
        outPorts: [' '],
        attrs: {
          '.body': { stroke: '#3c3e41', fill: '#2c2c2c', 'rx': 6, 'ry': 6, 'opacity': 0 },
          '.label': {
            text: '', 'ref-y': 0.83, 'y-alignment': 'middle',
            fill: '#f1f1f1', 'font-size': 13
          },
          '.port-body': { r: 7.5, stroke: 'gray', fill: '#2c2c2c', magnet: 'active' },
          'image': {
            'ref-x': 10, 'ref-y': 18, ref: 'rect',
            width: 35, height: 34, 'y-alignment': 'middle',
            'x-alignment': 'middle', 'xlink:href': 'assets/images/start.png'
          }
        }

      }, joint.shapes.devs.Model.prototype.defaults)
    });
  }

  addNewProcess(obj: { x: number, y: number, cell: any }, offsetTop: number, offsetLeft: number) {
    const pluginName = obj.cell.model.attributes.attrs['.label'].text;
    const plugin = this.plugins.find((o) => {
      return o.name === pluginName;
    });

    let imageModel = new joint.shapes.devs['MyImageModel']({
      position: {
        x: obj.x - (300 * this.scale),
        y: obj.y - (270 * this.scale)
      },
      size: {
        width: 110,
        height: 75
      },
      inPorts: [' '],
      outPorts: ['  '],
      attrs: {
        '.label': {
          text: pluginName,
          'ref-y': 5,
          'font-size': 14,
          fill: '#bbbbbb'
        },
        rect: {
          'stroke-width': 1,
          'stroke-opacity': .7,
          'stroke': '#7f7f7f',
          rx: 3,
          ry: 3,
          fill: '#2d3236',
          'fill-opacity': .5
        },
        image: {
          'xlink:href': `plugins/${pluginName}/${plugin.imgUrl}`,
          width: 46,
          height: 32,
          'ref-x': 50,
          'ref-y': 50,
          ref: 'rect',
          'x-alignment': 'middle',
          'y-alignment': 'middle'
        },
        '.inPorts circle': {
          fill: '#c80f15'
        },
        '.outPorts circle': {
          fill: '#262626'
        }
      }
    });
    this.graph.addCell(imageModel);
    let p = new Process();
    p.plugin = plugin;
    p.uuid = <string>imageModel.id;

    if (!this.mapStructure.processes) {
      this.mapStructure.processes = [p];
    } else {
      this.mapStructure.processes.push(p);
    }
    this.mapStructure.content = JSON.stringify(this.graph.toJSON());
    this.mapsService.setCurrentMapStructure(this.mapStructure);
    this.editProcess(this.mapStructure.processes[this.mapStructure.processes.length - 1]);

  }

  drawGraph() {
    if (this.mapStructure.content) {
      this.graph.fromJSON(JSON.parse(this.mapStructure.content));
    } else {
      let startNode = new joint.shapes.devs['PMStartPoint']({
        position: {
          x: 50,
          y: 20
        }
      });
      this.graph.addCell(startNode);
    }
  }

  editProcess(process) {
    if (typeof process.plugin === 'string') {
      process.plugin = this.plugins.find((o) => {
        return o._id === <string>(process.plugin)
      });
    }
    const cell = this.graph.get('cells');
    let model = cell.models.find((o) => {
      return o.id === process.uuid;
    });
    model.attr('rect/fill', '#000000');
    if (this.process) {
      model = cell.models.find((o) => {
        return o.id === this.process.uuid;
      });
      model.attr('rect/fill', '#2d3236');
    }
    this.paper.setDimensions(this.wrapper.nativeElement.offsetWidth - 250, this.wrapper.nativeElement.offsetHeight);
    this.process = process;
    if (this.editing) {
      this.editing = false;
      setTimeout(() => {
        this.editing = true;
      }, 300);
    } else {
      this.editing = true;
    }
  }

  listeners() {
    let self = this;
    let move = false;
    let initialPosition = { x: 0, y: 0 };
    this.paper.on('blank:pointerdown', (event, x, y) => {
      initialPosition = { x: x * this.scale, y: y * this.scale };
      move = true;
    });

    $('#graph').mousemove((event) => {
      if (move)
        self.paper.translate(event.offsetX - initialPosition.x, event.offsetY - initialPosition.y);
    });

    this.paper.on('blank:pointerup', (event, x, y) => {
      move = false;
    });

    this.paper.on('cell:pointerup', (cellView, evt, x, y) => {
      if (cellView.model.isLink()) {
        let link = _.find(this.mapStructure.links, (o) => {
          return o.uuid === cellView.model.id;
        });
        if (!link) {
          this.addNewLink(cellView);
        }
      } else {

        const id = cellView.model.id;
        const process = _.find(this.mapStructure.processes, (o) => {
          return o.uuid === id;
        });
        if (process) {
          this.editProcess(process);
        }
      }

    });

    this.graph.on('change:source change:target', function (link) {
      let sourcePort = link.get('source').port;
      let sourceId = link.get('source').id;
      let targetPort = link.get('target').port;
      let targetId = link.get('target').id;
      if (sourceId && targetId) {
        self.link = { sourceId: sourceId, targetId: targetId };
      } else {
        self.link = null;
      }
    });

    this.graph.on('remove', function (cell, collection, opt) {
      if (cell.isLink()) {
        let linkIndex = _.findIndex(self.mapStructure.links, (o) => {
          return o.uuid === cell.id
        });
        self.mapStructure.links.splice(linkIndex, 1);
        self.mapsService.setCurrentMapStructure(self.mapStructure);
      }
    })
  }

  onClose(event) {
    const cell = this.graph.get('cells');
    const model = cell.models.find((o) => {
      return o.id === this.process.uuid;
    });
    if (model) {
      model.attr('rect/fill', '#2d3236');
    }
    this.editing = false;
    this.process = null;

    this.resizePaper();
  }

  resizePaper() {
    this.paper.setDimensions(
      this.wrapper.nativeElement.offsetWidth - (this.designService.tabOpen && this.editing ? 250 : 0),
      this.wrapper.nativeElement.offsetHeight
    );
  }

  onDelete(event) {
    let processIndex = _.findIndex(this.mapStructure.processes, (o) => {
      return o.uuid === this.process.uuid
    });
    this.mapStructure.processes.splice(processIndex, 1);
    this.graph.removeCells([this.graph.getCell(this.process.uuid)]);
    this.onClose(null);
    this.mapStructure.content = JSON.stringify(this.graph.toJSON());
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

  onSave(process) {
    let index = _.findIndex(this.mapStructure.processes, (o) => {
      return o.uuid === this.process.uuid
    });
    this.mapStructure.processes[index].name = process.name;
    this.mapStructure.processes[index].description = process.description;
    this.mapStructure.processes[index].mandatory = process.mandatory;
    this.mapStructure.processes[index].condition = process.condition;
    this.mapStructure.processes[index].actions = process.actions;
    this.mapStructure.processes[index].correlateAgents = process.correlateAgents;
    this.mapStructure.processes[index].filterAgents = process.filterAgents;
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

  onScale(scale) {
    this.scale += scale;
    this.paper.scale(this.scale, this.scale);
  }

  onResize(event) {
    // when resizing window paper size should be updated
    if (!event) {
      return;
    }
    this.resizePaper();
  }
}
