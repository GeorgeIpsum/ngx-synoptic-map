import { Component, ViewChild, ElementRef, Input, AfterViewInit, Renderer2, OnChanges, SimpleChanges } from '@angular/core';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, first } from 'rxjs/operators';

@Component({
  selector: 'app-synoptic-map',
  templateUrl: './synoptic-map.component.html',
  styleUrls: ['./synoptic-map.component.scss']
})
export class SynopticMapComponent implements AfterViewInit, OnChanges {

  @ViewChild('canvas',{ static: false }) public canvas: ElementRef;

  @Input() public imageString: string;

  public image = new Image();

  private cx: CanvasRenderingContext2D;

  public currentlyDrawing: boolean = false;
  public beginX: number;
  public beginY: number;

  public rectHoverIndex: number = -1;

  @Input() public rectangles: {
    x: number,
    y: number,
    w: number,
    h: number,
    c: string,
    text: string
  }[] = [];

  public colors: any[] = [
    "rgba(125,131,255,0.5)",
    "rgba(000,125,255,0.5)",
    "rgba(026,255,213,0.5)",
    "rgba(255,103,000,0.5)",
    "rgba(099,026,138,0.5)",
  ]

  public colorCounter: number = 0;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit() {
    const canvasElementRef: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasElementRef.getContext('2d');

    this.image.onload = () => {
      canvasElementRef.width = this.image.width;
      canvasElementRef.height = this.image.height;

      this.cx.drawImage(this.image,0,0);
    };

    this.image.src = this.imageString;

    this.cx.lineWidth = 7;

    this.captureEvents(canvasElementRef);
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.imageString && changes.imageString.previousValue) {
      const canvasElementRef: HTMLCanvasElement = this.canvas.nativeElement;
      this.cx = canvasElementRef.getContext('2d');

      this.image.onload = () => {
        canvasElementRef.width = this.image.width;
        canvasElementRef.height = this.image.height;

        this.cx.drawImage(this.image,0,0);
      };

      this.image.src = this.imageString;

      this.rectangles = [];

      this.captureEvents(canvasElementRef);
    }
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
          c: this.colors[this.colorCounter%this.colors.length],
          text: ''
        };

        this.colorCounter++;

        this.rectangles.push(rectangle);

        this.draw();
      }
    });

    fromEvent(canvas, 'click').subscribe((e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();

      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      for(let i=0; i<this.rectangles.length; i++) {
        const rectangle = this.rectangles[i];
        if(this.checkIfInbound(rectangle, pos)) {
          this.renderer.selectRootElement('#form-'+i.toString()).focus();
        }
      }
    });

    fromEvent(canvas, 'mousemove').subscribe((e: MouseEvent) => {
      if(!this.currentlyDrawing) {
        const rect = canvas.getBoundingClientRect();

        const pos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };

        let oneInbound: boolean = false;

        for(let i=0; i<this.rectangles.length; i++) {
          const rectangle = this.rectangles[i];
          if(this.checkIfInbound(rectangle, pos)) {
            this.rectHoverIndex = i;
            oneInbound = true;
            this.draw();
          }
        }

        if(!oneInbound) {
          this.rectHoverIndex = -1;
          this.draw();
        }
      }
    });
  }


  draw(current?: {x:number,y:number}) {
    this.cx.clearRect(0,0,this.canvas.nativeElement.width,this.canvas.nativeElement.height);
    this.cx.drawImage(this.image,0,0);
    this.cx.font = "bold 16px Courier";
    this.cx.textAlign = "center";

    for(let i=0; i < this.rectangles.length; i++) {
      this.cx.fillStyle = this.rectangles[i].c;
      const rect = this.rectangles[i];
      this.cx.fillRect(rect.x,rect.y,rect.w,rect.h);
      
      this.cx.fillStyle = "#000";
      const text = {x: (Math.round((rect.x+(rect.x+rect.w)))/2), y: (Math.round((rect.y+(rect.y+rect.h))/2))+8};
      if(this.rectHoverIndex != i) {
        this.cx.fillText(i.toString(), text.x, text.y);
      } else {
        this.cx.fillText(rect.text ? rect.text.toString() : 'NO TEXT', text.x, text.y);
      }
    }

    if(current) {
      this.cx.strokeRect(this.beginX,this.beginY,current.x-this.beginX,current.y-this.beginY);
    }
  }

  private checkIfInbound(
      rectangle: {x:number,y:number,w:number,h:number},
      position: {x:number, y:number}
    ): boolean {
    let xMin, xMax, yMin, yMax;

    if(rectangle.w > 0) {
      xMin = rectangle.x, xMax = rectangle.x + rectangle.w;
    } else {
      xMax = rectangle.x, xMin = rectangle.x + rectangle.w;
    }

    if(rectangle.h > 0) {
      yMin = rectangle.y, yMax = rectangle.y + rectangle.h;
    } else {
      yMax = rectangle.y, yMin = rectangle.y + rectangle.h;
    }

    return ((xMin <= position.x && position.x <= xMax) && (yMin <= position.y && position.y <= yMax));
  }

  deleteRect(index: number): void {
    this.rectangles.splice(index);
    this.draw();
  }

}
