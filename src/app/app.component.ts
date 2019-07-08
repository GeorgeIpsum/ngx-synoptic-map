import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ngx-synoptic-map';

  image: string = 'assets/img/squares.jpg';
  file: File;

  genImage(files: FileList) {
    this.file = files.item(0);
    this.image = URL.createObjectURL(this.file);
  }
}
