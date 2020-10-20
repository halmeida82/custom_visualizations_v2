/*
 * Copyright (c) 2018 Sensormatic Electronics, LLC. All rights reserved.
 * Reproduction is forbidden without written approval of Sensormatic Electronics, LLC.
 */

export const GAUGE_STYLE: string = `
    <style>
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