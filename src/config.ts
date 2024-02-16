export default {
  amaranthVersions: ['v0.4.2'],
  pythonPackages: {
    'v0.4.2': [
      'https://files.pythonhosted.org/packages/98/8d/a0d8fb2b9611f3ae22ddc98890b346833fa2c645ad21fd282e61ccdad477/pyvcd-0.4.0-py2.py3-none-any.whl',
      'https://files.pythonhosted.org/packages/27/1c/39881fbd48f9de91d64955f206a7f32fd912d306d18e8c5f74126ee5962f/amaranth-0.4.2-py3-none-any.whl',
    ],
  },
  demoCode: `\
from amaranth import *
from amaranth.sim import Simulator, Tick
from amaranth.back import rtlil, verilog
import amaranth_playground


en = Signal()
count = Signal(4)
m = Module()
with m.If(en):
    m.d.sync += count.eq(count + 1)
m.d.comb += en.eq(count < 5)


def testbench():
    for _ in range(10):
        yield Tick("sync")
        print(f"count: {yield count}")

sim = Simulator(m)
sim.add_clock(1e-6)
sim.add_process(testbench)
with amaranth_playground.show_waveforms(sim):
    sim.run()

amaranth_playground.show_verilog(verilog.convert(m, ports=[count]))
# amaranth_playground.show_rtlil(rtlil.convert(m, ports=[count]))
`,
};
