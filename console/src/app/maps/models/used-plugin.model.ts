import { IUsedPlugin } from '../interfaces/map-structure.interface';

export class UsedPlugin implements IUsedPlugin {
  _id?: string;
  name: string;
  version: string;
}
