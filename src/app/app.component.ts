import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { MuseClient } from 'muse-js';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'eeg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  connecting = false;
  connected = false;
  batteryLevel: Observable<number> | null;
  muse = new MuseClient();
  destroy = new Subject<void>();

  constructor(private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.muse.connectionStatus
      .pipe(takeUntil(this.destroy))
      .subscribe(status => {
        this.connected = status;
        if (!status) {
          this.batteryLevel = null;
        }
      });
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  async connect() {
    this.connecting = true;
    this.snackBar.dismiss();
    try {
      await this.muse.connect();
      await this.muse.start();
      this.batteryLevel = this.muse.telemetryData
        .pipe(map(t => t.batteryLevel));
    } catch (err) {
      this.snackBar.open('Connection failed: ' + err.toString(), 'Dismiss');
    } finally {
      this.connecting = false;
    }
  }

  get eegReadings() {
    return this.muse.eegReadings;
  }

  disconnect() {
    this.muse.disconnect();
  }
}
