import template from './filter.html?raw';
import styles from './filter.css?inline';
import { StatsHelper } from '../../helpers/stats.helper.js';
import { CRIME_TYPE_TO_COLOR_MAP, UNKNOWN_AFFECTED_TYPE } from '../../constants.js';
import { Formatter } from '../../helpers/formatter.js';

const templateElement = document.createElement('template');
templateElement.innerHTML = template;

export class Filter extends HTMLElement {

  /**
   * regions
   * @type {Region[]}
   */
  #regions = [];

  /**
   * affected types
   * @type {AffectedType[]}
   */
  #affectedTypes = [];

  /**
   * current stats for selected filters
   *
   * @type {Record<string, number>}
   */
  #currentStats = {};

  /**
   * selected region code
   * @type {string}
   */
  #selectedRegionCode = '';

  /**
   * selected city name
   * @type {string}
   */
  #selectedCity = '';

  /**
   * selected crime types (empty means all)
   * @type {string[]}
   */
  #selectedCrimeTypes = [];

  /**
   * Controller that emits when the component is destroyed.
   * @type {AbortController}
   */
  #destroyController = new AbortController();

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElement.content.cloneNode(true));
  }

  disconnectedCallback() {
    this.#destroyController.abort();
  }

  /**
   * set regions
   *
   * @param {Region[]} regions regions
   */
  setRegions(regions) {
    this.#regions = regions;

    if (this.#affectedTypes.length) {
      this.#setInitialState();
    }
  }

  /**
   * set affected types
   *
   * @param {AffectedType[]} affectedTypes
   */
  setAffectedTypes(affectedTypes) {
    this.#affectedTypes = affectedTypes;

    if (this.#regions.length) {
      this.#setInitialState();
    }
  }

  /**
   * Set Filters Initial State
   */
  #setInitialState() {
    this.#currentStats = this.#regions.reduce((acc, region) => {
      return StatsHelper.mergeStats(acc, region.stats);
    }, {});

    this.#setRegionOptions();
    this.#setCityOptions();
    this.#renderStats();

    // listeners
    const regionSelector = this.shadowRoot.getElementById('region');
    regionSelector.addEventListener('change', (event) => {
      this.#selectedRegionCode = event.target.value;
      this.#selectedCity = '';

      const region = this.#regions.find((region) => region.regionCode === this.#selectedRegionCode);

      this.#setCityOptions(region);

      this.#currentStats = region?.stats ?? this.#regions.reduce((acc, region) => {
        return StatsHelper.mergeStats(acc, region.stats);
      }, {});
      this.#renderStats();
    }, {
      signal: this.#destroyController.signal,
    });

    this.shadowRoot.getElementById('city').addEventListener('change', (event) => {
      this.#selectedCity = event.target.value;
      const [regionCode, districtCode, cityName] = this.#selectedCity.split('-');

      const currentRegion = this.#regions.find((region) => region.regionCode === regionCode);

      if (regionCode !== this.#selectedRegionCode) {
        this.#selectedRegionCode = regionCode;
        regionSelector.value = regionCode;

        this.#setCityOptions(currentRegion);
      }

      const currentDistrict = currentRegion.districts.find((district) => district.districtCode === districtCode);
      const currentCity = currentDistrict.cities.find((city) => city.city === cityName);

      this.#currentStats = currentCity.stats;
      this.#renderStats();
    });

    this.shadowRoot.getElementById('clear').addEventListener('click', () => {
      this.#selectedRegionCode = '';
      this.#selectedCity = '';
      this.#selectedCrimeTypes = [];

      this.#currentStats = this.#regions.reduce((acc, region) => {
        return StatsHelper.mergeStats(acc, region.stats);
      }, {});

      this.#setRegionOptions();
      this.#setCityOptions();
      this.#renderStats();
    });

    this.shadowRoot.getElementById('apply').addEventListener('click', () => {
      const [regionCode, districtCode, cityName] = this.#selectedCity.split('-');
      this.dispatchEvent(new CustomEvent('filter-change', {
        detail: {
          regionCode: this.#selectedRegionCode,
          districtCode,
          cityName,
          affectedTypes: this.#selectedCrimeTypes,
        },
      }));
    });
  }

  /**
   * Render Filter Stats
   */
  #renderStats() {
    const statsContainer = this.shadowRoot.getElementById('stats');

    statsContainer.innerHTML = '';

    Object.keys(this.#currentStats).forEach((affectedType) => {
      if (+affectedType === UNKNOWN_AFFECTED_TYPE) {
        return;
      }

      const crimeField = this.#createCrimeTypeField(affectedType);

      statsContainer.appendChild(crimeField);
    });

    // all option
    const allOption = this.#createCrimeTypeField();
    statsContainer.appendChild(allOption);

    // Clean up in case some crime types are not available
    this.#selectedCrimeTypes = this.#selectedCrimeTypes.filter((affectedType) => {
      return Object.keys(this.#currentStats).includes(affectedType);
    });

    if (this.#selectedCrimeTypes.length) {
      this.#selectedCrimeTypes.forEach((affectedType) => {
        const checkbox = this.shadowRoot.getElementById(`crime-${ affectedType }`);

        checkbox.checked = true;
      });
    } else {
      const allCheckbox = this.shadowRoot.getElementById('crime-all');
      allCheckbox.checked = true;
    }

    this.#renderResults();
  }

  /**
   * Create Crime Type Field
   * @param {string} [affectedType] - affectedType. If null, assume all
   * @returns {HTMLLabelElement}
   */
  #createCrimeTypeField(affectedType) {
    const crimeField = document.createElement('label');
    crimeField.className = 'crime-field';
    crimeField.setAttribute('for', `crime-${ affectedType ?? 'all' }`);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = affectedType;
    checkbox.id = `crime-${ affectedType ?? 'all' }`;

    checkbox.addEventListener('change', (event) => {
      const { checked } = event.target;

      // clear when all is selected
      if (checked && !affectedType) {
        this.#selectedCrimeTypes = [];
      } else if (checked) {
        this.#selectedCrimeTypes.push(affectedType);
      } else {
        const index = this.#selectedCrimeTypes.indexOf(affectedType);
        this.#selectedCrimeTypes.splice(index, 1);
      }

      this.#renderStats();
    });

    const crimeName = document.createElement('span');
    crimeName.className = 'crime-name';
    crimeName.textContent = this.#affectedTypes.find((type) => type.affectedType === affectedType)?.name ?? 'All';

    const spacer = document.createElement('span');
    spacer.className = 'spacer';

    const crimeNumber = document.createElement('span');
    crimeNumber.className = 'crime-number';

    if (!affectedType) {
      const totalNumber = Object.values(this.#currentStats).reduce((acc, number) => acc + number, 0);
      crimeNumber.textContent = Formatter.formatNumber(totalNumber);
    } else {
      crimeNumber.textContent = Formatter.formatNumber(this.#currentStats[affectedType]);
    }

    // Add all created elements to the label (crimeField)
    crimeField.appendChild(checkbox);
    crimeField.appendChild(crimeName);
    crimeField.appendChild(spacer);
    crimeField.appendChild(crimeNumber);
    return crimeField;
  }

  /**
   * Sets the options for the region dropdown menu
   */
  #setRegionOptions() {
    const regionOptions = this.shadowRoot.getElementById('region');
    regionOptions.innerHTML = '';

    // add "All States"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All States';

    regionOptions.appendChild(allOption);

    const sortedRegions = this.#regions.sort((a, b) =>
      a.regionName.localeCompare(b.regionName));

    sortedRegions.forEach((region) => {
      const option = document.createElement('option');
      option.value = region.regionCode;
      option.textContent = region.regionName;

      regionOptions.appendChild(option);
    });
  }

  /**
   *
   * @param {Region} [region] get cities only from this city if selected
   */
  #setCityOptions(region) {
    /**
     * @type {Region[]}
     */
    const regionsToProcess = region ? [region] : this.#regions;

    /**
     * @type { (City & {regionCode: string, districtCode: string})[]}
     */
    const allCities = regionsToProcess
      .flatMap((region) => {
        return region.districts.flatMap((district) => {
          return district.cities.map((city) => ({
            ...city,
            regionCode: region.regionCode,
            districtCode: district.districtCode,
          }))
        })
      })
      .sort((a, b) => a.city.localeCompare(b.city));

    const cityOptions = this.shadowRoot.getElementById('city');
    cityOptions.innerHTML = '';

    // add "All Cities"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Cities / Towns';
    cityOptions.appendChild(allOption);

    allCities.sort().forEach((city) => {
      const option = document.createElement('option');
      option.value = `${ city.regionCode }-${ city.districtCode }-${ city.city }`;
      option.textContent = city.city;

      cityOptions.appendChild(option);
    });

    // remain selected city
    if (this.#selectedCity) {
      cityOptions.value = this.#selectedCity;
    }
  }

  /**
   * Renders results section
   */
  #renderResults() {
    const resultNumber = this.shadowRoot.getElementById('result-number');

    const totalNumber = this.#selectedCrimeTypes.length
      ? this.#selectedCrimeTypes.reduce((acc, affectedType) => acc + this.#currentStats[affectedType], 0)
      : Object.values(this.#currentStats).reduce((acc, number) => acc + number, 0);

    resultNumber.textContent = Formatter.formatNumber(totalNumber);

    const chipsContainer = this.shadowRoot.getElementById('chips');

    chipsContainer.innerHTML = '';

    // crime types chips
    this.#selectedCrimeTypes.forEach((affectedType) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.style.backgroundColor = CRIME_TYPE_TO_COLOR_MAP[affectedType];
      chip.style.color = 'white';
      chip.textContent = this.#affectedTypes.find((type) => type.affectedType === affectedType).name;

      chipsContainer.appendChild(chip);
    });

    // state chip
    const stateChip = document.createElement('div');
    stateChip.className = 'chip state';
    stateChip.textContent = this.#regions.find((region) => region.regionCode === this.#selectedRegionCode)?.regionName ?? 'All States';
    chipsContainer.appendChild(stateChip);

    // city chip
    const cityChip = document.createElement('div');
    cityChip.className = 'chip';
    cityChip.textContent = this.#selectedCity?.split('-')[2] ?? 'All Cities / Towns';
    chipsContainer.appendChild(cityChip);
  }
}
