import { Pipe, PipeTransform } from '@angular/core';
import { Asset } from '../skip';

@Pipe({
  name: 'denomsFilter',
  standalone: true,
})
export class DenomsFilterPipe implements PipeTransform {
  transform(denoms: Asset[], text: string): any {
    if (!denoms || !text || text === '') {
      return denoms;
    }
    // filter items array, items which match and return true will be
    // kept, false will be filtered out
    return denoms.filter(
      (denom) => denom.name?.toLowerCase().indexOf(text.toLowerCase()) !== -1
    );
  }
}
