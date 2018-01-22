import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(value: any[], args: { term: string, param: string }): any {
    if (!args || !args.term)
      return value;

    return value.filter(obj => obj[args.param].toLowerCase().includes(args.term.toLowerCase()))
  }

}
