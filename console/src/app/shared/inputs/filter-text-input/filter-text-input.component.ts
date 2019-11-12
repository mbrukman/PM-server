import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BasicInputComponent} from '@shared/inputs/basic-text-input/basic-input.component';
import {fromEvent, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-filter-text-input',
  templateUrl: './filter-text-input.component.html',
  styleUrls: ['./filter-text-input.component.scss']
})
export class FilterTextInputComponent extends BasicInputComponent implements OnInit, OnDestroy {
  @ViewChild('filterInput') filterInput: ElementRef;

  @Input() placeholder = 'Filter';
  private subscription: Subscription;

  constructor() {
    super();
  }

  ngOnInit() {
    this.subscription = fromEvent(this.filterInput.nativeElement, 'keyup')
      .pipe(debounceTime(this.debounceTime))
      .subscribe((e: KeyboardEvent) => {
        this.onChange.emit((e.target as HTMLInputElement).value);
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
