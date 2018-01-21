import { IProject } from "../interfaces/project.interface";
import { Map } from "../../maps/models/map.model";

export class Project implements IProject {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  archived?: boolean;
  maps?: [string] | [Map];
}
