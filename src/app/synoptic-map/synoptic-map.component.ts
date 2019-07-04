import { Component, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, first } from 'rxjs/operators';

@Component({
  selector: 'app-synoptic-map',
  templateUrl: './synoptic-map.component.html',
  styleUrls: ['./synoptic-map.component.scss']
})
export class SynopticMapComponent implements AfterViewInit {

  @ViewChild('canvas',{ static: false }) public canvas: ElementRef;

  @Input() public imageString: string;

  public image = new Image();

  private cx: CanvasRenderingContext2D;

  public currentlyDrawing: boolean = false;
  public beginX: number;
  public beginY: number;

  constructor() { }

  ngAfterViewInit() {
    const canvasElementRef: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasElementRef.getContext('2d');

    this.image.onload = () => {
      canvasElementRef.width = this.image.width;
      canvasElementRef.height = this.image.height;

      this.cx.drawImage(this.image,0,0);
    };

    this.image.src = this.imageString;

    this.cx.lineWidth = 5;

    this.captureEvents(canvasElementRef);
  }

  private captureEvents(canvas: HTMLCanvasElement) {

    fromEvent(canvas, 'mousedown')
      .pipe(
        switchMap(e => {
          return fromEvent(canvas, 'mousemove')
            .pipe(
              takeUntil(fromEvent(canvas, 'mouseup')),
              takeUntil(fromEvent(canvas, 'mouseleave')),
              pairwise()
            );
        })
      ).subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvas.getBoundingClientRect();

        if(!this.currentlyDrawing) {
          this.currentlyDrawing = true;
          this.beginX = res[0].clientX - rect.left;
          this.beginY = res[0].clientY - rect.top;
        }

        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top
        };

        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };

        this.draw(prevPos, currentPos);
      });
    
    fromEvent(canvas, 'mouseup').subscribe(e => this.currentlyDrawing = false);
  }


  draw(prev: {x:number,y:number}, current: {x:number,y:number}) {
    this.cx.clearRect(0,0,this.canvas.nativeElement.width,this.canvas.nativeElement.height);
    if(prev) {
      this.cx.drawImage(this.image,0,0);
      this.cx.strokeRect(this.beginX,this.beginY,current.x-this.beginX,current.y-this.beginY);
    }
  }

}
