import { ILink } from '@maps/interfaces/map-structure.interface';

export class Link implements ILink {
  id?: string;
  // tslint:disable-next-line:variable-name
  _id?: string;
  sourceId: string;
  targetId: string;
  uuid?: string;
  createdAt?: Date;
}
