import * as joint from 'jointjs';

export const PMCell = joint.dia.Element.define('examples.Ellipse', {
  markup: '<ellipse/>',
  attrs: {
    rect: {
      fill: 'red',
      stroke: 'black',
      refRx: .5,
      refRy: .5,
      refCx: .5,
      refCy: .5
    }
  }
});
