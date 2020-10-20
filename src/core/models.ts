/*
 * Copyright (c) 2018 Sensormatic Electronics, LLC. All rights reserved.
 * Reproduction is forbidden without written approval of Sensormatic Electronics, LLC.
 */

export interface ILooker {
    plugins: {
        visualizations: {
            add: (visualization: IVisualization) => void;
        };
    };
}

export interface LookerChartUtils {
    Utils: {
        openDrillMenu: (options: { links: ILink[]; event: object }) => void;
        openUrl: (url: string, event: object) => void;
        textForCell: (cell: ICell) => string;
        filterableValueForCell: (cell: ICell) => string;
        htmlForCell: (cell: ICell, context?: string, fieldDefinitionForCell?: any, customHtml?: string) => string;
    };
}

// Looker visualization types
export interface IVisualization {
    id?: string;
    label?: string;
    options: IOptions;
    addError?: (error: IError) => void;
    clearErrors?: (errorName?: string) => void;
    create: (element: HTMLElement, settings: IConfiguration) => void;
    trigger?: (event: string, config: object[]) => void;
    update?: (
        data: IData,
        element: HTMLElement,
        config: IConfiguration,
        queryResponse: IQueryResponse,
        details?: IUpdateDetails
    ) => void;
    updateAsync?: (
        data: IData,
        element: HTMLElement,
        config: IConfiguration,
        queryResponse: IQueryResponse,
        details: IUpdateDetails | undefined,
        updateComplete: () => void
    ) => void;
    destroy?: () => void;
}

export interface IOptions {
    [optionName: string]: IOption;
}

export interface IOptionValue {
    [label: string]: string;
}

export interface IQueryResponse {
    [key: string]: any;
    data: IData;
    fields: {
        [key: string]: any[];
    };
    pivots: IPivot[];
}

export interface IPivot {
    key: string;
    is_total: boolean;
    data: { [key: string]: string };
    metadata: { [key: string]: { [key: string]: string } };
}

export interface ILink {
    label: string;
    type: string;
    type_label: string;
    url: string;
}

export interface ICell {
    [key: string]: any;
    value: any;
    rendered?: string;
    html?: string;
    links?: ILink[];
}

export interface IFilterData {
    add: string;
    field: string;
    rendered: string;
}

export interface IPivotCell {
    [pivotKey: string]: ICell;
}

export interface IRow {
    [fieldName: string]: IPivotCell | ICell;
}

export type IData = IRow[];

export interface IConfiguration {
    [key: string]: IConfigurationValue;
}

export type IConfigurationValue = any;

export interface IUpdateDetails {
    changed: {
        config?: string[];
        data?: boolean;
        queryResponse?: boolean;
        size?: boolean;
    };
}

export interface IOption {
    type: string;
    values?: IOptionValue[];
    display?: string;
    default?: any;
    label: string;
    section?: string;
    placeholder?: string;
    display_size?: 'half' | 'third' | 'normal';
    order?: number;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
    supports?: string[];
}

export interface IError {
    group?: string;
    message?: string;
    title?: string;
    retryable?: boolean;
    warning?: boolean;
}
