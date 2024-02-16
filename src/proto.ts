export interface LoadPackagesMessage {
  type: 'loadPackages',
  pkgs: string[]
}

export interface RunPythonMessage {
  type: 'runPython';
  code: string;
}

export type HostToWorkerMessage =
| LoadPackagesMessage
| RunPythonMessage;

export interface StdoutWriteMessage {
  type: 'stdoutWrite',
  text: string
}

export interface StderrWriteMessage {
  type: 'stderrWrite',
  text: string
}

export interface ShowRtlilMessage {
  type: 'showRtlil',
  code: string
}

export interface ShowVerilogMessage {
  type: 'showVerilog',
  code: string
}

export interface ShowWaveformsMessage {
  type: 'showWaveforms',
  data: object
}

export interface PythonDoneMessage {
  type: 'pythonDone';
  error: string | null;
}

export type WorkerToHostMessage =
| StdoutWriteMessage
| StderrWriteMessage
| ShowRtlilMessage
| ShowVerilogMessage
| ShowWaveformsMessage
| PythonDoneMessage;
