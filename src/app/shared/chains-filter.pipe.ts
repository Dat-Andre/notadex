import { Pipe, PipeTransform } from '@angular/core';
import { Chain } from '../skip';

@Pipe({
  name: 'chainsFilter',
  standalone: true,
})
export class ChainsFilterPipe implements PipeTransform {
  transform(chains: Chain[] | undefined, text: string): any {
    if (!chains || !text || text === '') {
      return chains;
    }
    // filter items array, items which match and return true will be
    // kept, false will be filtered out
    return chains.filter(
      (chain) =>
        chain.chain_name?.toLowerCase().indexOf(text.toLowerCase()) !== -1
    );
  }
}
