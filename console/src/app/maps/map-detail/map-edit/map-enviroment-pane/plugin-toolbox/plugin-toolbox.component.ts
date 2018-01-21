import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import * as $ from 'jquery';
import * as joint from 'jointjs';

import { PluginsService } from '../../../../../plugins/plugins.service';
import { Plugin } from '../../../../../plugins/models/plugin.model';
import { MapDesignService } from '../../map-design.service';


@Component({
  selector: 'app-plugin-toolbox',
  templateUrl: './plugin-toolbox.component.html',
  styleUrls: ['./plugin-toolbox.component.scss']
})
export class PluginToolboxComponent implements AfterViewInit, OnDestroy {
  stencilGraph: joint.dia.Graph;
  stencilPaper: joint.dia.Paper;

  plugins: Plugin[];
  pluginsReq: any;
  pluginCell: any;

  constructor(private pluginsService: PluginsService, private designService: MapDesignService) {
  }

  ngAfterViewInit() {

    this.stencilGraph = new joint.dia.Graph;
    this.stencilPaper = new joint.dia.Paper({
      el: $('#stencil'),
      width: 250,
      height: 80,
      gridSize: 1,
      model: this.stencilGraph,
      interactive: false
    });

    joint.shapes.devs['MyImageModel'] = joint.shapes.devs.Model.extend({

      markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',

      defaults: joint.util.deepSupplement({

        type: 'devs.MyImageModel',
        size: {
          width: 108,
          height: 73
        },
        attrs: {
          rect: {
            'stroke-width': '1',
            'stroke-opacity': .7,
            stroke: '#7f7f7f',
            rx: 3,
            ry: 3,
            fill: '#2d3236',
            'fill-opacity': .5
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
            'ref-y': 60,
            ref: 'rect',
            'x-alignment': 'middle',
            'y-alignment': 'middle'
          }
        }
      }, joint.shapes.devs.Model.prototype.defaults)
    });

    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins.filter(plugin => {
        return plugin.type === 'executer'
      });
      this.addPluginsToGraph();
    });

    this.stencilPaper.on('cell:pointerdown', (cellView, event, x, y) => {
        this.flyCell(cellView, event, x, y);
      }
    );
  }

  flyCell(cellView, event, x, y) {
    let self = this;
    $('body').append('<div id="flyPaper" style="position:fixed;z-index:100;opacity:.7;pointer-event:none;background: transparent"></div>');
    var flyGraph = new joint.dia.Graph,
      flyPaper = new joint.dia.Paper({
        el: $('#flyPaper'),
        model: flyGraph,
        interactive: false
      }),
      flyShape = cellView.model.clone(),
      pos = cellView.model.position(),
      offset = {
        x: x - pos.x,
        y: y - pos.y
      };

    flyShape.position(0, 0);
    flyGraph.addCell(flyShape);
    $('#flyPaper').offset({
      left: event.pageX - offset.x,
      top: event.pageY - offset.y
    });
    $('body').on('mousemove.fly', function (e) {
      $('#flyPaper').offset({
        left: e.pageX - offset.x,
        top: e.pageY - offset.y
      });
    });

    $('body').on('mouseup.fly', function (e) {
      let x = e.pageX;
      let y = e.pageY;

      $('body').off('mousemove.fly').off('mouseup.fly');
      flyShape.remove();
      self.designService.drop(x, y, cellView);
      $('#flyPaper').remove();
    });
  }

  addPluginsToGraph() {
    let plugins = [];
    let iteration = 0;
    this.plugins.forEach(plugin => {
      console.log((iteration % 2 ? iteration * 73 : Math.abs((iteration - 1) * 73)) + 16);
      let imageModel = new joint.shapes.devs['MyImageModel']({
        position: {
          x: iteration % 2 ? 115 : 5,
          y: (iteration % 2 ? (iteration - 1) * 42 : iteration * 42) + 15
        },
        size: {
          width: 100,
          height: 73
        },
        attrs: {
          '.label': { text: plugin.name },
          image: {
            'xlink:href': `plugins/${plugin.name}/${plugin.imgUrl}`,
            width: 46,
            height: 32,
            'ref-x': 50,
            'ref-y': 50,
            ref: 'rect',
            'x-alignment': 'middle',
            'y-alignment': 'middle'
          }
        }
      });
      plugins.push(imageModel);
      iteration++;
    });
    this.stencilPaper.setDimensions(250, iteration * 80);
    this.stencilGraph.addCells(plugins);
  }

  ngOnDestroy() {
    this.pluginsReq.unsubscribe();
  }

}
