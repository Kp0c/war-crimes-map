import template from './map.html?raw';
import styles from './map.css?inline';
import mapUrl from '/src/assets/images/map.png';
import {
  ANIMATION_DURATION_MS,
  CRIME_TYPE_BORDER_REQUIRED,
  CRIME_TYPE_TO_COLOR_MAP,
  DIFFUSE_AMOUNT_PX,
  MAP_BOUNDARIES,
  MAP_BOUNDARIES_RANGES
} from '../../constants.js';
import { MathHelper } from '../../helpers/math.helper.js';
import { SCALE } from '../../enums.js';
import { Formatter } from '../../helpers/formatter.js';

/**
 * Dot
 * @typedef {Object} Dot
 * @property {number} x
 * @property {number} y
 * @property {string} color
 * @property {boolean} borderRequired
 * @property {number} currentSize
 * @property {number} desiredSize
 * @property {number} currentAmount
 * @property {number} desiredAmount
 */

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
   * @type {CrimeEventGroup[]}
   */
  #events = [];

  /**
   * Affected Types
   * @type {AffectedType[]}
   */
  #affectedTypes = [];

  /**
   * Scale of the map
   * @type {number}
   */
  #currentScale = NaN;

  /**
   * Current offset of the map
   *
   * @type {{x: number, y: number}}
   */
  #currentOffset = {
    x: 0,
    y: 0,
  }

  /**
   *
   * @type {Dot[]}
   */
  #eventDots = [];

  /**
   *
   * @type {HTMLImageElement}
   */
  #mapImg = null;

  /**
   * Timestamp of the animation start
   *
   * @type {number|null}
   */
  #animationStartTimestamp = null;

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
   * @param {CrimeEventGroup[]} events events
   */
  setEvents(events) {
    this.#events = events;
    this.#eventDots = this.#eventsToDots(this.#events);
    this.#animationStartTimestamp = null;
    this.#render();
  }

  /**
   * set affected types for the map
   *
   * @param {AffectedType[]} affectedTypes
   */
  setAffectedTypes(affectedTypes) {
    this.#affectedTypes = affectedTypes;

    this.#setLegend();
  }

  connectedCallback() {
    this.#setupResize();
    this.#setupDragNDrop();

    this.#prepareImage();
  }

  disconnectedCallback() {
    this.#destroyController.abort();
  }

  #render() {
    if (!this.#mapImg) {
      return;
    }

    const ctx = this.#canvas.getContext('2d');

    if (Number.isNaN(this.#currentScale)){
      this.#setDefaultScale();
    }

    if (!this.#animationStartTimestamp) {
      this.#animationStartTimestamp = performance.now();
    }
    const animationProgress = Math.min((performance.now() - this.#animationStartTimestamp) / ANIMATION_DURATION_MS, 1);

    ctx.globalAlpha = 1;

    ctx.drawImage(this.#mapImg, 0, 0, this.#mapImg.width, this.#mapImg.height);

    ctx.globalAlpha = 0.7;

    this.#eventDots.forEach((dot) => {
      dot.currentAmount = Math.round(MathHelper.lerp(dot.currentAmount, dot.desiredAmount, animationProgress));
      dot.currentSize = MathHelper.lerp(dot.currentSize, dot.desiredSize, animationProgress);

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.currentSize, 0, 2 * Math.PI);
      ctx.fillStyle = dot.color;
      ctx.fill();

      if (dot.borderRequired) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = 'white';
      ctx.font = '9px e-Ukraine serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Formatter.formatNumber(dot.currentAmount), dot.x, dot.y);

      ctx.closePath();
    });

    if (animationProgress < 1) {
      requestAnimationFrame(() => this.#render());
    }
  }

  /**
   * transform events to dots
   *
   * @private
   * @param {CrimeEventGroup[]} events events to transform
   * @returns {Dot[]} array of dots
   */
  #eventsToDots(events) {
    return events
      .filter((event) => event.lat && event.lon)
      .map((event) => {
        const x = (event.lon - MAP_BOUNDARIES.lonMin) / MAP_BOUNDARIES_RANGES.lonRange * this.#canvas.width;
        const y = this.#canvas.height- (event.lat - MAP_BOUNDARIES.latMin) / MAP_BOUNDARIES_RANGES.latRange * this.#canvas.height;

        const diffusedX = x + Math.random() * DIFFUSE_AMOUNT_PX - DIFFUSE_AMOUNT_PX / 2;
        const diffusedY = y + Math.random() * DIFFUSE_AMOUNT_PX - DIFFUSE_AMOUNT_PX / 2;

        return {
          x: diffusedX,
          y: diffusedY,
          currentSize: 0,
          desiredSize: Math.max(Math.log2(event.amount) * 2, 1),
          color: CRIME_TYPE_TO_COLOR_MAP[event.affectedType],
          borderRequired: CRIME_TYPE_BORDER_REQUIRED[event.affectedType] ?? false,
          currentAmount: 0,
          desiredAmount: event.amount,
        };
      });
  }

  /**
   * Sets the default scale for the canvas to ensure that the image fills the whole screen.
   */
  #setDefaultScale() {
    this.#currentScale = Math.max(
      window.innerWidth / this.#canvas.width,
      window.innerHeight / this.#canvas.height
    );

    this.#applyTransformProps();
  }

  /**
   * Loads an image to be used as a map.
   */
  #prepareImage() {
    const img = new Image();

    img.onload = () => {
      this.#mapImg = img;

      this.#canvas.width = img.width;
      this.#canvas.height = img.height;

      // recalculate dots with a new size
      this.#eventDots = this.#eventsToDots(this.#events);
      this.#render();
    }

    img.src = mapUrl;
  }

  /**
   * Sets up the resize event listener for the canvas element.
   */
  #setupResize() {
    const zoom = (centerX, centerY, delta) => {
      centerX -= this.#canvas.getBoundingClientRect().left;
      centerY -= this.#canvas.getBoundingClientRect().top;

      const newScale = MathHelper.clamp(this.#currentScale - delta, 0.2, 5);

      if (this.#currentScale === newScale) {
        return;
      }

      this.#currentOffset.x += centerX * (1 - newScale / this.#currentScale);
      this.#currentOffset.y += centerY * (1 - newScale / this.#currentScale);

      const previousScaleLevel = this.#determineScaleLevel();
      this.#currentScale = newScale;
      const currentScaleLevel = this.#determineScaleLevel();

      if (previousScaleLevel !== currentScaleLevel) {
        this.dispatchEvent(new CustomEvent('scale-change', {
          detail: {
            scale: currentScaleLevel,
          }
        }));
      }

      this.#applyTransformProps();
      this.#render();
    }

    this.#canvas.addEventListener('wheel', (event) => {
        if (event.deltaY) {
          event.preventDefault();

          zoom(event.clientX, event.clientY, event.deltaY / 1000);
        }
      }, {
      signal: this.#destroyController.signal, passive: false
    });

    let initialDistance = 0;

    this.#canvas.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        initialDistance = getDistance(event);
      }
    }, { signal: this.#destroyController.signal });

    this.#canvas.addEventListener('touchmove', (event) => {
      if (event.touches.length === 2) {
        event.preventDefault();

        const distance = getDistance(event);
        const delta = distance - initialDistance;

        const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        zoom(centerX, centerY, -delta / 300);

        initialDistance = distance;
      }
    }, { signal: this.#destroyController.signal });

    function getDistance(event) {
      const dx = event.touches[1].clientX - event.touches[0].clientX;
      const dy = event.touches[1].clientY - event.touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Sets up drag and drop functionality on the canvas element.
   */
  #setupDragNDrop() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const startDragging = (event) => {
      isDragging = true;
      const clientX = event.clientX === undefined ? event.touches[0].clientX : event.clientX;
      const clientY = event.clientY === undefined ? event.touches[0].clientY : event.clientY;

      startX = clientX - this.#currentOffset.x;
      startY = clientY - this.#currentOffset.y;

      this.#canvas.style.cursor = 'grabbing';
    }

    this.#canvas.addEventListener('mousedown', startDragging, { signal: this.#destroyController.signal });
    this.#canvas.addEventListener('touchstart', startDragging, { signal: this.#destroyController.signal });

    const onDrag = (event) => {
      if (!isDragging || event.touches?.length > 1) {
        return;
      }
      event.preventDefault();

      const clientX = event.clientX === undefined ? event.touches[0].clientX : event.clientX;
      const clientY = event.clientY === undefined ? event.touches[0].clientY : event.clientY;

      this.#currentOffset.x = clientX - startX;
      this.#currentOffset.y = clientY - startY;

      this.#applyTransformProps();
    }

    this.#canvas.addEventListener('mousemove', onDrag, { signal: this.#destroyController.signal });
    this.#canvas.addEventListener('touchmove', onDrag, { signal: this.#destroyController.signal });


    const stopDragging = () => {
      isDragging = false;
      this.#canvas.style.cursor = 'default';
    }

    this.#canvas.addEventListener('mouseup', stopDragging, { signal: this.#destroyController.signal });
    this.#canvas.addEventListener('touchend', stopDragging, { signal: this.#destroyController.signal });
  }

  /**
   * Applies the current scale and offset to the canvas element.
   */
  #applyTransformProps() {
    this.#canvas.style.transform = `translate(${this.#currentOffset.x}px, ${this.#currentOffset.y}px) scale(${this.#currentScale})`;
    this.#canvas.style.transformOrigin = 'top left';
  }

  /**
   * Determines the current scale level based on the current scale.
   *
   * @returns {SCALE}
   */
  #determineScaleLevel() {
    if (this.#currentScale > 4) {
      return SCALE.CITY;
    } else if (this.#currentScale > 2) {
      return SCALE.DISTRICT;
    } else {
      return SCALE.REGION;
    }
  }

  /**
   * Sets the legend for the map.
   */
  #setLegend() {
    const legend = this.shadowRoot.getElementById('legend');

    legend.innerHTML = '';

    this.#affectedTypes.forEach((affectedType) => {
      // Create the outer div
      const outerDiv = document.createElement('div');
      outerDiv.classList.add('crime');

      // Create the circle div
      const circleDiv = document.createElement('div');
      circleDiv.classList.add('circle');

      circleDiv.style.backgroundColor = CRIME_TYPE_TO_COLOR_MAP[affectedType.affectedType];
      circleDiv.style.border = CRIME_TYPE_BORDER_REQUIRED[affectedType.affectedType] ? '1px white solid' : '';

      outerDiv.appendChild(circleDiv);

      // Create the span element
      const spanElement = document.createElement('span');
      spanElement.textContent = affectedType.name;
      outerDiv.appendChild(spanElement);

      // Append to the legend
      legend.appendChild(outerDiv);
    });

    // set the legend height into root variable
    document.documentElement.style.setProperty('--legend-height', `${legend.offsetHeight}px`);
  }
}
