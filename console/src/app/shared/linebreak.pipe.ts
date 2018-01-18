import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'linebreak'
})
export class LinebreakPipe implements PipeTransform {

  transform(value: any): any {
    console.log(value.split("\\n").join("<br>"))
    return value.split("\\n").join("<br>");
  }

}
