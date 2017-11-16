import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatToolbarModule, MatCardModule, MatButtonModule,
  MatIconModule, MatProgressBarModule, MatSnackBarModule,
  MatCheckboxModule, MatSliderModule,
} from '@angular/material';

import { AppComponent } from './app.component';
import { SpellerComponent } from './speller/speller.component';
import { TimeSeriesComponent } from './time-series/time-series.component';

@NgModule({
  declarations: [
    AppComponent,
    SpellerComponent,
    TimeSeriesComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSliderModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
