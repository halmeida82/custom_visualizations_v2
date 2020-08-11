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

  gaugeConfig?: any;
  elementOptions?: any;
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
  baseColor: '#00b7a8',
  textColor: '#000000'
};

function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function getChartOptions(element: any, vis: any) {
  const circleRad = Math.PI * 2;
  const perimeter = deg2rad(360 - vis.gaugeConfig.circleGap);
  const lateralOffset = (circleRad - perimeter) / 2;
  const angles = { start: -circleRad / 2 + lateralOffset, end: circleRad / 2 - lateralOffset };
  const radius = { inner: defaults.height / 2 - vis.gaugeConfig.circleThickness, outer: defaults.height / 2 };
  const width = element.offsetWidth;
  const height = defaults.height;
  const duration = vis.gaugeConfig.transitionDuration;
  const baseColor = vis.gaugeConfig.baseColor;

  return { width, height, duration, perimeter, radius, angles, baseColor };
}

function value2chart(value: number, perimeter: number) {
  return (value * perimeter) / 100 - perimeter / 2;
}

function buildChart(element: any, data: any, queryResponse: any, vis: any) {

  // Grab the first cell of the data.
  const firstRow = data[0];
  const nominator = firstRow[queryResponse.fields.measures[0].name].value;
  const denominator = firstRow[queryResponse.fields.measures[1].name].value;
  const percentage = denominator === 0 ? 0 : (nominator / denominator) * 100;

  const opts = vis.elementOptions = getChartOptions(element, vis);

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
  updateValue(percentage, true, vis);
}

function updateValue(value: number, animate: boolean, vis: any) {
  vis.clipPath
    .transition()
    .ease(easeExpOut)
    .duration(animate ? vis.elementOptions.duration : 0)
    .attrTween('d', (d: any) => {
      const newAngle = value2chart(value, vis.elementOptions.perimeter);
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
    transitionDuration: {
      label: 'Transition duration (miliseconds)',
      min: 0,
      default: defaults.transitionDuration,
      section: 'Config',
      type: 'number',
      placeholder: 'Delay in miliseconds'
    },
    circleThickness: {
      label: 'Circle thickness (1-20)',
      min: 1,
      max: 20,
      default: defaults.circleThickness,
      section: 'Config',
      type: 'number'
    },
    circleGap: {
      label: 'Circle gap in degrees (0-180)',
      min: 0,
      max: 180,
      default: defaults.circleGap,
      section: 'Config',
      type: 'number'
    },
    baseColor: {
      label: 'Base color',
      default: defaults.baseColor,
      section: 'Style',
      type: 'string',
      display: 'color'
    },
    textColor: {
      label: 'Text color',
      default: defaults.textColor,
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
  update(data, element, config, queryResponse, details) {
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
  */

    this.gaugeConfig = Object.assign(defaults, config);

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
    const percentage = denominator === 0 ? (0).toFixed(1) : ((nominator / denominator) * 100).toFixed(1);

    // Insert the data into the page.
    this.textElement.innerHTML = `
			<h1 class="value-label" style="color:${this.gaugeConfig.textColor}">
      ${percentage}%
      </h1>
      <span class="value-breakdown" style="color:${this.gaugeConfig.textColor}">
      ${nominator} / ${denominator}
      </span>
		`;

    buildChart(this.chartElement,data,queryResponse, this);

    // Always call done to indicate a visualization has finished rendering.
    // done();

  }
};

looker.plugins.visualizations.add(vis);
