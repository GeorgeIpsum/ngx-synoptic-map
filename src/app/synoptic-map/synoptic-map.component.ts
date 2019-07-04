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

  public rectangles: {
    x: number,
    y: number,
    w: number,
    h: number,
    c: string
  }[] = [];

  public colors: any[] = [
    "rgba(125,131,255,0.3)",
    "rgba(000,125,255,0.3)",
    "rgba(026,255,213,0.3)",
    "rgba(255,103,000,0.3)",
    "rgba(099,026,138,0.3)",
  ]

  public colorCounter: number = 0;

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
            );
        })
      ).subscribe((res: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();

        if(!this.currentlyDrawing) {
          this.currentlyDrawing = true;
          this.beginX = res.clientX - rect.left;
          this.beginY = res.clientY - rect.top;
        }

        const currentPos = {
          x: res.clientX - rect.left,
          y: res.clientY - rect.top
        };

        this.draw(currentPos);
      });
    
    fromEvent(canvas, 'mouseup').subscribe((e: MouseEvent) => {
      if(this.currentlyDrawing) {
        this.currentlyDrawing = false;

        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const rectangle = {
          x: this.beginX,
          y: this.beginY,
          w: currentX - this.beginX,
          h: currentY - this.beginY,
          c: this.colors[this.colorCounter%this.colors.length]
        };

        this.colorCounter++;

        this.rectangles.push(rectangle);

        this.draw();
      }
    });
  }


  private draw(current?: {x:number,y:number}) {
    this.cx.clearRect(0,0,this.canvas.nativeElement.width,this.canvas.nativeElement.height);
    this.cx.drawImage(this.image,0,0);

    for(let i=0; i < this.rectangles.length; i++) {
      this.cx.fillStyle = this.rectangles[i].c;
      this.cx.fillRect(this.rectangles[i].x,this.rectangles[i].y,this.rectangles[i].w,this.rectangles[i].h);
    }

    if(current) {
      this.cx.strokeRect(this.beginX,this.beginY,current.x-this.beginX,current.y-this.beginY);
    }
  }

}
