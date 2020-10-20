/*
 * Copyright (c) 2018 Sensormatic Electronics, LLC. All rights reserved.
 * Reproduction is forbidden without written approval of Sensormatic Electronics, LLC.
 */

import { range } from 'd3-array';
import { rgb } from 'd3-color';
import { easeExpOut } from 'd3-ease';
import { interpolate } from 'd3-interpolate';
import { select } from 'd3-selection';
import { arc } from 'd3-shape';
import 'd3-transition';
import { IConfiguration, IData, ILooker, IQueryResponse, IUpdateDetails } from '../../core/models';
import { COMMON_STYLE } from '../../core/styles';
import { handleErrors } from '../../core/utils';
import { GAUGE_DEFAULT_OPTION_VALUES, GAUGE_VIS_OPTIONS, IGaugeValues, IGaugeVisualization } from './gauge.models';
import { GAUGE_STYLE } from './gauge.styles';

declare var looker: ILooker;

const vis: IGaugeVisualization = {
    id: 'tvc_gauge',
    label: 'Gauge',
    options: GAUGE_VIS_OPTIONS,
    config: {},
    create(element:HTMLElement, config:IConfiguration) {
        this.config = Object.assign(GAUGE_DEFAULT_OPTION_VALUES, config);

        addStyles(element);
        
        this.container = element.appendChild(document.createElement('div'));
        this.container.className = 'vertical-central';
        this.container.setAttribute('automationId', this.config.automationId);

        this.chartElement = this.container.appendChild(document.createElement('div'));
        
        this.textElement = this.container.appendChild(document.createElement('div'));
        this.textElement.className = 'text-large chart-details';
    },
    update(data:IData, element:HTMLElement, config:IConfiguration, queryResponse:IQueryResponse, details:IUpdateDetails|undefined) {
        this.config = Object.assign(GAUGE_DEFAULT_OPTION_VALUES, config);
        
        if (this.clearErrors) {
            this.clearErrors();
        }

        if (!handleErrors(this,queryResponse,{min_measures:2,max_measures:2})) {
            return;
        }
        
        if (this.textElement) {
            if (config.font_size === 'small') {
                this.textElement.className = 'text-small chart-details';
            } else {
                this.textElement.className = 'text-large chart-details';
            }
        }

        if (this.textElement) {
            updateTextElement(data, queryResponse, this.textElement, this.config);
        }

        if (this.chartElement) {
            updateChartElement(data, queryResponse, this.chartElement, this.config);
        }

        // Always call done to indicate a visualization has finished rendering.
        // done();
    }
};

function addStyles(element:HTMLElement) { 
    element.innerHTML += `${COMMON_STYLE}
                          ${GAUGE_STYLE}`;
}

function deg2rad(deg: number) {
    return (deg * Math.PI) / 180;
}

function getChartAttributes(element: HTMLDivElement, config:IConfiguration) {
    const circleRad = Math.PI * 2;
    const perimeter = deg2rad(360 - config.circleGap);
    const lateralOffset = (circleRad - perimeter) / 2;
    const angles = { start: -circleRad / 2 + lateralOffset, end: circleRad / 2 - lateralOffset };
    const radius = { inner: GAUGE_DEFAULT_OPTION_VALUES.height / 2 - config.circleThickness, outer: GAUGE_DEFAULT_OPTION_VALUES.height / 2 };
    const width = element.offsetWidth;
    const height = GAUGE_DEFAULT_OPTION_VALUES.height;
    const duration = config.transitionDuration;
    const baseColor = config.baseColor;

    return { width, height, duration, perimeter, radius, angles, baseColor };
}

function value2chart(value: number, perimeter: number) {
    return (value * perimeter) / 100 - perimeter / 2;
}

function updateChartElement(data: IData, queryResponse: IQueryResponse, chartElement:HTMLDivElement, config:IConfiguration) {
    // Grab the first cell of the data.
    const gaugeValues = getGaugeValues(data, queryResponse);

    const chartAttributes = getChartAttributes(chartElement, config);

    const colorDarker = rgb(chartAttributes.baseColor).darker(0.5);
    const colorBrighter = rgb(chartAttributes.baseColor).brighter(0.5);
    const chartContainer = select(chartElement);

    // Clear HTML content of the chart container's DOM element
    chartContainer.html(null);

    // Set up the chart SVG element and an SVG group, centered in the view box
    const chart = chartContainer
        .append('svg')
        .attr('width', chartAttributes.width)
        .attr('height', chartAttributes.height)
        .append('g')
        .attr('transform', `translate(${chartAttributes.width / 2}, ${chartAttributes.height / 2})`);

    // Generate arc
    const gaugeArc:any = arc()
        .innerRadius(chartAttributes.radius.inner)
        .outerRadius(chartAttributes.radius.outer)
        .startAngle(chartAttributes.angles.start)
        .cornerRadius((chartAttributes.radius.outer - chartAttributes.radius.inner) / 2);

    // Generate gray background
    chart.append('path')
        .datum({ endAngle: chartAttributes.angles.end })
        .style('fill', '#ddd')
        .attr('d', gaugeArc);

    // Generate arc for the gradient
    const gradientArc:any = arc()
        .innerRadius(chartAttributes.radius.inner)
        .outerRadius(chartAttributes.radius.outer);

    // Generate data to create the slices for the gradient arc
    const datum = range(200).map(i => {
        return {
            startAngle: value2chart(i / 2, chartAttributes.perimeter),
            endAngle: value2chart(i / 2 + 1, chartAttributes.perimeter),
            percentage: i / 2 + 1
        };
    });

    const gradientId = 'foreground-clip-1';

    // Create group for the gradient using the clipPath element as clipping path
    const gradientGroup = chart.append('g').attr('clip-path', `url(${window.location}#${gradientId})`);

    // Map colors to the gradient slices from the darker to the brighter color variants
    gradientGroup
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
    vis.clipPath = chart
        .append('defs')
        .append('clipPath')
        .attr('id', gradientId)
        .append('path')
        .datum({ endAngle: value2chart(0, chartAttributes.perimeter) })
        .attr('d', gaugeArc);

    // Animate the chart to the actual provided value
    updateChartValue(gaugeValues.percentage, true, chartAttributes, gaugeArc);
}

function updateChartValue(value: number, animate: boolean, chartAttributes: any, gaugeArc:any) {
    vis.clipPath
        .transition()
        .ease(easeExpOut)
        .duration(animate ? chartAttributes.duration : 0)
        .attrTween('d', (d: any) => {
            const newAngle = value2chart(value, chartAttributes.perimeter);
            const interpolatedValue = interpolate(d.endAngle, newAngle);

            return (t: any) => {
                d.endAngle = interpolatedValue(t);

                return gaugeArc(d);
            };
        });
}

function updateTextElement(data:IData, queryResponse:IQueryResponse, textElement:HTMLDivElement, config:IConfiguration) {
    
    const gaugeValues = getGaugeValues(data, queryResponse);
        
    textElement.innerHTML = `
        <h1 class="value-label" style="color:${config.textColor}">
        ${gaugeValues.percentage.toFixed(1)}%
        </h1>
        <span class="value-breakdown" style="color:${config.textColor}">
        ${gaugeValues.nominator} / ${gaugeValues.denominator}
        </span>
    `;
}

function getGaugeValues(data:IData, queryResponse:IQueryResponse): IGaugeValues {
    
    const firstRow = data[0];

    const gaugeValues: IGaugeValues = {
        nominator: firstRow[queryResponse.fields.measures[0].name].value,
        denominator: firstRow[queryResponse.fields.measures[1].name].value,
        percentage: firstRow[queryResponse.fields.measures[1].name].value === 0 ? 0 : (firstRow[queryResponse.fields.measures[0].name].value / firstRow[queryResponse.fields.measures[1].name].value) * 100
    }

    return gaugeValues;
}

looker.plugins.visualizations.add(vis);