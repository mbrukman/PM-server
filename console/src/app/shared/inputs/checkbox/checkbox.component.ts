import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Input } from '@angular/core';
import { BasicInputComponent } from '@shared/inputs/basic-text-input/basic-input.component';
import { fromEvent, Subscription, Subject } from 'rxjs';
import ChangeEvent = JQuery.ChangeEvent;

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss']
})
export class CheckboxComponent extends BasicInputComponent implements OnInit, OnDestroy {
  @ViewChild('checkboxInput') checkboxInput: ElementRef;
  private subscription: Subscription;

  @Input() label: string;
  @Input() toggle?: Subject<boolean>;

  constructor() {
    super();
  }

  ngOnInit() {
    this.subscription = fromEvent(this.checkboxInput.nativeElement, 'change')
      .subscribe((e: ChangeEvent) => this.onChange.next((e.target as HTMLInputElement).checked as boolean));
    if (this.toggle) {
      this.subscription.add(this.toggle.subscribe(newValue => {
        this.checkboxInput.nativeElement.checked = newValue;
      }));
    }

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
