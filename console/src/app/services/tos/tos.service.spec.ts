import { TestBed } from '@angular/core/testing';

import { TosService } from './tos.service';

describe('TosService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TosService = TestBed.get(TosService);
    expect(service).toBeTruthy();
  });
});
