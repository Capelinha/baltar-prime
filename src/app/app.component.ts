import { Component, HostBinding, OnInit, ViewChild } from "@angular/core";
import { NgxCsvParser } from "ngx-csv-parser";
import { MatVerticalStepper } from "@angular/material/stepper";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MersenneTwister19937, shuffle, integer } from "random-js";
import { TwitchService } from "./services/twitch.service";

interface IPrime {
  Username: string;
  "Subscribe Date": string;
  "Current Tier": string;
  Tenure: number;
  Streak: number;
  imageUrl?: string;
  "Sub Type": string;
  Founder: boolean;
}

interface IInstagramComment {
  username: string;
  comment: string;
  likeCount: number;
  replyCount: number;
  commentDate: string;
  profileUrl: string;
  postID: number;
  ownerId: string;
  profilePictureUrl: string;
  timestamp: string;
  query: string;
  isReply: string;
}

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  readonly NUMBER_MASK = {
    scale: 0,
    mask: Number,
    radix: ",",
    mapToRadix: ["."],
    thousandsSeparator: ".",
    signed: false,
    normalizeZeros: false,
    padFractionalZeros: false
  };

  @ViewChild("stepper")
  stepper: MatVerticalStepper;

  configForm: FormGroup;

  instagramComments: IInstagramComment[];
  primesListOriginal: IPrime[];

  primesList: IPrime[];

  primesView: IPrime[];

  @ViewChild("fileImportInput")
  fileImportInput: any;

  @ViewChild("fileImportInputInsta")
  fileImportInputInsta: any;

  @HostBinding("style.--random-number")
  winnerIndex = 100;

  winner: IPrime;
  comment: IInstagramComment;

  @HostBinding("style.--time")
  time = "120ms";

  showResult = false;
  showSpinner = false;
  preparing = false;

  constructor(
    private ngxCsvParser: NgxCsvParser,
    private twitchService: TwitchService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.configForm = this.fb.group({
      fake: [1, Validators.required],
      bronze: [2, Validators.required],
      prata: [3, Validators.required],
      ouro: [4, Validators.required],
      diamante: [5, Validators.required],
      gelo: [6, Validators.required],
      time: [120, Validators.required]
    });
  }

  selectFile() {
    this.fileImportInput.nativeElement.click();
  }

  selectFileInsta() {
    this.fileImportInputInsta.nativeElement.click();
  }

  fileChangeEvent(event: any) {
    const files = event.srcElement.files;

    this.ngxCsvParser
      .parse(files[0], { delimiter: "," })
      .pipe()
      .subscribe(
        (result: IPrime[]) => {
          result.forEach(prime => {
            prime.Tenure = Number(prime.Tenure);
          });
          this.primesListOriginal = result;

          this.stepper.selected.completed = true;
          this.stepper.next();
        },
        error => {
          console.error("Error", error);
        }
      );
  }

  fileChangeEventInsta(event: any) {
    const files = event.srcElement.files;

    this.ngxCsvParser
      .parse(files[0], { delimiter: "," })
      .pipe()
      .subscribe(
        (result: IInstagramComment[]) => {
          console.log(result.map(({ comment }) => comment));

          this.instagramComments = result.filter(item =>
            item.comment?.match(/(@.*){3,}/g)
          );

          console.log(this.instagramComments.length);
          console.log(this.instagramComments.map(({ comment }) => comment));

          this.primesListOriginal = this.primesListOriginal.filter((prime) => this.instagramComments.some((comment) => comment.comment.includes(prime.Username)));

          console.log(this.primesListOriginal.length);
          console.log(this.primesListOriginal);

          this.stepper.selected.completed = true;
          this.stepper.next();
        },
        error => {
          console.error("Error", error);
        }
      );
  }

  skipInstagram() {
    this.stepper.next();
  }

  prepare() {
    if (!this.preparing) {
      const values = this.configForm.value;
      this.preparing = true;

      setTimeout(() => {
        this.primesList = this.primesListOriginal.reduce(
          (list, prime) => {
            const entryCount = values[this.getPrimeLevel(prime)];

            for (let i = 0; i < entryCount; i++) {
              list.push(prime);
            }

            return list;
          },
          [] as IPrime[]
        );

        const engine = MersenneTwister19937.autoSeed();

        this.primesList = shuffle(engine, this.primesList);

        this.primesView = [];

        while (this.primesView.length < 10 * values.time) {
          this.primesView.push(...this.primesListOriginal);
        }

        this.stepper.selected.completed = true;
        this.showSpinner = true;
        this.stepper.next();
      }, 1000);
    }
  }

  random() {
    const engine = MersenneTwister19937.autoSeed();
    const winnerIndex = integer(0, this.primesList.length - 1)(engine);
    const winner = this.primesList[winnerIndex];
    const time = this.configForm.value.time;

    this.primesView[10 * time] = winner;
    this.winnerIndex = 10 * time;
    this.winner = winner;
    this.time = `${Number(time) * 1000}ms`;

    this.comment = this.instagramComments.find((comment) => comment.comment.includes(winner.Username));

    this.twitchService.getProfileImage(winner.Username).subscribe(
      response => {
        winner.imageUrl = response.data[0].profile_image_url;
      },
      e => console.error(e)
    );

    console.log(winner);
    this.showResult = true;
  }

  getColor(prime: IPrime) {
    return this.getPrimeLevel(prime);
  }

  getPrimeLevel(prime: IPrime) {
    if (prime.Tenure < 2) {
      return "fake";
    } else if (prime.Tenure >= 2 && prime.Tenure < 6) {
      return "bronze";
    } else if (prime.Tenure >= 6 && prime.Tenure < 9) {
      return "prata";
    } else if (prime.Tenure >= 9 && prime.Tenure < 12) {
      return "ouro";
    } else if (prime.Tenure >= 12 && prime.Tenure < 18) {
      return "diamante";
    } else {
      return "gelo";
    }
  }

  restart() {
    window.location.reload();
  }
}
