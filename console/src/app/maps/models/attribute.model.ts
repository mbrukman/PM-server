import { IAttribute } from '@maps/interfaces/attribute.interface';

export class Attribute implements IAttribute {
  name: string;
  type: string;
  value: any;
}
