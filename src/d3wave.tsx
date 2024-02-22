import * as React from 'react';
import { useRef, useId, useEffect } from 'react';
import * as d3 from 'd3';
import { WaveGraph } from 'd3-wave';

export interface ViewerProps {
  data: object;
}

export function Viewer(props: ViewerProps) {
  const imageRef = useRef<SVGSVGElement>(null);
  const imageId = useId();

  useEffect(() => {
    const waveGraph = new WaveGraph(d3.select(`[id="${imageId}"]`));
    waveGraph.bindData(props.data);
    waveGraph.setSizes();

    const resizeObserver = new ResizeObserver((events) => waveGraph.setSizes());
    resizeObserver.observe(imageRef.current!);
    return () => resizeObserver.disconnect();
  }, []);

  return <svg width="100%" height="100%" style={{ display: 'block' }} id={imageId} ref={imageRef}/>;
}
