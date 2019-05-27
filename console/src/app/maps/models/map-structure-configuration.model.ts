export class MapStructureConfiguration {
  name: string;
  value: object | string;

  constructor(name?, value?) {
    this.name = name;
    this.value = value;
  }
}
