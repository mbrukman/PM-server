import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncatechars'
})
export class TruncatecharsPipe implements PipeTransform {
  /*
  * value: the string to truncate
  * len: amount of chars
  * etc: the value to add in the end of the string, which is included in the total chars
  * */
  transform(value: string, len: number, etc: string = '...'): string {
    if (!value || value.length < len) {
      return value;
    }
    return value.slice(0, len - etc.length) + etc;
  }

}
