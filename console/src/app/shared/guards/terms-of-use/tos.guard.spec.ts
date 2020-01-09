import { TestBed, async, inject } from '@angular/core/testing';

import { TermsOfUseGuard } from './terms-of-use.guard';

describe('TosGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TermsOfUseGuard]
    });
  });

  it('should ...', inject([TermsOfUseGuard], (guard: TermsOfUseGuard) => {
    expect(guard).toBeTruthy();
  }));
});
