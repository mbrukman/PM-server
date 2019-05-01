import { AfterContentInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as $ from 'jquery';
import * as joint from 'jointjs';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { MapDesignService } from '../map-design.service';
import { Link, MapStructure, Process, ProcessViewWrapper } from '@maps/models';
import { MapsService } from '@maps/maps.service';
import { PluginsService } from '@plugins/plugins.service';
import { Plugin } from '@plugins/models/plugin.model';
import { COORDINATION_TYPES, JOINT_OPTIONS } from '@maps/constants'
import { filter, tap } from 'rxjs/operators';

export const linkAttrs = {
  router: { name: 'manhattan' },
  connector: { name: 'rounded' },
  attrs: {
    '.connection': {
      stroke: JOINT_OPTIONS.LINK_COLOR,
      'stroke-width': 3
    },
    '.marker-target': {
      fill: JOINT_OPTIONS.LINK_COLOR,
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
  pluginsReq: Subscription;
  plugins: Plugin[];
  process: Process;
  link: Link;
  init: boolean = false;
  scale: number = 1;
  cellView:any;
  processViewWrapper: ProcessViewWrapper;
  scaleX = 430;
  scaleY = 240;
  @ViewChild('wrapper') wrapper: ElementRef;

  constructor(
    private mapsService: MapsService,
    private pluginsService: PluginsService,
    private mapDesignService: MapDesignService) { }

  ngOnInit() {
    this.defineShape();
    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins;
      this.initMapDraw();
    });

    this.wrapper.nativeElement.maxHeight = this.wrapper.nativeElement.offsetHeight;
    this.dropSubscription = this.mapDesignService
      .getDrop().pipe(
        filter(obj => this.isDroppedOnMap(obj.x, obj.y))
      ).subscribe(obj => {
        this.cellView = obj.cell;
        this.addNewProcess(obj,new Process());
      });

  }

  ngOnDestroy() {
    this.dropSubscription.unsubscribe();
    this.mapStructureSubscription.unsubscribe();
    this.pluginsReq.unsubscribe();
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
      .getCurrentMapStructure().pipe(
        tap(structure => this.mapStructure = structure),
        filter(structure => !!structure)
      ).subscribe(structure => {
        this.initMapDraw();
        for(let i=0,length=structure.processes.length;i<length;i++){
          let imageProcess = this.graph.getCell(structure.processes[i].uuid)
          for(let j =0,pluginsLength = this.plugins.length;j<pluginsLength;j++){
            if(imageProcess.attributes.attrs['.p_id'].text == '' && this.plugins[j].name == structure.processes[i].used_plugin.name){
              this.updateNodePid(structure.processes[i].uuid,this.plugins[j].id);
              break;
            }
          }
        }
        this.onMapContentUpdate()
      });
  }

  initMapDraw() {
    if (!this.init && this.plugins && this.mapStructure) {
      this.drawGraph();
      this.init = true;
      this.graph.getElements().forEach(cell => {
        this.setCellSelectState(cell,false);
      });

      if ((<any>(this.mapStructure)).imported) {
        delete (<any>(this.mapStructure)).imported;
        this.deselectAllCellsAndUpdateStructure();
      }
    }
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
    this.processViewWrapper = this.process ? new ProcessViewWrapper(this.process, this.mapStructure, this.plugins) : null;
    this.graph.getElements().forEach(cell => {
      this.setCellSelectState(cell, false);
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
      link.uuid = cell.model.id;
      return;
    }

    this.link.uuid = cell.model.id;
    this.mapStructure.links.push(this.link);

    const ancestors = this.mapStructure.links.filter(link => link.targetId === this.link.targetId);
    if (ancestors.length > 1) {
      const processIndex = this.mapStructure.processes.findIndex(process => process.uuid === this.link.targetId);
      if (this.isLoopInProcessByAncestors(ancestors)) {
        this.mapStructure.processes[processIndex].coordination = COORDINATION_TYPES.race.id;
      }
      else if (!this.mapStructure.processes[processIndex].coordination) {
        this.mapStructure.processes[processIndex].coordination = COORDINATION_TYPES.wait.id;
      }
      this.mapDesignService.updateProcess(this.mapStructure.processes[processIndex]);
    }
    this.deselectAllCellsAndUpdateStructure();
  }

  isLoopInProcessByAncestors(ancestors) {
    return ancestors.find(link => link.sourceId == link.targetId) ? true : false;
  }

  defineShape() {
    joint.shapes.devs['MyImageModel'] = joint.shapes.devs.Model.extend({
      markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><image class="warning"/><text class="label"/><g class="p_id"/><g class="inPorts"/><g class="outPorts"/></g>',
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
          '.p_id': { text:''},
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

  addNewProcess(obj: { x: number, y: number, cell: any },process : Process) {
    const pluginDisplayName = obj.cell.model.attributes.attrs['.label'].text;
    const pluginId = obj.cell.model.attributes.attrs['.p_id'].text;
    const plugin = this.plugins.find((o) => {
      return o._id === pluginId;
    });

    let imageModel = this.getPluginCube({
      x: obj.x - (this.scaleX * this.scale) - this.paper.translate().tx,
      y: obj.y - (this.scaleY * this.scale) - this.paper.translate().ty
    }, pluginDisplayName, plugin.fullImageUrl,pluginId);

    this.graph.addCell(imageModel);

    process.used_plugin = { name: plugin.name, version: plugin.version };
    process.uuid = <string>imageModel.id;
    
    if (!this.mapStructure.processes) {
      this.mapStructure.processes = [process];
    } else {
      this.mapStructure.processes.push(process);
    }
    this.deselectAllCellsAndUpdateStructure();
    this.editProcess(this.mapStructure.processes[this.mapStructure.processes.length - 1]);
  }

  drawGraph() {
    if (this.mapStructure.content) {
      var cells = JSON.parse(this.mapStructure.content).cells
      for (let i = 0, cellsLength = cells.length; i < cellsLength; i++) {
        if (cells[i].type != 'devs.MyImageModel')
          continue;

        for (let j = 0, procLength = this.mapStructure.processes.length; j < procLength; j++) {
          if (cells[i].id == this.mapStructure.processes[j].uuid) {
            this.processViewWrapper = new ProcessViewWrapper(this.mapStructure.processes[j], this.mapStructure, this.plugins)
            this.setProcessWarning(cells[i].attrs);
            break;
          }
        }
      }

      var content = JSON.parse(this.mapStructure.content);
      content.cells = cells;
      this.graph.fromJSON(content);

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
          let imageModel = this.getPluginCube({
            x: ((i + 1) * 160),
            y: 200
          }, process.name || process.used_plugin.name, plugin.fullImageUrl,plugin.id, process.uuid);

          this.processViewWrapper = new ProcessViewWrapper(this.process, this.mapStructure, this.plugins)
          this.setProcessWarning(imageModel);
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
    this.center();
  }

  center() {
    let bbox = this.graph.getBBox(this.graph.getElements());
    let y = 10 + Math.abs(bbox.y)
    let x = 10 + Math.abs(bbox.x)
    this.paper.translate(x, y)
  }

  editProcess(process) {
    this.graph.getElements().forEach(c => this.setCellSelectState(c,false));
    const cell = this.graph.getCell(process.uuid);
    this.setCellSelectState(cell);
    this.paper.setDimensions(this.wrapper.nativeElement.offsetWidth - 250, this.wrapper.nativeElement.offsetHeight);
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
        this.cellView = cellView;
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
      let id = link.get('id')

      if (sourceId && targetId) {
        self.link = { uuid: id, sourceId: sourceId, targetId: targetId };
        for (let j = 0, linklenght = self.mapStructure.links.length; j < linklenght; j++) {
          if (self.mapStructure.links[j].uuid === id) {
            self.mapStructure.links[j] = self.link;
            break;
          }
        }
        self.deselectAllCellsAndUpdateStructure();
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
    this.setCellSelectState(this.graph.getCell(this.process.uuid),false);

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
    this.mapsService.setCurrentMapStructure(this.mapStructure);
    this.deselectAllCellsAndUpdateStructure();
  }

  onClone(){
    let cell = _.cloneDeep(this.cellView);
    let processName =  cell.model.attributes.attrs['.label'].text;
    cell.model.attributes.attrs['.label'].text=processName+ ' (copy)';
    let p = _.cloneDeep(this.process);
    p.name = cell.model.attributes.attrs['.label'].text;
    this.addNewProcess(this.getClonePosition(cell),p)
  } 

  getClonePosition(cellView){

    let cell =  this.graph.getCell(this.process.uuid)
    return {
      x:cell.attributes.position.x + (this.scaleX * this.scale) + this.paper.translate().tx + 90,// 90 and 63 represents the distance between the clone and the original process in x and y absciss respectively.
      y:cell.attributes.position.y + (this.scaleY * this.scale) + this.paper.translate().ty + 63,
      cell:cellView
    }
  }

  onSave(process) {
    let index = _.findIndex(this.mapStructure.processes, (o) => {
      return o.uuid === this.process.uuid;
    });
    this.updateNodeLabel(process.uuid, process.name || this.process.used_plugin.name);
    let updateFields = ['name', 'description', 'mandatory', 'condition', 'coordination', 'actions', 'correlateAgents', 'flowControl', 'filterAgents', 'postRun', 'preRun']
    for (let i=0, length=updateFields.length;i<length;i++){
      this.mapStructure.processes[index][updateFields[i]] =  process[updateFields[i]];
    }
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

  /**
   * Updating node label
   * @param {string} uuid
   * @param {string} label
   */
  updateNodeLabel(uuid: string, label: string): void {
    let cell = this.graph.getCell(uuid);
    cell.attr('.label/text',label);
    cell.attr('text/text', label);
    this.cellView.model.attributes.attrs['.label'].text = cell.attributes.attrs['.label'].text
    this.onMapContentUpdate()
  }

  updateNodePid(uuid:string,id:string){
    let cell = this.graph.getCell(uuid);
    cell.attr('.p_id/text',id);
  }

  onScale(scale) {
    this.scale += scale;
    this.paper.scale(this.scale, this.scale);
  }

  setCellSelectState(cell, mode:boolean = true) {
    cell.attr('rect/fill', mode ? '#000' : '#2d3236');
  }

  setProcessWarning(model) {
    model['.warning'] = !this.processViewWrapper.plugin ?{
      'xlink:href': 'assets/images/warning.png',
      width: 19,
      height: 19,
      'ref-x': 98,
      'ref-y': 52,
      ref: 'rect',
      'x-alignment': 'right',
      'y-alignment': 'top'
    } : {}
  }


  
  private getPluginCube(position: { x: number, y: number }, text: string, imageUrl: string, pluginId,id?) {
    if (text.length > 15) {
      text = `${text.substr(0, 12)}...`;
    }
    let options = {
      id: id ? id : undefined,
      position: position,
      size: {
        width: 100,
        height: 73
      },
      inPorts: [' '],
      outPorts: ['  '],
      attrs: {
        '.label': {
          text: text,
          'ref-y': 5,
          'font-size': 14,
          fill: JOINT_OPTIONS.LABEL_FILL_COLOR
        },
        '.p_id':{
          text:pluginId
        },
        rect: {
          'stroke-width': 1,
          'stroke-opacity': .7,
          'stroke': JOINT_OPTIONS.RECT_STROKE_COLOR,
          rx: 3,
          ry: 3,
          fill: JOINT_OPTIONS.RECT_FILL_COLOR,
          'fill-opacity': .5
        },
        image: {
          'xlink:href': imageUrl,
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
    }


    return new joint.shapes.devs['MyImageModel'](options);
  }

  private onMapContentUpdate() {
    let graphContent = JSON.stringify(this.graph.toJSON());
    if ((graphContent != this.mapStructure.content) && (this.mapStructure)) {
      this.mapStructure.content = graphContent;
      this.mapsService.setCurrentMapStructure(this.mapStructure);
    }
  }


}
