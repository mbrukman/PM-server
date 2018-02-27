import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'in'
})
export class InPipe implements PipeTransform {

  transform(value: any[], args: any[]): any {
    if (!args) {
      return value;
    }
    return value.filter(o => args.indexOf(o.id) > -1);
  }

}
