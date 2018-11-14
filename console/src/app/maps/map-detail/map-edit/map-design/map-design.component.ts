import { AfterContentInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as $ from 'jquery';
import * as joint from 'jointjs';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';

import { MapDesignService } from '../map-design.service';
import { Link, MapStructure, Process } from '@maps/models';
import { MapsService } from '@maps/maps.service';
import { PluginsService } from '@plugins/plugins.service';
import { Plugin } from '@plugins/models/plugin.model';

export const linkAttrs = {
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
};

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
  plugins: Plugin[];
  process: Process;
  link: Link;
  init: boolean = false;
  scale: number = 1;

  defaultContent: string;
  @ViewChild('wrapper') wrapper: ElementRef;

  constructor(private designService: MapDesignService,
              private mapsService: MapsService,
              private pluginsService: PluginsService,
              private mapDesignService: MapDesignService) { }

  ngOnInit() {
    this.defineShape();
    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins;
    });

    this.wrapper.nativeElement.maxHeight = this.wrapper.nativeElement.offsetHeight;
    this.dropSubscription = this.designService
      .getDrop()
      .filter(obj => this.isDroppedOnMap(obj.x, obj.y))
      .subscribe(obj => {
        let offsetLeft = this.wrapper.nativeElement.offsetParent.offsetLeft;
        let offsetTop = this.wrapper.nativeElement.offsetParent.offsetTop;
        this.addNewProcess(obj, offsetLeft, offsetTop);
      });

  }

  ngOnDestroy() {
    this.dropSubscription.unsubscribe();
    this.mapStructureSubscription.unsubscribe();
    this.deselectAllCellsAndUpdateStructure();
  }

  ngAfterContentInit() {
    this.graph = new joint.dia.Graph;
    this.paper = new joint.dia.Paper({
      el: $('#graph'),
      width: this.wrapper.nativeElement.offsetWidth,
      height: this.wrapper.nativeElement.offsetHeight - 80,
      gridSize: this.scale,
      model: this.graph,
      snapLinks: { radius: 75 },
      linkPinning: true,
      embeddingMode: false,
      defaultLink: new joint.dia.Link(linkAttrs),
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

    this.listeners();
    this.mapStructureSubscription = this.mapsService
      .getCurrentMapStructure()
      .do(structure => this.mapStructure = structure)
      .filter(structure => !!structure)
      .subscribe(structure => {
        if (!this.init || (<any>structure).imported) {
          this.drawGraph();
          this.init = true;
          this.graph.getElements().forEach(cell => {
            this.deselectCell(cell);
          });
          this.defaultContent = JSON.stringify(this.graph.toJSON());
          if ((<any>structure).imported) {
            delete (<any>structure).imported;
            this.mapStructure = structure;
            this.deselectAllCellsAndUpdateStructure();
          }
        }
      });
     
 
  }
  /**
   * Check if the x, y are over the map
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isDroppedOnMap(x: number, y: number): boolean {
    let offsetLeft = this.wrapper.nativeElement.offsetLeft;
    let offsetTop = this.wrapper.nativeElement.offsetTop;
    let height = this.wrapper.nativeElement.offsetHeight;
    return (x > offsetLeft) && (y > offsetTop) && (y < offsetTop + height);
  }

  deselectAllCellsAndUpdateStructure() {
    this.graph.getElements().forEach(cell => {
        this.deselectCell(cell);
    });
    this.onMapContentUpdate();
  }

  addNewLink(cell) {
    if (!cell.targetMagnet) {
      this.graph.getCell(cell.model.id).remove();
      return;
    }
    if (!this.link) {
      return;
    }
    const link = _.find(this.mapStructure.links, (o) => {
      return (o.targetId === this.link.targetId && o.sourceId === this.link.sourceId);
    });
    if (link) {
      return;
    }

    this.link.uuid = cell.model.id;

    this.mapStructure.links.push(this.link);


    const ancestors = this.mapStructure.links.filter(link => link.targetId === this.link.targetId);
    if (ancestors.length > 1) {
      const processIndex = this.mapStructure.processes.findIndex(process => process.uuid === this.link.targetId);
      if (!this.mapStructure.processes[processIndex].coordination) {
        this.mapStructure.processes[processIndex].coordination = 'wait';
        this.mapDesignService.updateProcess(this.mapStructure.processes[processIndex]);
      }
    }
    this.deselectAllCellsAndUpdateStructure();
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
        outPorts: ['  '],
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
        x: obj.x - (430 * this.scale),
        y: obj.y - (240 * this.scale)
      },
      size: {
        width: 100,
        height: 73
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
          'xlink:href': plugin.fullImageUrl,
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
    p.used_plugin = { name: pluginName, version: plugin.version };
    p.uuid = <string>imageModel.id;

    if (!this.mapStructure.processes) {
      this.mapStructure.processes = [p];
    } else {
      this.mapStructure.processes.push(p);
    }
    this.deselectAllCellsAndUpdateStructure();
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

      if (this.mapStructure.processes.length) {
        this.mapStructure.processes.forEach((process, i) => {
          let plugin = this.plugins.find((p) => p.name === process.used_plugin.name);
          let imageModel = new joint.shapes.devs['MyImageModel']({
            id: process.uuid,
            position: {
              x: ((i + 1) * 160),
              y: 200
            },
            size: {
              width: 100,
              height: 73
            },
            inPorts: [' '],
            outPorts: ['  '],
            attrs: {
              '.label': {
                text: process.name || process.used_plugin.name,
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
                'xlink:href': plugin.fullImageUrl,
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

        });

        if (this.mapStructure.links.length) {
          this.mapStructure.links.forEach((link, i) => {
            if (!this.mapStructure.processes.find(p => p.uuid === link.sourceId)) {
              link.sourceId = startNode.id;
            }
            let newLink = new joint.shapes.devs.Link({
              ...linkAttrs,
              source: {
                id: link.sourceId,
                port: '  '
              },
              target: {
                id: link.targetId,
                port: ' '
              }
            });
            this.graph.addCell(newLink);
          });
        }

        this.onMapContentUpdate();
      }
    }
  }

  editProcess(process) {
    if (!process.plugin) {
      process.plugin = this.plugins.find((o) => o.name === process.used_plugin.name);
    }
    this.graph.getElements().forEach(c => this.deselectCell(c));
    const cell = this.graph.getCell(process.uuid);
    this.selectCell(cell);
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
      if (move) {
        self.paper.translate(event.offsetX - initialPosition.x, event.offsetY - initialPosition.y);
      }
    });

    this.paper.on('blank:pointerup', (event, x, y) => {
      move = false;

      // closing process pane if opened
      if (this.process) {
        this.onClose();
      }
    });

    this.paper.on('cell:pointerup', (cellView, evt, x, y) => {
      this.deselectAllCellsAndUpdateStructure();
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

    // remove a link
    this.graph.on('remove', function (cell, collection, opt) {
      if (cell.isLink()) {
        let linkIndex = _.findIndex(self.mapStructure.links, (o) => {
          return o.uuid === cell.id;
        });
        if (linkIndex === -1) {
          self.deselectAllCellsAndUpdateStructure();
          return;
        }
        const targetUuid = cell.get('target').id;
        self.mapStructure.links.splice(linkIndex, 1);
        const siblingLinks = self.mapStructure.links.filter(o => o.targetId === targetUuid);
        if (siblingLinks && siblingLinks.length <= 1) {
          let p = self.mapStructure.processes.find(o => o.uuid === targetUuid);
          if (!p) {
            return;
          }
          delete p.coordination;
          self.mapDesignService.updateProcess(p);
        }
        self.deselectAllCellsAndUpdateStructure();
      }
    });
  }

  onClose(event?) {
    this.deselectCell(this.graph.getCell(this.process.uuid));

    this.editing = false;
    this.process = null;
  }

  onDelete(event) {
    let processIndex = _.findIndex(this.mapStructure.processes, (o) => {
      return o.uuid === this.process.uuid;
    });
    this.mapStructure.processes.splice(processIndex, 1);
    this.graph.removeCells([this.graph.getCell(this.process.uuid)]);
    this.editing = false;
    this.process = null;
    this.deselectAllCellsAndUpdateStructure();
  }

  onSave(process) {
    let index = _.findIndex(this.mapStructure.processes, (o) => {
      return o.uuid === this.process.uuid;
    });

    this.updateNodeLabel(process.uuid, process.name || this.process.used_plugin.name);
    this.mapStructure.processes[index].name = process.name;
    this.mapStructure.processes[index].description = process.description;
    this.mapStructure.processes[index].mandatory = process.mandatory;
    this.mapStructure.processes[index].condition = process.condition;
    this.mapStructure.processes[index].coordination = process.coordination;
    this.mapStructure.processes[index].actions = process.actions;
    this.mapStructure.processes[index].correlateAgents = process.correlateAgents;
    this.mapStructure.processes[index].flowControl = process.flowControl;
    this.mapStructure.processes[index].filterAgents = process.filterAgents;
    this.mapStructure.processes[index].postRun = process.postRun;
    this.mapStructure.processes[index].preRun = process.preRun;
    delete this.mapStructure.processes[index].plugin;
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }


  /**
   * Updating node label
   * @param {string} uuid
   * @param {string} label
   */
  updateNodeLabel(uuid: string, label: string): void {
    let cell = this.graph.getCell(uuid);
    cell.attr('text/text', label);
    this.onMapContentUpdate()
  }

  onScale(scale) {
    this.scale += scale;
    this.paper.scale(this.scale, this.scale);
  }

  selectCell(cell) {
    cell.attr('rect/fill', '#000');
  }

  deselectCell(cell) {
    cell.attr('rect/fill', '#2d3236');
  }

  private onMapContentUpdate(){
    let graphContent = JSON.stringify(this.graph.toJSON());
    if(graphContent != this.defaultContent){
      this.mapStructure.content = graphContent;
      this.mapsService.setCurrentMapStructure(this.mapStructure);
    }
  }
}
