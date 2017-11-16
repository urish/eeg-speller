import { Component, ElementRef, Input, AfterViewInit } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { channelNames, EEGReading, zipSamples } from 'muse-js';
import * as Fili from 'fili';

export class BandpassFilter {
  readonly firCalculator = new Fili.FirCoeffs();
  private readonly filter: any;

  constructor(samplingFreq: number, lowFreq: number, highFreq: number) {
    const Coefficients = this.firCalculator.bandpass({
      order: 101,
      Fs: samplingFreq,
      F2: lowFreq,
      F1: highFreq,
    });

    this.filter = new Fili.FirFilter(Coefficients);
  }

  next(value: number) {
    return this.filter.singleStep(value);
  }
}

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/take';

const samplingFrequency = 256;

@Component({
  selector: 'eeg-time-series',
  templateUrl: 'time-series.component.html',
  styleUrls: ['time-series.component.css'],
})
export class TimeSeriesComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() data: Observable<EEGReading>;

  filter = true;

  readonly channels = 4;
  readonly channelNames = channelNames.slice(0, this.channels);
  readonly amplitudes = [];
  readonly uVrms = [0, 0, 0, 0];
  readonly uMeans = [0, 0, 0, 0];

  readonly options = {
    responsive: true,
    millisPerPixel: 8,
    maxValue: 50,
    minValue: -50,
    grid: {
      lineWidth: 4,
      fillStyle: 'transparent',
      strokeStyle: 'transparent',
      sharpLines: true,
      verticalSections: 0,
      borderVisible: false
    },
    labels: {
      disabled: true
    }
  };

  readonly colors = [
    { borderColor: 'rgba(112,185,252,1)', backgroundColor: 'rgba(112,185,252,1)' },
    { borderColor: 'rgba(116,150,161,1)', backgroundColor: 'rgba(116,150,161,1)' },
    { borderColor: 'rgba(162,86,178,1)', backgroundColor: 'rgba(162,86,178,1)' },
    { borderColor: 'rgba(144,132,246,1)', backgroundColor: 'rgba(144,132,246,1)' },
    { borderColor: 'rgba(138,219,229,1)', backgroundColor: 'rgba(138,219,229,1)' }
  ];
  readonly canvases = Array(this.channels).fill(0).map(() => new SmoothieChart(this.options));

  private readonly lines = Array(this.channels).fill(0).map(() => new TimeSeries());
  private readonly bandpassFilters: BandpassFilter[] = [];

  constructor(private view: ElementRef) {
    for (let i = 0; i < this.channels; i++) {
      this.bandpassFilters[i] = new BandpassFilter(samplingFrequency, 1, 30);
    }
  }

  get AmplitudeScale() {
    return this.canvases[0].options.maxValue;
  }

  set AmplitudeScale(value: number) {
    for (const canvas of this.canvases) {
      canvas.options.maxValue = value;
      canvas.options.minValue = -value;
    }
  }

  get timeScale() {
    return this.canvases[0].options.millisPerPixel;
  }

  set timeScale(value: number) {
    for (const canvas of this.canvases) {
      canvas.options.millisPerPixel = value;
    }
  }

  ngAfterViewInit() {
    const channels = this.view.nativeElement.querySelectorAll('canvas');
    this.canvases.forEach((canvas, index) => {
      canvas.streamTo(channels[index]);
    });
  }

  ngOnInit() {
    this.addTimeSeries();
    this.data
      .pipe(zipSamples)
      .subscribe(sample => {
        sample.data.slice(0, this.channels).forEach((electrode, index) => {
          this.draw(sample.timestamp, electrode, index);
        });
      });
  }

  addTimeSeries() {
    this.lines.forEach((line, index) => {
      this.canvases[index].addTimeSeries(line, {
        lineWidth: 2,
        strokeStyle: this.colors[index].borderColor
      });
    });
  }

  draw(timestamp: number, amplitude: number, index: number) {
    const filter = this.bandpassFilters[index];
    if (this.filter && !isNaN(amplitude)) {
      amplitude = filter.next(amplitude);
    }

    if (!isNaN(amplitude)) {
      this.uMeans[index] = 0.995 * this.uMeans[index] + 0.005 * amplitude;
      this.uVrms[index] = Math.sqrt(0.995 * this.uVrms[index] ** 2 + 0.005 * (amplitude - this.uMeans[index]) ** 2);
    }

    this.lines[index].append(timestamp, amplitude);
    this.amplitudes[index] = amplitude.toFixed(2);
  }

  ngOnDestroy() {
  }

}
