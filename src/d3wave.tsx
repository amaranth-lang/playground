import * as React from 'react';
import { useRef, useId, useEffect } from 'react';
import * as d3 from 'd3';
import { WaveGraph } from 'd3-wave';
import { RowRendererBits } from 'd3-wave';
import { AnyWaveGraphValue, WaveGraphSignalTypeInfo} from 'd3-wave';

export const STRING_FORMAT: { [formatName: string]: (d: AnyWaveGraphValue) => string } = {
	"STRING": (d: AnyWaveGraphValue) => d.toString(),
}

/**
 * A renderer for string value row
 */
export class RowRendererString extends RowRendererBits {
	constructor(waveGraph: WaveGraph) {
		super(waveGraph);
		this.FORMATTERS = STRING_FORMAT;
		this.DEFAULT_FORMAT = STRING_FORMAT.STRING;
	}
	select(typeInfo: WaveGraphSignalTypeInfo) {
		return typeInfo.name === 'string';
	}
	render(parent: d3.Selection<SVGGElement, any, any, any>, data: SignalDataValueTuple[], typeInfo: WaveGraphSignalTypeInfo, formatter?: string | ((d: AnyWaveGraphValue) => string)) {
		super.render(parent, data, typeInfo, formatter);
	}
	isValid(d: any) {
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

    const resizeObserver = new ResizeObserver((events) => waveGraphRef.current.setSizes());
    resizeObserver.observe(imageRef.current!);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => waveGraphRef.current?.bindData(props.data), [props.data]);

  return <svg width="100%" height="100%" style={{ display: 'block' }} id={imageId} ref={imageRef}/>;
}
