import { Component, HostBinding,  OnInit, ViewChild } from '@angular/core';
import { NgxCsvParser } from 'ngx-csv-parser';
import { MatVerticalStepper } from '@angular/material/stepper';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MersenneTwister19937, shuffle, integer } from "random-js";

interface IPrime {
  Username: string,
  'Subscribe Date': string,
  'Current Tier': string,
  Tenure: number,
  Streak: number,
  'Sub Type': string,
  Founder: boolean
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {

  readonly NUMBER_MASK = {
    scale: 0,
    mask: Number,
    radix: ',',
    mapToRadix: ['.'],
    thousandsSeparator: '.',
    signed: false,
    normalizeZeros: false,
    padFractionalZeros: false
  };

  @ViewChild('stepper')
  stepper: MatVerticalStepper;

  configForm: FormGroup;

  primesList: IPrime[];

  primesView: IPrime[];

  @ViewChild('fileImportInput')
  fileImportInput: any;

  @HostBinding('style.--random-number')
  winnerIndex = 100;

  showResult = false;
  showSpinner = false;
  preparing = false;
  
  constructor(private ngxCsvParser: NgxCsvParser,
              private fb: FormBuilder) { }

  ngOnInit() {
    this.configForm = this.fb.group({
      fake: [1, Validators.required],
      bronze: [2, Validators.required],
      prata: [3, Validators.required],
      ouro: [4, Validators.required],
      diamante: [5, Validators.required],
      gelo: [6, Validators.required]
    })
  }

  selectFile() {
    this.fileImportInput.nativeElement.click();
  }

  fileChangeEvent(event: any) {
    const files = event.srcElement.files;
 
    this.ngxCsvParser.parse(files[0], { delimiter: ',' })
      .pipe().subscribe((result: IPrime[]) => {
        result.forEach((prime) => {
          prime.Tenure = Number(prime.Tenure);
        })
        this.primesList = result;

        this.stepper.selected.completed = true;
        this.stepper.next();
      }, (error) => {
        console.error('Error', error);
      });

  }

  prepare() {
    if (!this.preparing) {
      const values = this.configForm.value;
      this.preparing = true;

      setTimeout(() => {
        this.primesList = this.primesList.reduce((list, prime) => {
          const entryCount = values[this.getPrimeLevel(prime)];

          for (let i = 0; i < entryCount; i++) {
            list.push(prime);
          }

          return list;
        }, [] as IPrime[]);

        const engine = MersenneTwister19937.autoSeed();

        this.primesList = shuffle(engine, this.primesList);

        this.primesView = [...this.primesList.slice(0, 200), ...this.primesList];

        this.stepper.selected.completed = true;
        this.showSpinner = true;
        this.stepper.next();
      }, 1000);
    }
  }

  random() {
    const engine = MersenneTwister19937.autoSeed();
    const winner = integer(0, this.primesList.length - 1)(engine);
    this.winnerIndex = winner + 200;
    console.log(this.primesList[winner]);
    this.showResult = true;
  }

  getColor(prime: IPrime) {
    return this.getPrimeLevel(prime);
  }

  getPrimeLevel(prime: IPrime) {
    if (prime.Tenure < 2) {
      return 'fake';
    } else if (prime.Tenure >= 2 && prime.Tenure < 6) {
      return 'bronze';
    } else if (prime.Tenure >= 6 && prime.Tenure < 9) {
      return 'prata';
    } else if (prime.Tenure >= 9 && prime.Tenure < 12) {
      return 'ouro';
    } else if (prime.Tenure >= 12 && prime.Tenure < 18) {
      return 'diamante';
    } else {
      return 'gelo';
    }
  }

  restart() {
    window.location.reload()
  }
}
