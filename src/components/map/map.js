import template from './map.html?raw';
import styles from './map.css?inline';
import mapUrl from '/src/assets/images/map.png';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class Map extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElement.content.cloneNode(true));

    // TODO: unregister
    window.addEventListener('resize', () => {
      this.#setCanvasSize();
      this.#render();
    });
  }

  connectedCallback() {
    this.#setCanvasSize();
    this.#render();
  }

  #render() {
    const canvas = this.shadowRoot.querySelector('canvas');

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // make sure that image fills the whole canvas by default
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);

      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    img.src = mapUrl;
  }

  /**
   * Sets the size of the canvas element to make sure it always fills the whole screen
   */
  #setCanvasSize() {
    const canvas = this.shadowRoot.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}
