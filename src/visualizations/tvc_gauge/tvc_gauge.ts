// Global values provided via the API
declare var looker: Looker;

// import * as d3 from 'd3';
import { range } from 'd3-array';
import { rgb } from 'd3-color';
import { easeExpOut } from 'd3-ease';
import { interpolate } from 'd3-interpolate';
import { BaseType, select, Selection } from 'd3-selection';
import { arc, Arc, DefaultArcObject } from 'd3-shape';
import 'd3-transition';
import { Looker, VisualizationDefinition } from '../../common/types';

interface GaugeVisualization extends VisualizationDefinition {
  svg?: any;
  chartElement?: any;
  textElement?: any;

  chart?: Selection<BaseType, {}, HTMLElement, any>;
  gaugeArc?: Arc<any, DefaultArcObject>;
  clipPath?: any;
  gradientId?: string;
  gradientGroup?: Selection<BaseType, {}, HTMLElement, any>;
}

// @ts-ignore
const defaults: any = {
  circleGap: 60,
  height: 175,
  transitionDuration: 1000,
  circleThickness: 10,
  baseColor: '#00b7a8'
};

function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function getChartOptions(element: any, vis: any) {
  const circleRad = Math.PI * 2;
  const perimeter = deg2rad(360 - vis.circleGap);
  const lateralOffset = (circleRad - perimeter) / 2;
  const angles = { start: -circleRad / 2 + lateralOffset, end: circleRad / 2 - lateralOffset };
  const radius = { inner: defaults.height / 2 - defaults.circleThickness, outer: defaults.height / 2 };
  const width = element.offsetWidth;
  const height = defaults.height;
  const duration = defaults.transitionDuration;
  const baseColor = defaults.baseColor;

  return { width, height, duration, perimeter, radius, angles, baseColor };
}

function value2chart(value: number, perimeter: number) {
  return (value * perimeter) / 100 - perimeter / 2;
}

function buildChart(element: any, data: any, queryResponse: any, vis: any) {

  if (vis.chart) {
    return;
  }

	// Grab the first cell of the data.
  const firstRow = data[0];
  const nominator = firstRow[queryResponse.fields.measures[0].name].value;
  const denominator = firstRow[queryResponse.fields.measures[1].name].value;

  const opts = vis.options = getChartOptions(element, vis);

  console.log(opts);
  const colorDarker = rgb(opts.baseColor).darker(0.5);
  const colorBrighter = rgb(opts.baseColor).brighter(0.5);
  const chartContainer = select(element);

  // Clear HTML content of the chart container's DOM element
  chartContainer.html(null);

  // Set up the chart SVG element and an SVG group, centered in the view box
  vis.chart = chartContainer
    .append('svg')
    .attr('width', opts.width)
    .attr('height', opts.height)
    .append('g')
    .attr('transform', `translate(${opts.width / 2}, ${opts.height / 2})`);

  // Generate arc
  vis.gaugeArc = arc()
    .innerRadius(opts.radius.inner)
    .outerRadius(opts.radius.outer)
    .startAngle(opts.angles.start)
    .cornerRadius((opts.radius.outer - opts.radius.inner) / 2);

  // Generate gray background
  vis.chart
    .append('path')
    .datum({ endAngle: opts.angles.end })
    .style('fill', '#ddd')
    .attr('d', vis.gaugeArc);

  // Generate arc for the gradient
  const gradientArc = arc()
  .innerRadius(opts.radius.inner)
  .outerRadius(opts.radius.outer);

  // Generate data to create the slices for the gradient arc
  const datum = range(200).map(i => {
    return {
      startAngle: value2chart(i / 2, opts.perimeter),
      endAngle: value2chart(i / 2 + 1, opts.perimeter),
      percentage: i / 2 + 1
    };
  });

  vis.gradientId = 'foreground-clip-1';

  // Create group for the gradient using the clipPath element as clipping path
  // this.gradientGroup = this.chart.append('g').attr('clip-path', this.gradientId);
  vis.gradientGroup = vis.chart.append('g').attr('clip-path', `url(${window.location}#${vis.gradientId})`);

  // Map colors to the gradient slices from the darker to the brighter color variants
  vis.gradientGroup
    .selectAll('.piece')
    .data(datum)
    .enter()
    .append('path')
    .attr('class', 'piece')
    .attr('d', gradientArc)
    .style('fill', (d: any) => {
      const red = colorDarker.r + (d.percentage / 100) * (colorBrighter.r - colorDarker.r);
      const green = colorDarker.g + (d.percentage / 100) * (colorBrighter.g - colorDarker.g);
      const blue = colorDarker.b + (d.percentage / 100) * (colorBrighter.b - colorDarker.b);

      return rgb(red, green, blue).toString();
    });

  // Create clipping path to clip the gradient slices
  vis.clipPath = vis.chart
    .append('defs')
    .append('clipPath')
    .attr('id', vis.gradientId)
    .append('path')
    .datum({ endAngle: value2chart(0, opts.perimeter) })
    .attr('d', vis.gaugeArc);

  // Animate the chart to the actual provided value
  updateValue(((nominator / denominator) * 100), false, vis);
}

function updateValue(value: number, animate: boolean, vis: any) {
  vis.clipPath
    .transition()
    .ease(easeExpOut)
    .duration(animate ? 750 : 0)
    .attrTween('d', (d: any) => {
      const newAngle = value2chart(value, vis.options.perimeter);
      const interpolatedValue = interpolate(d.endAngle, newAngle);

      return (t: any) => {
        d.endAngle = interpolatedValue(t);

        return vis.gaugeArc(d);
      };
    });
}

const vis: GaugeVisualization = {
  id: 'gauge', // id/label not required, but nice for testing and keeping manifests in sync
  label: 'Gauge',
  options: {
    showComparison: {
      label: 'Use field comparison',
      default: false,
      section: 'Value',
      type: 'boolean'
    },
    minValue: {
      label: 'Min value',
      min: 0,
      default: defaults.minValue,
      section: 'Value',
      type: 'number',
      placeholder: 'Any positive number'
    },
    maxValue: {
      label: 'Max value',
      min: 0,
      default: defaults.maxValue,
      section: 'Value',
      type: 'number',
      placeholder: 'Any positive number'
    },
    circleThickness: {
      label: 'Circle Thickness',
      min: 0,
      max: 1,
      step: 0.05,
      default: defaults.circleThickness,
      section: 'Style',
      type: 'number',
      display: 'range'
    },
    circleFillGap: {
      label: 'Circle Gap',
      min: 0,
      max: 1,
      step: 0.05,
      default: defaults.circleFillGap,
      section: 'Style',
      type: 'number',
      display: 'range'
    },
    circleColor: {
      label: 'Circle Color',
      default: defaults.circleColor,
      section: 'Style',
      type: 'string',
      display: 'color'
    },
    waveHeight: {
      label: 'Wave Height',
      min: 0,
      max: 1,
      step: 0.05,
      default: defaults.waveHeight,
      section: 'Waves',
      type: 'number',
      display: 'range'
    },
    waveCount: {
      label: 'Wave Count',
      min: 0,
      max: 10,
      default: defaults.waveCount,
      section: 'Waves',
      type: 'number',
      display: 'range'
    },
    waveRiseTime: {
      label: 'Wave Rise Time',
      min: 0,
      max: 5000,
      step: 50,
      default: defaults.waveRiseTime,
      section: 'Waves',
      type: 'number',
      display: 'range'
    },
    waveAnimateTime: {
      label: 'Wave Animation Time',
      min: 0,
      max: 5000,
      step: 50,
      default: defaults.waveAnimateTime,
      section: 'Waves',
      type: 'number',
      display: 'range'
    },
    waveRise: {
      label: 'Wave Rise from Bottom',
      default: defaults.waveRise,
      section: 'Waves',
      type: 'boolean'
    },
    waveHeightScaling: {
      label: 'Scale waves if high or low',
      default: defaults.waveHeightScaling,
      section: 'Waves',
      type: 'boolean'
    },
    waveAnimate: {
      label: 'Animate Waves',
      default: true,
      section: 'Waves',
      type: 'boolean'
    },
    waveColor: {
      label: 'Wave Color',
      default: '#64518A',
      section: 'Style',
      type: 'string',
      display: 'color'
    },
    waveOffset: {
      label: 'Wave Offset',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0,
      section: 'Waves',
      type: 'number',
      display: 'range'
    },
    textVertPosition: {
      label: 'Text Vertical Offset',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      section: 'Value',
      type: 'number',
      display: 'range'
    },
    textSize: {
      label: 'Text Size',
      min: 0,
      max: 1,
      step: 0.01,
      default: 1,
      section: 'Value',
      type: 'number',
      display: 'range'
    },
    valueCountUp: {
      label: 'Animate to Value',
      default: true,
      section: 'Waves',
      type: 'boolean'
    },
    displayPercent: {
      label: 'Display as Percent',
      default: true,
      section: 'Value',
      type: 'boolean'
    },
    textColor: {
      label: 'Text Color (non-overlapped)',
      default: '#000000',
      section: 'Style',
      type: 'string',
      display: 'color'
    },
    waveTextColor: {
      label: 'Text Color (overlapped)',
      default: '#FFFFFF',
      section: 'Style',
      type: 'string',
      display: 'color'
    }
  },
  // Set up the initial state of the visualization
  create(element, config) {
    /*element.style.margin = '10px'
    element.style.fontFamily = `'Open Sans', 'Helvetica', sans-serif`
    element.innerHTML = `
      <style>
        .node, .link {
          transition: 0.5s opacity;
        }
      </style>
    `
    const elementId = `fill-gauge-${Date.now()}`
    this.svg = d3.select(element).append('svg')
    this.svg.attr('id', elementId)

    // Create an element to contain the text.
    this._textElement = container.appendChild(document.createElement("div"));
    this._chartElement = container.appendChild(document.createElement("div"));*/

    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
    <style>
		* {
				font-family: "Open Sans",Helvetica,Arial,sans-serif;
    		font-weight: 400;
    		font-size: 14px;
		}

    .hello-world-text-large {
        font-size: 18px;/*72px;*/
				position:absolute;
				width:95%;
				text-align:center;
    }
    .hello-world-text-small {
        font-size: 18px;
				position:absolute;
				width:95%;
				text-align:center;
    }
    .hello-world-vis {
        // Vertical centering
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
				position:relative
    }
		.chart-details {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

		.chart-details h1.value-label {
				line-height: 1;
				font-family: Montserrat,Helvetica,Arial,sans-serif;
		    font-weight: 400;
    		font-size: 32px;
		    text-transform: uppercase;
		}

		.chart-details span.value-breakdown {
				align-items: center;
				font-size: 12px;
		}

    </style>`;

    // Create a container element to let us center the text.
    const container = element.appendChild(document.createElement('div'));
    container.className = 'hello-world-vis';

    // Create an element to contain the text.
    this.chartElement = container.appendChild(document.createElement('div'));
    this.textElement = container.appendChild(document.createElement('div'));

  },
  // Render in response to the data or settings changing
  updateAsync(data, element, config, queryResponse, details, done) {
    /*if (
      !handleErrors(this, queryResponse, {
        min_pivots: 0,
        max_pivots: 0,
        min_dimensions: 0,
        max_dimensions: undefined,
        min_measures: 1,
        max_measures: undefined
      })
    ) {
      return
    }

    // @ts-ignore
    const gaugeConfig = Object.assign(Gauge.defaultConfig, config)

    if (this.addError && this.clearErrors) {
      if (gaugeConfig.maxValue <= 0) {
        this.addError({
          group: 'config',
          title: 'Max value must be greater than zero.'
        })
        return
      } else if (data.length === 0) {
        this.addError({
          title: 'No results.'
        })
        return
      } else {
        this.clearErrors('config')
      }
    }

    const firstRow = data[0]
    const nominator = firstRow[queryResponse.fields.measures[0].name].value
    const denominator = firstRow[queryResponse.fields.measures[1].name].value

    // Insert the data into the page.
    // this._textElement.innerHTML = `${nominator} / ${denominator}`;

    buildChart(this._chartElement,data,queryResponse)

    // Always call done to indicate a visualization has finished rendering.
    done()

    /*const datumField = queryResponse.fields.measure_like[0]
    const datum = data[0][datumField.name]
    let value = datum.value

    const compareField = queryResponse.fields.measure_like[1]
    if (compareField && gaugeConfig.showComparison) {
      const compareDatum = data[0][compareField.name]
      gaugeConfig.maxValue = compareDatum.value
    }

    if (gaugeConfig.displayPercent) {
      value = (datum.value / gaugeConfig.maxValue) * 100
      gaugeConfig.maxValue = 100
    }

    this.svg.html('')
    this.svg.attr('width', element.clientWidth - 20)
    this.svg.attr('height', element.clientHeight - 20)

    // @ts-ignore
    if (details['print']) {
      Object.assign(gaugeConfig, {
        valueCountUp: false,
        waveAnimateTime: 0,
        waveRiseTime: 0,
        waveAnimate: false,
        waveRise: false
      })
    }

    // @ts-ignore
    debugger

    (d3 as any).gauge(this.svg, value, gaugeConfig)*/

    // Clear any errors from previous updates.
    // @ts-ignore
    this.clearErrors();

    // Throw some errors and exit if the shape of the data isn't what this chart needs.
    if (queryResponse.fields.measures.length < 2) {
      // @ts-ignore
      this.addError({
        title: 'Not enough measures',
        message: 'This chart requires 2 measures.'
      });
      return;
    }

    if (config.font_size === 'small') {
      this.textElement.className = 'hello-world-text-small chart-details';
    } else {
      this.textElement.className = 'hello-world-text-large chart-details';
    }

    // Grab the first cell of the data.
    const firstRow = data[0];
    const nominator = firstRow[queryResponse.fields.measures[0].name].value;
    const denominator = firstRow[queryResponse.fields.measures[1].name].value;
    const percentage = ((nominator / denominator) * 100).toFixed(1);

    // Insert the data into the page.
    this.textElement.innerHTML = `
			<h1 class="value-label">
      ${percentage}%
      </h1>
      <span class="value-breakdown tv-h-flex-center tv-h-flex-justify-center">
      ${nominator} / ${denominator}
      </span>
		`;

    buildChart(this.chartElement,data,queryResponse, this);

    // Always call done to indicate a visualization has finished rendering.
    done();

  }
};

looker.plugins.visualizations.add(vis);
