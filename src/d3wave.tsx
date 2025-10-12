import * as React from 'react';
import { useRef, useId, useEffect } from 'react';
import * as d3 from 'd3';
import { WaveGraph } from 'd3-wave';
import { RowRendererBits } from 'd3-wave';

export class RowRendererString extends RowRendererBits {
  FORMATTERS: { STRING: any };
  DEFAULT_FORMAT: any;

  constructor(waveGraph: WaveGraph) {
    super(waveGraph);
    this.FORMATTERS = {
      "STRING": (data: { toString(): string }) =>
        data.toString()
    };
    this.DEFAULT_FORMAT = this.FORMATTERS.STRING;
  }

  select(typeInfo: { name: string }) {
    return typeInfo.name === 'string';
  }

  isValid(data: any) {
    return true;
  }
}

export interface ViewerProps {
  data: object;
}

export function Viewer(props: ViewerProps) {
  const waveGraphRef = useRef<WaveGraph | null>(null);
  const imageRef = useRef<SVGSVGElement>(null);
  const imageId = useId();

  useEffect(() => {
    if (waveGraphRef.current === null) {
      waveGraphRef.current = new WaveGraph(d3.select(`[id="${imageId}"]`));
      waveGraphRef.current.rowRenderers.push(new RowRendererString(waveGraphRef.current));
    }
    waveGraphRef.current.setSizes();

    const resizeObserver = new ResizeObserver((events) => waveGraphRef.current?.setSizes());
    resizeObserver.observe(imageRef.current!);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => waveGraphRef.current?.bindData(props.data), [props.data]);

  return <svg width="100%" height="100%" style={{ display: 'block' }} id={imageId} ref={imageRef} />;
}
