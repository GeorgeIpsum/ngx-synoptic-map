import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SynopticMapComponent } from './synoptic-map.component';

describe('SynopticMapComponent', () => {
  let component: SynopticMapComponent;
  let fixture: ComponentFixture<SynopticMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SynopticMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SynopticMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
