import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { Asset, Chain } from '../skip';
import { ChainsFilterPipe } from '../shared/chains-filter.pipe';
import { DenomsFilterPipe } from '../shared/denoms-filter.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-trade-parameters-selection',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, ReactiveFormsModule],
  providers: [ChainsFilterPipe, DenomsFilterPipe],
  templateUrl: './trade-parameters-selection.component.html',
  styleUrl: './trade-parameters-selection.component.scss',
})
export class TradeParametersSelectionComponent implements OnInit {
  private _searchText: string = '';

  get searchText(): string {
    return this._searchText;
  }
  set searchText(val: string) {
    this._searchText = val;
    this.searchTextEvent.emit(this._searchText);
    /*  if (!this.selectedOriginChain) {
      this.filteredChains = this.filter.transform(this.chains, this.searchText);
    } else if (this.selectedOriginChain) {
      this.filteredDenoms = this.filterDenoms.transform(
        this.availableDenoms,
        this.searchText
      );
    } */
  }

  @Input() in: boolean = false;

  @Input() out: boolean = false;

  @Input() selectedOriginChain: Chain | undefined;

  @Input() selectedExitChain: Chain | undefined;

  @Input() selectedSourceDenom: Asset | undefined;

  @Input() selectedExitDenom: Asset | undefined;

  /* @Input() filteredChains!: Chain[];

  @Input() filteredDenoms!: Asset[];

  @Input() availableDenoms!: Asset[];

  @Input() chains!: Chain[]; */

  @Output() removeSelectedChainEvent: EventEmitter<any> = new EventEmitter();

  @Output() removeSelectedSourceDenomEvent: EventEmitter<any> =
    new EventEmitter();

  @Output() removeSelectedExitDenomEvent: EventEmitter<any> =
    new EventEmitter();

  @Output() searchTextEvent: EventEmitter<string> = new EventEmitter();

  constructor() {}
  ngOnInit(): void {}

  /* selectChainWithEnter(event: any) {
    console.log(this.chains);
    if (event.keyCode !== 13) {
      return;
    }
    if (this.filteredChains?.length === 1) {
      this.selectSourceChain(this.filteredChains[0]);
    }
  } */

  /* removeSelectedChain() {
    this.removeSelectedChainEvent.emit();
  }

  removeSelectedSourceDenom() {
    this.removeSelectedSourceDenomEvent.emit();
  }

  removeSelectedExitDenom() {
    this.removeSelectedExitDenomEvent.emit();
  } */
}
