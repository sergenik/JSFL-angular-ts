import { Component } from '@angular/core';
import { FrameToSpineAnimation } from './lib/jsfl-tests/frame-to-spine-animation';

/**
 * to import json and read it:
 *  added in tsconfig.json:
 *    "resolveJsonModule": true,
 *    "allowSyntheticDefaultImports": true,
 */
import animation from '../assets/json/animation.json'; // '../assets/json/animation.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'JSFL-angular-ts';
  
  constructor() {
    this.loadAndConvertAnimationJson();
  }

  loadAndConvertAnimationJson(): void {
    const c = new FrameToSpineAnimation();
    c.convertHere(animation);
  }
}
