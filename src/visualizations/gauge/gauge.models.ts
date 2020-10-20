/*
 * Copyright (c) 2018 Sensormatic Electronics, LLC. All rights reserved.
 * Reproduction is forbidden without written approval of Sensormatic Electronics, LLC.
 */

import { BaseType, Selection } from 'd3-selection';
import { Arc, DefaultArcObject } from 'd3-shape';
import 'd3-transition';
import { IConfiguration, IVisualization } from '../../core/models';

export interface IGaugeVisualization extends IVisualization {
    svg?: any;
    container?: HTMLDivElement;
    chartElement?: HTMLDivElement;
    textElement?: HTMLDivElement;

    config: IConfiguration;
    elementOptions?: any;
    chart?: Selection<BaseType, {}, HTMLElement, any>;
    gaugeArc?: Arc<any, DefaultArcObject>;
    clipPath?: any;
    gradientId?: string;
    gradientGroup?: Selection<BaseType, {}, HTMLElement, any>;    
}

export const GAUGE_DEFAULT_OPTION_VALUES: any = {
    circleGap: 60,
    height: 175,
    transitionDuration: 1000,
    circleThickness: 10,
    baseColor: '#00b7a8',
    textColor: '#000000',
    automationId: 'tvc-gauge'
};

export const GAUGE_VIS_OPTIONS = {
    transitionDuration: {
        label: 'Transition duration (miliseconds)',
        min: 0,
        default: GAUGE_DEFAULT_OPTION_VALUES.transitionDuration,
        section: 'Config',
        type: 'number',
        placeholder: 'Delay in miliseconds'
    },
    circleThickness: {
        label: 'Circle thickness (1-20)',
        min: 1,
        max: 20,
        default: GAUGE_DEFAULT_OPTION_VALUES.circleThickness,
        section: 'Config',
        type: 'number'
    },
    circleGap: {
        label: 'Circle gap in degrees (0-180)',
        min: 0,
        max: 180,
        default: GAUGE_DEFAULT_OPTION_VALUES.circleGap,
        section: 'Config',
        type: 'number'
    },
    automationId: {
        label: 'Automation ID (For automated testing)',
        default: 'tvc_gauge',
        section: 'Config',
        type: 'string'
    },
    baseColor: {
        label: 'Base color',
        default: GAUGE_DEFAULT_OPTION_VALUES.baseColor,
        section: 'Style',
        type: 'string',
        display: 'color'
    },
    textColor: {
        label: 'Text color',
        default: GAUGE_DEFAULT_OPTION_VALUES.textColor,
        section: 'Style',
        type: 'string',
        display: 'color'
    }
}

export interface IGaugeValues { 
    nominator: number,
    denominator: number,
    percentage: number
}