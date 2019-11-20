import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Input } from '@angular/core';
import { BasicInputComponent } from '@shared/inputs/basic-text-input/basic-input.component';
import { fromEvent, Subscription } from 'rxjs';
import ChangeEvent = JQuery.ChangeEvent;

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss']
})
export class CheckboxComponent extends BasicInputComponent implements OnInit, OnDestroy {
  @ViewChild('checkboxInput') filterInput: ElementRef;
  private subscription: Subscription;

  @Input() label: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.subscription = fromEvent(this.filterInput.nativeElement, 'change')
      .subscribe((e: ChangeEvent) => this.onChange.next((e.target as HTMLInputElement).checked as boolean));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
