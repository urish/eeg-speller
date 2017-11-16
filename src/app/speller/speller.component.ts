import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { EEGReading, channelNames } from 'muse-js';
import { filter, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'eeg-speller',
  templateUrl: './speller.component.html',
  styleUrls: ['./speller.component.css']
})
export class SpellerComponent implements OnInit, OnDestroy {
  @Input() eegReadings: Observable<EEGReading>;

  letters = [
    'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y',
  ];

  private subset: Set<String> = new Set();
  private destroy = new Subject<void>();

  constructor() {
  }

  ngOnInit() {
    const tp9 = channelNames.indexOf('TP9');
    this.eegReadings.pipe(
      takeUntil(this.destroy),
      filter(item => item.electrode === tp9),
      map(item => Math.max(...item.samples.map(Math.abs))),
      filter(val => val > 100)
    );
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  randomSubset() {
    this.subset.clear();
    while (this.subset.size < 5) {
      this.subset.add(this.letters[Math.floor(Math.random() * this.letters.length)]);
    }
  }

  spell() {
    setInterval(() => this.randomSubset(), 200);
  }

  isActive(letter: string) {
    return this.subset.has(letter);
  }
}
