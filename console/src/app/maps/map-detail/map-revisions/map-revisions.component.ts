import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as $ from 'jquery';
import * as joint from 'jointjs';
import {DiffEditorModel} from 'ngx-monaco-editor';
import {PopupService} from '@shared/services/popup.service';
import {MapsService} from '@app/services/map/maps.service';
import {MapStructure, Process} from '@maps/models';
import {JOINT_OPTIONS} from '@maps/constants';
import {Project} from '@projects/models/project.model';
import {ProjectsService} from '@projects/projects.service';
import {SocketService} from '@shared/socket.service';
import {MapDuplicateComponent} from '@maps/map-detail/map-revisions/mapduplicate-popup/mapduplicate-popup.component';
import {FilterOptions} from '@shared/model/filter-options.model';
import {take, filter, mergeMap} from 'rxjs/operators';
import {MapDuplicateOptions} from '@maps/models/map-duplicate-options.model';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-map-revisions',
  templateUrl: './map-revisions.component.html',
  styleUrls: ['./map-revisions.component.scss']
})
export class MapRevisionsComponent implements OnInit, OnDestroy {
  loadStructures = 25;
  previewProcess: Process;
  structures: MapStructure[] = [];
  maxLengthReached: boolean = false;
  mapId: string;
  currentGraph: joint.dia.Graph;
  latestGraph: joint.dia.Graph;
  currentPaper: joint.dia.Paper;
  latestPaper: joint.dia.Paper;
  project: Project;
  page: number = 1;
  currentStructure: MapStructure;
  viewMode: 'code' | 'design' = 'design';
  latestStructure: MapStructure;
  @ViewChild('wrapper') wrapper: ElementRef;
  latestCode: string;
  currentCode: string;

  monacoOptions = {
    theme: 'vs-dark'
  };

  originalModel: DiffEditorModel = {
    code: this.latestCode,
    language: 'text/javascript'
  };

  modifiedModel: DiffEditorModel = {
    code: this.currentCode,
    language: 'text/javascript'
  };

  private mainSubscription = new Subscription();


  constructor(private mapsService: MapsService, private router: Router, private route: ActivatedRoute, private projectsService: ProjectsService, private socketService: SocketService, private popupService: PopupService) {
  }

  ngOnInit() {
    const routeParamsSubscription = this.route.parent.params
      .subscribe(params => {
        this.mapId = params.id;
        this.getMapProject();
        this.loadStructureOnScroll(this.mapId, true);
      });
    this.wrapper.nativeElement.maxHeight = this.wrapper.nativeElement.offsetHeight;
    this.currentGraph = new joint.dia.Graph;
    this.latestGraph = new joint.dia.Graph;
    this.currentPaper = new joint.dia.Paper({
      el: $('#currentGraph'),
      width: this.wrapper.nativeElement.offsetWidth,
      height: this.wrapper.nativeElement.offsetHeight,
      gridSize: 1,
      model: this.currentGraph,
      interactive: false
    });
    this.latestPaper = new joint.dia.Paper({
      el: $('#latestGraph'),
      width: this.wrapper.nativeElement.offsetWidth,
      height: this.wrapper.nativeElement.offsetHeight,
      gridSize: 1,
      model: this.latestGraph,
      interactive: false
    });
    this.defineShape();
    this.currentPaper.scale(0.75, 0.75);
    this.latestPaper.scale(0.75, 0.75);
    this.addPaperDrag();
    this.listeners();

    this.mainSubscription.add(routeParamsSubscription);
  }


  addPaperDrag() {
    let initialPosition = {x: 0, y: 0};
    let move = false;

    const paperOnPointerDown = (event, x, y) => {
      initialPosition = {x: x * 0.75, y: y * 0.75};
      move = true;
    };

    const paperOnPointerUp = () => {
      move = false;
    };

    const graphMouseMove = (paper) => (event) => {
      if (move) {
        paper.translate(event.offsetX - initialPosition.x, event.offsetY - initialPosition.y);
      }
    };

    this.currentPaper.on('blank:pointerdown', paperOnPointerDown);
    this.latestPaper.on('blank:pointerdown', paperOnPointerDown);
    this.currentPaper.on('blank:pointerup', paperOnPointerUp);
    this.latestPaper.on('blank:pointerup', paperOnPointerUp);

    $('#currentGraph').mousemove(graphMouseMove(this.currentPaper));
    $('#latestGraph').mousemove(graphMouseMove(this.latestPaper));
  }

  listeners() {
    this.currentPaper.on('cell:pointerup', (cellView) => {
      if (cellView.model.isLink()) {
        return;
      }
      this.previewProcess = this.currentStructure.processes.find(p => p.uuid === cellView.model.id);
    });
    this.latestPaper.on('cell:pointerup', (cellView) => {
      if (cellView.model.isLink()) {
        return;
      }
      this.previewProcess = this.latestStructure.processes.find(p => p.uuid === cellView.model.id);
    });
  }

  loadStructureOnScroll(mapId = this.mapId, onInit = false) {
    const listStructureSubscription = this.mapsService.structuresList(mapId, this.page)
      .subscribe(structures => {
        if (onInit && structures.length) {
          this.previewStructure(structures[0].id);
        }
        if (structures.length < this.loadStructures) {
          this.maxLengthReached = true;
        }
        for (let i = 0, length = structures.length; i < length; i++) {
          this.structures.push(structures[i]);
        }
      });

    this.mainSubscription.add(listStructureSubscription);
  }

  onScroll() {
    if (!this.maxLengthReached) {
      return;
    }
    this.page++;
    this.loadStructureOnScroll();
  }

  getMapProject() {
    const mapIdFilter = {maps: {$in: [this.mapId]}};
    const filterOptions: FilterOptions = {
      isArchived: false,
      globalFilter: null,
      sort: '-createdAt',
      filter: mapIdFilter
    };

    const filterProjectSubscription = this.projectsService.filter(null, filterOptions).subscribe(data => {
      data.items.forEach(project => {
        if ((<string[]>project.maps).indexOf(this.mapId) > -1) {
          this.project = project;
        }
      });
    });

    this.mainSubscription.add(filterProjectSubscription);
  }

  changeStructure(structureId) {
    const getMapStructSubscription = this.mapsService.getMapStructure(this.mapId, structureId).subscribe(structure => {
      this.mapsService.setCurrentMapStructure(structure);
      this.socketService.setNotification({
        title: 'Changed version',
        type: 'info'
      });
    });

    this.mainSubscription.add(getMapStructSubscription);
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

  duplicateMap(structureId: string) {
    const popUpSubscription = this.popupService.openComponent(MapDuplicateComponent, {})
      .pipe(
        take(1),
        filter(obj => !!(<MapDuplicateOptions>obj).name), // filtering only results with a name
        mergeMap(obj => this.mapsService.duplicateMap(this.mapId, structureId, this.project.id, <MapDuplicateOptions>obj))
      ).subscribe(map => {
        this.router.navigate(['/maps', map.id]);
      });

    this.mainSubscription.add(popUpSubscription);
  }

  previewStructure(structureId: string) {
    this.previewProcess = null;
    const getMapStructSubscription = this.mapsService.getMapStructure(this.mapId, structureId)
      .subscribe(structure => {
        this.currentStructure = structure;
        this.currentGraph.fromJSON(JSON.parse(structure.content));
        this.originalModel = {
          code: structure.code,
          language: 'javascript'
        };
        if (!this.latestStructure) {
          this.setLatestStructure(this.mapId, this.structures[0].id);
        }

        if (this.viewMode === 'code') {
          this.loadCodeDiff();
        }
      });

    this.mainSubscription.add(getMapStructSubscription);
  }

  onResize() {
    // when resizing window currentPaper size should be updated
    this.currentPaper.setDimensions(this.wrapper.nativeElement.offsetWidth, this.wrapper.nativeElement.offsetHeight);
    this.latestPaper.setDimensions(this.wrapper.nativeElement.offsetWidth, this.wrapper.nativeElement.offsetHeight);
  }

  changeMode(mode: 'code' | 'design') {
    this.viewMode = mode;
    this.currentGraph.clear();
    if (mode === 'code') {
      this.loadCodeDiff();
    } else {
      setTimeout(() => {
        this.currentGraph.fromJSON(JSON.parse(this.currentStructure.content));
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
      this.latestStructure = structure;
      this.latestGraph.fromJSON(JSON.parse(this.latestStructure.content));
      this.modifiedModel.code = structure.code;
    });
  }

  onClose() {
    this.previewProcess = null;
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }


}
