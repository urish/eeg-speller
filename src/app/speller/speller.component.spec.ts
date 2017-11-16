import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs/Subject';
import { EEGReading } from 'muse-js';

import { SpellerComponent } from './speller.component';

describe('SpellerComponent', () => {
  let component: SpellerComponent;
  let fixture: ComponentFixture<SpellerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpellerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpellerComponent);
    component = fixture.componentInstance;
    component.eegReadings = new Subject<EEGReading>();
    fixture.detectChanges();
  });

  it('should define a `letters` array', () => {
    expect(component.letters).toEqual(jasmine.any(Array));
  });
});
