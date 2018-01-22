import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/filter';
import { Observable } from 'rxjs/Observable';

@Directive({
  selector: '[infiniteScroll]'
})
export class InfiniteScrollDirective implements AfterViewInit {
  scrollEvent: any;
  scrollSubscription: any;
  @Input('onScroll') onScrollCb: any;

  constructor(private elm: ElementRef) {
    console.log(elm);
  }

  ngAfterViewInit() {
    this.registerScrollEvent();
    this.onScroll();
  }

  private registerScrollEvent() {
    this.scrollEvent = Observable.fromEvent(this.elm.nativeElement, 'scroll')
      .map((e: any) => (
        {
          scrollHeight: e.target.scrollHeight,
          scrollTop: e.target.scrollTop,
          clientHeight: e.target.clientHeight
        })).pairwise()
      .filter(positions => this.isScrollingDown(positions) && this.isCloseToBottom(positions[1]))
    ;
  }

  onScroll() {
    this.scrollEvent.subscribe(a => {
      this.onScrollCb();
    });
    this.scrollSubscription = this.scrollEvent
  }

  isCloseToBottom(position) {
    return ((position.scrollTop + position.clientHeight) / position.scrollHeight) > 0.8;
  }

  isScrollingDown(positions): boolean {
    return positions[0].scrollTop < positions[1].scrollTop;
  }



}
