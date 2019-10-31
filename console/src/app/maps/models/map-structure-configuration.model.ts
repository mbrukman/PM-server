export class MapStructureConfiguration {
  name: string;
  value: object | string;

  constructor(name?: string, value?: object | string) {
    this.name = name;
    this.value = value;
  }
}
