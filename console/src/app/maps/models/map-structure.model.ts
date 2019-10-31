import { Plugin } from '@plugins/models/plugin.model';
import { IMapStructure } from '@maps/interfaces/map-structure.interface';
import { MapStructureConfiguration, Process, UsedPlugin, Link } from '.';

export class MapStructure implements IMapStructure {
  id?: string;
  // tslint:disable-next-line:variable-name
  _id?: string;
  createdAt: Date;
  updatedAt: Date;
  map: string;
  content: any;
  code?: string;
  configurations?: MapStructureConfiguration[];
  processes?: Process[];
  links?: Link[];
  plugins?: Plugin[];
  used_plugins: UsedPlugin[];

  constructor() {
    this.processes = [];
    this.configurations = [];
    this.links = [];

  }
}
