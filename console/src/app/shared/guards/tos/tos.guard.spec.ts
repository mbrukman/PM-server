import { TestBed, async, inject } from '@angular/core/testing';

import { TosGuard } from './tos.guard';

describe('TosGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TosGuard]
    });
  });

  it('should ...', inject([TosGuard], (guard: TosGuard) => {
    expect(guard).toBeTruthy();
  }));
});
