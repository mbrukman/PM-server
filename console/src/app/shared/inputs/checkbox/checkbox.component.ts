import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BasicInputComponent} from '@shared/inputs/basic-text-input/basic-input.component';
import {fromEvent, Subscription} from "rxjs";
import ChangeEvent = JQuery.ChangeEvent;

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss']
})
export class CheckboxComponent extends BasicInputComponent implements OnInit, OnDestroy {
  @ViewChild('checkboxInput') filterInput: ElementRef;
  private subscription: Subscription;

  constructor() {
    super();
  }

  ngOnInit() {
    this.subscription = fromEvent(this.filterInput.nativeElement, 'onchange')
      .subscribe((e: ChangeEvent) => this.onChange.next((e.target as HTMLInputElement).value));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
