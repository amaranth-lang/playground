const rfc3986_2_0_0 = 'https://files.pythonhosted.org/packages/ff/9a/9afaade874b2fa6c752c36f1548f718b5b83af81ed9b76628329dab81c1b/rfc3986-2.0.0-py2.py3-none-any.whl';
const jschon_0_11_1 = 'https://files.pythonhosted.org/packages/ce/b1/31f454a2ac0d23b0a47283d115f0af4abe2a1ea391f5ccb223e02d685b82/jschon-0.11.1-py3-none-any.whl';
const pyvcd_0_4_0 = 'https://files.pythonhosted.org/packages/98/8d/a0d8fb2b9611f3ae22ddc98890b346833fa2c645ad21fd282e61ccdad477/pyvcd-0.4.0-py2.py3-none-any.whl';
const amaranth_0_4_2 = 'https://files.pythonhosted.org/packages/27/1c/39881fbd48f9de91d64955f206a7f32fd912d306d18e8c5f74126ee5962f/amaranth-0.4.2-py3-none-any.whl';
const amaranth_0_4_3 = 'https://files.pythonhosted.org/packages/72/34/82f76a59f4155e26f42cf9f9d04d80befe774aa8af6d9b6e48d3e7b9f060/amaranth-0.4.3-py3-none-any.whl';
const amaranth_0_4_4 = 'https://files.pythonhosted.org/packages/ee/66/bbb766873059d8051ddb7e760de80beefd286979bc9a786e7ec4ac524336/amaranth-0.4.4-py3-none-any.whl';
const amaranth_0_4_5 = 'https://files.pythonhosted.org/packages/1a/bf/cff5c705f2f5978889e1fa0fc2a70e0fadbb9f2a51db2d3315c3bda7c3ea/amaranth-0.4.5-py3-none-any.whl';
const amaranth_0_5_0 = 'https://files.pythonhosted.org/packages/d3/34/8a21cc1765f1952eb35766cf76ec8a1b3e73f32ae78d9bf1c1a88313bdcd/amaranth-0.5.0-py3-none-any.whl';
const amaranth_0_5_1 = 'https://files.pythonhosted.org/packages/46/1c/74dc024e77038a273160dd1d70a79371142ba9ebeac4b2fb89c272ce6859/amaranth-0.5.1-py3-none-any.whl';
const amaranth_0_5_2 = 'https://files.pythonhosted.org/packages/e1/60/f787f05fe9684ce80aeb9fe23238248461ef42783e53712092ad55a97eec/amaranth-0.5.2-py3-none-any.whl';
const amaranth_0_5_3 = 'https://files.pythonhosted.org/packages/3a/8d/889014b45ecf68727d8c8c1d88d5b858f0b43a42c5b1e51fa2c875ffd4d5/amaranth-0.5.3-py3-none-any.whl';
const pythonPackages = {
  'v0.5.3': [rfc3986_2_0_0, jschon_0_11_1, pyvcd_0_4_0, amaranth_0_5_3],
  'v0.5.2': [rfc3986_2_0_0, jschon_0_11_1, pyvcd_0_4_0, amaranth_0_5_2],
  'v0.5.1': [rfc3986_2_0_0, jschon_0_11_1, pyvcd_0_4_0, amaranth_0_5_1],
  'v0.5.0': [rfc3986_2_0_0, jschon_0_11_1, pyvcd_0_4_0, amaranth_0_5_0],
  'v0.4.5': [pyvcd_0_4_0, amaranth_0_4_5],
  'v0.4.4': [pyvcd_0_4_0, amaranth_0_4_4],
  'v0.4.3': [pyvcd_0_4_0, amaranth_0_4_3],
  'v0.4.2': [pyvcd_0_4_0, amaranth_0_4_2],
};

const demoCode_0_4 = `\
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
`;
const demoCode_0_5 = `\
from amaranth import *
from amaranth.sim import Simulator
from amaranth.back import rtlil, verilog
import amaranth_playground


en = Signal()
count = Signal(4)
m = Module()
with m.If(en):
    m.d.sync += count.eq(count + 1)
m.d.comb += en.eq(count < 5)


async def testbench(ctx):
    for _ in range(10):
        await ctx.tick()
        print(f"count: {ctx.get(count)}")

sim = Simulator(m)
sim.add_clock(1e-6)
sim.add_testbench(testbench)
with amaranth_playground.show_waveforms(sim):
    sim.run()

amaranth_playground.show_verilog(verilog.convert(m, ports=[count]))
# amaranth_playground.show_rtlil(rtlil.convert(m, ports=[count]))
`;
const demoCode = {
  'v0.5.3': demoCode_0_5,
  'v0.5.2': demoCode_0_5,
  'v0.5.1': demoCode_0_5,
  'v0.5.0': demoCode_0_5,
  'v0.4.5': demoCode_0_4,
  'v0.4.4': demoCode_0_4,
  'v0.4.3': demoCode_0_4,
  'v0.4.2': demoCode_0_4,
};

export default {
  amaranthVersions: Array.from(Object.keys(pythonPackages)),
  pythonPackages,
  demoCode,
};
