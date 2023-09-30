import template from './map.html?raw';
import styles from './map.css?inline';
import mapUrl from '/src/assets/images/map.png';
import { MAP_BOUNDARIES, MAP_BOUNDARIES_RANGES } from '../../constants.js';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class Map extends HTMLElement {

  /**
   * The Canvas class represents a graphical canvas element in HTML for drawing 2D graphics.
   * It provides methods and properties to manipulate and interact with the canvas.
   *
   * @type {HTMLCanvasElement}
   */
  #canvas;

  /**
   * Controller that emits when the component is destroyed.
   *
   * @class
   * @type {AbortController}
   */
  #destroyController = new AbortController();

  /**
   * events to render
   *
   * @private
   * @type {CrimeEvent[]}
   */
  #events = [];

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElement.content.cloneNode(true));

    this.#canvas = this.shadowRoot.querySelector('canvas');
  }

  /**
   * set events for map
   *
   * @param {CrimeEvent[]} events events
   */
  setEvents(events) {
    this.#events = events;
    this.#render();
  }

  connectedCallback() {
    // respect resize with throttling for performance reasons
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.#render();
      }, 50);
    }, { signal: this.#destroyController.signal });

    this.#render();
  }

  disconnectedCallback() {
    this.#destroyController.abort();
  }

  #render() {
    const canvas = this.shadowRoot.querySelector('canvas');

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // make sure that image fills the whole screen by default
      const scale = Math.max(window.innerWidth / img.width, window.innerHeight / img.height);

      this.#canvas.style.transform = `scale(${scale})`;
      this.#canvas.style.transformOrigin = 'top left';

      ctx.drawImage(img, 0, 0, img.width, img.height);

      const dots = this.#eventsToDots(this.#events);
      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = '#C00000';
        ctx.fill();
        ctx.closePath();
      });
    }

    img.src = mapUrl;
  }

  /**
   * transform events to dots
   *
   * @private
   * @param {CrimeEvent[]} events events to transform
   * @returns {{x: number, y: number}[]} array of dots
   */
  #eventsToDots(events) {
    return events
      .filter((event) => event.lat && event.lon)
      .map((event) => {
        const x = (event.lon - MAP_BOUNDARIES.lonMin) / MAP_BOUNDARIES_RANGES.lonRange * this.#canvas.width;
        const y = this.#canvas.height- (event.lat - MAP_BOUNDARIES.latMin) / MAP_BOUNDARIES_RANGES.latRange * this.#canvas.height;

        return {
          x,
          y
        };
      });
  }
}
