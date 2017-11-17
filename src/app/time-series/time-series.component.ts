import { Component, ElementRef, Input, AfterViewInit } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { channelNames, EEGReading, zipSamples } from 'muse-js';
import { map, groupBy, filter, mergeMap, takeUntil } from 'rxjs/operators';
import * as Fili from 'fili';

function bandpass(samplingFreq: number, lowFreq: number, highFreq: number) {
  const firCalculator = new Fili.FirCoeffs();
  const Coefficients = firCalculator.bandpass({
    order: 101,
    Fs: samplingFreq,
    F2: lowFreq,
    F1: highFreq,
  });
  const filterInstance = new Fili.FirFilter(Coefficients);

  return (value: number) => filterInstance.singleStep(value) as number;
}

const samplingFrequency = 256;

@Component({
  selector: 'eeg-time-series',
  templateUrl: 'time-series.component.html',
  styleUrls: ['time-series.component.css'],
})
export class TimeSeriesComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() data: Observable<EEGReading>;

  filter = true;

  readonly destroy = new Subject<void>();
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

  constructor(private view: ElementRef) {
  }

  get amplitudeScale() {
    return this.canvases[0].options.maxValue;
  }

  set amplitudeScale(value: number) {
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

  ngOnInit() {
    this.addTimeSeries();
    this.data.pipe(
      zipSamples,
      takeUntil(this.destroy),
      mergeMap(sampleSet =>
        sampleSet.data.slice(0, this.channels).map((value, electrode) => ({
          timestamp: sampleSet.timestamp, value, electrode
        }))),
      groupBy(sample => sample.electrode),
      mergeMap(group => {
        const bandpassFilter = bandpass(samplingFrequency, 1, 30);
        const conditionalFilter = value => this.filter ? bandpassFilter(value) : value;
        return group.pipe(
          filter(sample => !isNaN(sample.value)),
          map(sample => ({ ...sample, value: conditionalFilter(sample.value) })),
        );
      })
    )
      .subscribe(sample => {
        this.draw(sample.timestamp, sample.value, sample.electrode);
      });
  }

  ngAfterViewInit() {
    const channels = this.view.nativeElement.querySelectorAll('canvas');
    this.canvases.forEach((canvas, index) => {
      canvas.streamTo(channels[index]);
    });
  }

  ngOnDestroy() {
    this.destroy.next();
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
    this.uMeans[index] = 0.995 * this.uMeans[index] + 0.005 * amplitude;
    this.uVrms[index] = Math.sqrt(0.995 * this.uVrms[index] ** 2 + 0.005 * (amplitude - this.uMeans[index]) ** 2);

    this.lines[index].append(timestamp, amplitude);
    this.amplitudes[index] = amplitude.toFixed(2);
  }
}
