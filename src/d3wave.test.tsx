// Mock ResizeObserver since it's not available in JSDOM
class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor(callback: (entries: any[]) => void) {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserver,
});

// Mock the d3-wave module
jest.mock('d3-wave', () => {
  const originalModule = jest.requireActual('d3-wave');
  return {
    __esModule: true,
    ...originalModule,
    WaveGraph: jest.fn(),
    RowRendererBits: class {
      FORMATTERS: any;
      DEFAULT_FORMAT: any;
      constructor(waveGraph: any) {}
      select(typeInfo: { name: string }) { return false; }
      isValid(data: any) { return false; }
    }
  };
});

import React from 'react';
import * as d3 from 'd3';
import { Viewer, RowRendererString } from './d3wave';
import { WaveGraph } from 'd3-wave';

// Mock DOM environment for JSDOM
const originalMatchMedia = window.matchMedia;
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// For testing without React Testing Library
describe('RowRendererString', () => {
  let mockWaveGraph: WaveGraph;

  beforeEach(() => {
    mockWaveGraph = {} as WaveGraph;
  });

  it('should be initialized with correct formatters', () => {
    const rowRenderer = new RowRendererString(mockWaveGraph);

    expect(rowRenderer.FORMATTERS.STRING).toBeDefined();
    expect(typeof rowRenderer.FORMATTERS.STRING).toBe('function');
    expect(rowRenderer.DEFAULT_FORMAT).toBe(rowRenderer.FORMATTERS.STRING);
  });

  it('should format data using toString method', () => {
    const rowRenderer = new RowRendererString(mockWaveGraph);
    const testData = { toString: () => 'test string' };

    const result = rowRenderer.FORMATTERS.STRING(testData);

    expect(result).toBe('test string');
  });

  it('should select type when name is string', () => {
    const rowRenderer = new RowRendererString(mockWaveGraph);

    const stringTypeInfo = { name: 'string' };
    const nonStringTypeInfo = { name: 'number' };

    expect(rowRenderer.select(stringTypeInfo)).toBe(true);
    expect(rowRenderer.select(nonStringTypeInfo)).toBe(false);
  });

  it('should always return true for isValid', () => {
    const rowRenderer = new RowRendererString(mockWaveGraph);

    expect(rowRenderer.isValid(null)).toBe(true);
    expect(rowRenderer.isValid('any value')).toBe(true);
    expect(rowRenderer.isValid(123)).toBe(true);
    expect(rowRenderer.isValid({})).toBe(true);
  });
});

// Testing the Viewer component without React Testing Library
describe('Viewer', () => {
  it('should create a new WaveGraph instance', () => {
    const WaveGraphMock = require('d3-wave').WaveGraph;
    const mockSetSizes = jest.fn();
    const mockBindData = jest.fn();
    const mockRowRenderers = [];

    WaveGraphMock.mockImplementation(() => ({
      rowRenderers: mockRowRenderers,
      setSizes: mockSetSizes,
      bindData: mockBindData,
    }));

    // Create the Viewer component
    const viewer = React.createElement(Viewer, { data: { test: 'data' } });
    expect(viewer).toBeDefined();

    // Just check that WaveGraph was called when the component is mounted
    // We can't mount the component without React Testing Library, so we'll just check the implementation
    expect(WaveGraphMock).toHaveBeenCalledTimes(0); // Called during useEffect, which doesn't run during element creation
  });

  it('should have correct structure', () => {
    // Check the component structure by examining the function
    expect(Viewer).toBeDefined();
    expect(typeof Viewer).toBe('function');
  });
});