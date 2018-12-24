const WAIT = 'wait';
const RACE = 'race';
const EACH = 'each';


export const COORDINATION_TYPES = {
  wait: { id: WAIT, label: 'Wait for all' },
  race: { id: RACE, label: 'Run once for first' },
  each: { id: EACH, label: 'Run for each in link' }
};

export const FLOW_CONTROL_TYPES = {
  wait: { id: WAIT, label: 'Wait for all agents and then run' },
  race: { id: RACE, label: 'Run only for first agent' },
  each: { id: EACH, label: 'Run for each agent' }
};

export const JOINT_OPTIONS = {
  RECT_STROKE_COLOR : '#7f7f7f',
  RECT_FILL_COLOR : '#2d3236',
  LABEL_FILL_COLOR : '#bbbbbb',
  INPORT_FILL_COLOR : '#c8c8c8',
  OUTPORT_FILL_COLOR : '#262626',
  LINK_COLOR : '#87939A',
  startPoint : {
    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
    portMarkup: '<g class="port"><circle class="port-body"/><text class="port-label"/></g>',
    defaults : {
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
    }
  }
}