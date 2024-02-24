import { createRoot } from 'react-dom/client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';

import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import '@fontsource/inter/latin-400';

import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Link from '@mui/joy/Link';
import Snackbar from '@mui/joy/Snackbar';
import Alert from '@mui/joy/Alert';
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'

import * as monaco from 'monaco-editor';
import { EditorState, Editor } from './monaco';
import { Viewer as WaveformViewer } from './d3wave';
import { PythonError, runner } from './runner';
import data from './config';

import './app.css';

function stealHashQuery() {
  const { hash } = window.location;
  if (hash !== '') {
    history.replaceState(null, '', ' '); // remove #... from URL entirely
    const hashQuery = hash.substring(1);
    try {
      return JSON.parse(atob(hashQuery));
    } catch {
      try {
        // Legacy encoding, used 2024-02-16 to 2024-02-24.
        return JSON.parse(decodeURIComponent(hashQuery.replace('+', '%20')));
      } catch {}
    }
  }
}

interface TerminalChunk {
  stream: 'stdout' | 'stderr';
  text: string;
}

function TerminalOutput(key: string, output: TerminalChunk[]) {
  return output.map((chunk, index) =>
    <span key={`${key}-${index}`} className={`terminal-${chunk.stream}`}>{chunk.text}</span>);
}

function AppContent() {
  const {mode, setMode} = useColorScheme();
  useEffect(() => monaco.editor.setTheme(mode === 'light' ? 'vs' : 'vs-dark'), [mode]);

  const query: { av?: string, s?: string } | undefined = stealHashQuery();
  const [amaranthVersion, setAmaranthVersion] = useState(
    query?.av
    ?? localStorage.getItem('amaranth-playground.amaranthVersion')
    ?? data.amaranthVersions[0]);
  useEffect(() => localStorage.setItem('amaranth-playground.amaranthVersion', amaranthVersion), [amaranthVersion]);
  const [running, setRunning] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(localStorage.getItem('amaranth-playground.tutorialDone') !== null);
  useEffect(() => tutorialDone ? localStorage.setItem('amaranth-playground.tutorialDone', '') : void 0, [tutorialDone]);
  const [activeTab, setActiveTab] = useState(tutorialDone ? 'amaranth-source' : 'tutorial');
  const [sourceEditorState, setSourceEditorState] = useState(new EditorState(
    query?.s
    ?? localStorage.getItem('amaranth-playground.source')
    ?? data.demoCode));
  useEffect(() => localStorage.setItem('amaranth-playground.source', sourceEditorState.text), [sourceEditorState]);
  const [pythonOutput, setPythonOutput] = useState<TerminalChunk[] | null>(null);
  const [pythonOutputWasNull, setPythonOutputWasNull] = useState(true);
  const [waveforms, setWaveforms] = useState<object | null>(null);
  const [productsOutOfDate, setProductsOutOfDate] = useState(false);
  const [rtlilProduct, setRtlilProduct] = useState<string | null>(null);
  const [verilogProduct, setVerilogProduct] = useState<string | null>(null);

  function loadDemoCode() {
    setSourceEditorState(new EditorState(data.demoCode));
    setActiveTab('amaranth-source');
  }

  function completeTutorial() {
    setTutorialDone(true);
    setActiveTab('amaranth-source');
  }

  async function runCode() {
    if (running)
      return;
    try {
      setRunning(true);
      if (pythonOutput !== null)
        setPythonOutput([]);
      let gotRtlil = false;
      let gotVerilog = false;
      let gotWaveforms = false;
      await runner.runPython(sourceEditorState.text, {
        packages: data.pythonPackages[amaranthVersion],
        onStdout: (text) =>
          setPythonOutput(output => (output ?? []).concat([{stream: 'stdout', text }])),
        onStderr: (text) =>
          setPythonOutput(output => (output ?? []).concat([{stream: 'stderr', text }])),
        onShowRtlil: (code) => { gotRtlil = true; setRtlilProduct(code); },
        onShowVerilog: (code) => { gotVerilog = true; setVerilogProduct(code); },
        onShowWaveforms: (data) => { gotWaveforms = true; setWaveforms(data); }
      });
      if (rtlilProduct && !gotRtlil) {
        setRtlilProduct(null);
        setActiveTab(activeTab === 'rtlil-product' ? 'amaranth-source' : activeTab);
      }
      if (verilogProduct && !gotVerilog) {
        setVerilogProduct(null);
        setActiveTab(activeTab === 'verilog-product' ? 'amaranth-source' : activeTab);
      }
      if (waveforms && !gotWaveforms) {
        setWaveforms(null);
        setActiveTab(activeTab === 'waveforms-product' ? 'amaranth-source' : activeTab);
      }
      setProductsOutOfDate(false);
    } catch (e) {
      if (e instanceof PythonError) {
        setPythonOutput(output => (output ?? []).concat([{stream: 'stderr', text: e.message}]));
        setActiveTab('python-output');
      } else {
        throw e;
      }
    } finally {
      setRunning(false);
    }
  }

  function tabAndPanel({ key, title, titleStyle = {}, content }) {
    return [
      <Tab key={`${key}-tab`} value={key} style={titleStyle}>{title}</Tab>,
      <TabPanel key={`${key}-tabpanel`} value={key} sx={{ padding: 0 }}>{content}</TabPanel>
    ];
  }

  const tabsWithPanels = [
    tabAndPanel({
      key: 'tutorial',
      title: <QuestionMarkIcon/>,
      content: <Box sx={{ padding: 2, maxWidth: '80em' }}>
        <p>
          Hi there!
        </p>
        <p>
          On this page, you can experiment with
          the <Link href="https://amaranth-lang.org/">Amaranth</Link> hardware definition language:
          run a small program, watch its output, see the waveforms a simulation generates, look
          at the RTL the compiler produces, and share it with friends, if you like!
        </p>
        <p>
          To switch between views, use the tab bar right above this text. The tab with
          the "<QuestionMarkIcon fontSize='small'/>" icon shows this tutorial. When you open this
          page, the only other visible tab will be "Amaranth Source", containing a demonstration
          program. Go ahead and open it! Then switch back to the tutorial by clicking {}
          <QuestionMarkIcon fontSize='small'/>.
          (If the demonstration program doesn't appear, or if you edited it and now
          want to go back, you can <Link onClick={loadDemoCode}>reload it</Link>.)
        </p>
        <p>
          The code you enter in the "Amaranth Source" tab is ordinary Python code that runs in
          an environment where the Amaranth Python package and its dependencies are already
          installed. You can write <code>import amaranth</code> and start experimenting without any
          distractions. Once you're done, click the "<PlayArrowIcon fontSize='small'/> Run" button
          in the top left, or press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> while the editor is focused.
          Go ahead and try!
        </p>
        <p>
          You will see several new tabs appear:
        </p>
        <ul>
          <li>
            The "Python Output" tab contains the text from the standard output and standard error
            streams of the Python interpreter. If you run the <code>print()</code> function,
            this tab will contain the output. Any exceptions raised by the Python code will also
            be shown here.
          </li>
          <li>
            The "Waveforms" tab visualizes how the values of signals change during the simulation.
            It appears only if the code includes
            a <code>with amaranth_playground.show_waveforms(sim):</code> statement. When you open
            the tab, the waveform viewer will display an overview of the entire simulation.
            You can scroll the mouse wheel to zoom, and drag the area with the waveforms with
            the left mouse button to move the viewport.
          </li>
          <li>
            The "Generated Verilog" tab shows the output of the Amaranth compiler. It appears
            only if the code includes a <code>amaranth_playground.show_verilog(...)</code> {}
            statement.
          </li>
        </ul>
        <p>
          The contents of these tabs isn't automatically updated: you need to click
          the "<PlayArrowIcon fontSize='small'/> Run" button every time you modify the code to see
          how the changes in it affect the results.
          Try changing something and clicking "<PlayArrowIcon fontSize='small'/> Run" now!
        </p>
        <p>
          The code you write in the "Amaranth Source" tab is automatically saved when you change it,
          so if you leave this page and come back to it later, it should be exactly as you left it.
          However, don't rely on it to save your important code: only one copy of the code is saved,
          so if you open this page in several browser tabs or windows, all but one programs will be
          lost.
        </p>
        <p>
          If you click the "<ShareIcon fontSize='small'/> Share" button in the top right corner of
          this page, a popup with a link will appear right there. This link contains a copy of
          the source code you entered (and the Amaranth version you're using). You can bookmark it,
          or send it to someone else. When you click on the link, the code you're currently editing
          will be erased and replaced with the code contained in the link.
        </p>
        <p>
          The button with the "{mode === 'light'
          ? <DarkModeIcon fontSize='small'/>
          : <LightModeIcon fontSize='small'/>}" icon in the top right corner switches the color
          theme to use a {mode === 'light' ? 'dark' : 'light'} background instead.
          For now, the waveform viewer always uses a dark background.
        </p>
        <p>
          Have fun! You can now <Link onClick={completeTutorial}>mark the tutorial as complete</Link> {}
          and start experimenting, or continue reading if you want to know more details. If you want
          to see your design run on a real development board, try the <Link
            href="https://marketplace.visualstudio.com/items?itemName=yowasp.toolchain"
          >YoWASP Toolchain</Link> extension for Visual Studio Code; it provides an end-to-end FPGA
          toolchain for the popular iCE40 and ECP5 FPGA families entirely in the browser. {}
          {'usb' in navigator ? <></> : <>(Your browser does not support WebUSB, so you will need
          to use a different browser or install a flashing utility separately.)</>}
        </p>
        <p>
          The only functionality available in this playground that isn't a part of the Amaranth
          Python package or its dependencies is the <code>amaranth_playground</code> Python module.
          This built-in module provides three functions that are used to display the results of
          running a program in a separate tab and in the suitable format:
        </p>
        <ul>
          <li>
            <code>with amaranth_playground.show_waveforms(sim):</code> displays waveforms by
            calling <code>with sim.write_vcd(vcd_file=...)</code> internally and then converting
            the VCD data to a format suitable for the interactive viewer.
          </li>
          <li>
            <code>amaranth_playground.show_verilog(verilog.convert(m))</code> displays Verilog
            code. This code is accepted by all FPGA and ASIC toolchains, and can be used to run
            Amaranth on essentially any hardware platform or RTL simulator.
          </li>
          <li>
            <code>amaranth_playground.show_rtlil(rtlil.convert(m))</code> displays <Link
              href="https://yosyshq.readthedocs.io/projects/yosys/en/latest/CHAPTER_Overview.html#the-rtl-intermediate-language-rtlil"
            >RTLIL code</Link>, the <Link href="https://yosyshq.net">Yosys</Link> intermediate
            representation. This code is accepted by the open-source FPGA toolchain, and is used
            internally by the Amaranth compiler to produce Verilog code. Unless you are investigating
            a problem with the Amaranth compiler itself, the only reason to look at it is curiosity.
            (Which is a very good reason; try uncommenting the line with <code>show_rtlil</code> {}
            in the demonstration program and comparing the Verilog and RTLIL code side-by-side!)
          </li>
        </ul>
        <p>
          The demonstration program includes examples of using all three functions. (Remember,
          you can always <Link onClick={loadDemoCode}>reload it</Link> if you changed the source.)
        </p>
        <p>
          — <Link href="https://github.com/whitequark">Catherine "whitequark"</Link>
        </p>
        <p>
          P.S.: Everything you see on this page works within your browser, and the code you enter is
          never sent over the network. Yes, I run Python, Amaranth, and Yosys in the browser using {}
          <Link href="https://webassembly.org/">WebAssembly</Link>. How cool is that?
        </p>
        <p>
          The source code of the playground itself is {}
          <Link href="https://github.com/amaranth-lang/playground">available on GitHub</Link>.
        </p>
      </Box>
    }),
    tabAndPanel({
      key: 'amaranth-source',
      title: 'Amaranth Source',
      content: <Editor
        padding={{ top: 10, bottom: 10 }}
        language='python'
        state={sourceEditorState}
        setState={setSourceEditorState}
        focus
        actions={[
          {
            id: 'amaranth-playground.run',
            label: 'Run Code',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            ],
            run: runCode,
          }
        ]}
      />
    })
  ];

  const prevSourceCode = useRef(sourceEditorState.text);
  useEffect(() => {
    if (sourceEditorState.text != prevSourceCode.current)
      setProductsOutOfDate(true);
    prevSourceCode.current = sourceEditorState.text;
  }, [sourceEditorState]);

  if (pythonOutput !== null)
    tabsWithPanels.push(tabAndPanel({
      key: 'python-output',
      title: 'Python Output',
      content:
        <Box
          className='terminal-output'
          sx={{ paddingX: 2, paddingY: 1 }}
        >{TerminalOutput('python-output', pythonOutput)}</Box>
    }));

  useEffect(() => {
    // Open tab if we're running code for the first time, since it may not be clear that anything
    // has happened otherwise.
    if (pythonOutput !== null && pythonOutputWasNull)
      setActiveTab('python-output');
    setPythonOutputWasNull(pythonOutput === null);
  }, [pythonOutput]);

  if (waveforms !== null)
    tabsWithPanels.push(tabAndPanel({
      key: 'waveforms',
      title: 'Waveforms',
      titleStyle: productsOutOfDate ? { textDecoration: 'line-through' } : {},
      content:
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {productsOutOfDate && <Alert variant='soft' color='warning' sx={{ borderRadius: 0 }}>
            The waveforms are out of date. Run the program again to refresh them.
          </Alert>}
          <Box sx={{ flexGrow: 1 }}>
            <WaveformViewer data={waveforms}/>
          </Box>
        </Box>
    }));

  if (rtlilProduct !== null)
    tabsWithPanels.push(tabAndPanel({
      key: 'rtlil-product',
      title: 'Generated RTLIL',
      titleStyle: productsOutOfDate ? { textDecoration: 'line-through' } : {},
      content:
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {productsOutOfDate && <Alert variant='soft' color='warning' sx={{ borderRadius: 0 }}>
            The generated RTLIL is out of date. Run the program again to refresh it.
          </Alert>}
          <Box sx={{ flexGrow: 1 }}>
            <Editor
              padding={{ top: 10, bottom: 10 }}
              language='rtlil'
              state={new EditorState(rtlilProduct)}
              focus
            />
          </Box>
        </Box>
    }));

  if (verilogProduct !== null)
    tabsWithPanels.push(tabAndPanel({
      key: 'verilog-product',
      title: 'Generated Verilog',
      titleStyle: productsOutOfDate ? { textDecoration: 'line-through' } : {},
      content:
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {productsOutOfDate && <Alert variant='soft' color='warning' sx={{ borderRadius: 0 }}>
            The generated Verilog is out of date. Run the program again to refresh it.
          </Alert>}
          <Box sx={{ flexGrow: 1 }}>
            <Editor
              padding={{ top: 10, bottom: 10 }}
              language='verilog'
              state={new EditorState(verilogProduct)}
              focus
            />
          </Box>
        </Box>
    }));

  // FIXME: populating `tabsWithPanels` this way leads to bugs

  return <>
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      padding: 2,
      gap: 2
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2
      }}>

        <Button
          size='lg'
          sx={{ borderRadius: 10 }}
          variant='outlined'
          startDecorator={<PlayArrowIcon/>}
          loading={running}
          onClick={() => runCode()}
        >
          Run
        </Button>

        <Select
          size='lg'
          sx={{ borderRadius: 10 }}
          variant='outlined'
          value={amaranthVersion}
          onChange={(_event, value) => setAmaranthVersion(value as string)}
        >
          {data.amaranthVersions.map((version) =>
            <Option key={version} value={version}>Amaranth {version}</Option>)}
        </Select>

        <Link
          href={`https://amaranth-lang.org/docs/amaranth/${amaranthVersion}/`}
          target='_blank'
        >
          Open documentation
        </Link>

        {/* spacer */} <Box sx={{ flexGrow: 1 }}/>

        <Button
          size='lg'
          sx={{ borderRadius: 10 }}
          color='neutral'
          variant='outlined'
          endDecorator={<ShareIcon/>}
          onClick={() => setSharingOpen(true)}
        >
          Share
        </Button>

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={sharingOpen}
          onClose={(_event, _reason) => setSharingOpen(false)}
        >
          <Link href={
            // base64 overhead is fixed at 33%, urlencode overhead is variable, typ. 133% (!)
            new URL('#' + btoa(JSON.stringify({
              av: amaranthVersion, s: sourceEditorState.text
            })), window.location.href).toString()
          }>
            Copy this link to share the source code
          </Link>
        </Snackbar>

        <IconButton
          size='lg'
          sx={{ borderRadius: 10 }}
          variant='outlined'
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        >
          {mode === 'light' ? <DarkModeIcon/> : <LightModeIcon/>}
        </IconButton>

      </Box>
      <Tabs
        sx={{ height: '100%' }}
        value={activeTab}
        onChange={(_event, value) => setActiveTab(value as string)}
      >
        <TabList>{tabsWithPanels.map(([tab, _panel]) => tab)}</TabList>
        {tabsWithPanels.map(([_tab, panel]) => panel)}
      </Tabs>
    </Box>
  </>;
}

createRoot(document.getElementById('root')!).render(
  <CssVarsProvider>
    <CssBaseline/>
    <AppContent/>
  </CssVarsProvider>
);

console.log('Build ID:', globalThis.GIT_COMMIT);

// https://esbuild.github.io/api/#live-reload
if (!globalThis.IS_PRODUCTION)
  new EventSource('/esbuild').addEventListener('change', () => location.reload());
