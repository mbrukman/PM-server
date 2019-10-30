import { ILink } from '@maps/interfaces/map-structure.interface';

export class Link implements ILink {
  id?: string;
  _id?: string;
  sourceId: string;
  targetId: string;
  uuid?: string;
  createdAt?: Date;
}
