/*
 * Copyright (c) 2018 Sensormatic Electronics, LLC. All rights reserved.
 * Reproduction is forbidden without written approval of Sensormatic Electronics, LLC.
 */

export const COMMON_STYLE: string = `
    <style>
		* {
			font-family: "Open Sans",Helvetica,Arial,sans-serif;
    		font-weight: 400;
    		font-size: 14px;
		}

        .text-large {
            font-family: Monserrat,"Open Sans",Helvetica,Arial,sans-serif;
            font-size: 32px;
            position:absolute;
            width:95%;
            text-align:center;
        }

        .text-small {
            font-size: 18px;
            position:absolute;
            width:95%;
            text-align:center;
        }
        
        .vertical-central {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            position:relative
        }
    </style>
`;