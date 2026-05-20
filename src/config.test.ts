import config from './config';

describe('config', () => {
  describe('amaranthVersions', () => {
    it('should be an array of version strings', () => {
      expect(Array.isArray(config.amaranthVersions)).toBe(true);
      expect(config.amaranthVersions.length).toBeGreaterThan(0);
      
      config.amaranthVersions.forEach(version => {
        expect(typeof version).toBe('string');
        expect(version).toMatch(/^v\d+\.\d+\.\d+$/); // Should match version format like v0.5.8
      });
    });

    it('should contain expected versions', () => {
      const expectedVersions = [
        'v0.5.8', 'v0.5.7', 'v0.5.6', 'v0.5.5', 'v0.5.4', 'v0.5.3', 
        'v0.5.2', 'v0.5.1', 'v0.5.0', 'v0.4.5', 'v0.4.4', 'v0.4.3', 'v0.4.2'
      ];
      
      expect(config.amaranthVersions).toEqual(expectedVersions);
    });
  });

  describe('pythonPackages', () => {
    it('should be an object with version keys', () => {
      expect(typeof config.pythonPackages).toBe('object');
      expect(Object.keys(config.pythonPackages)).toEqual(config.amaranthVersions);
    });

    it('should have arrays as values with package URLs', () => {
      Object.entries(config.pythonPackages).forEach(([version, packages]) => {
        expect(Array.isArray(packages)).toBe(true);
        expect(packages.length).toBeGreaterThan(0);
        
        packages.forEach(pkg => {
          expect(typeof pkg).toBe('string');
          expect(pkg).toMatch(/^https:\/\//); // Should be a URL
          expect(pkg).toContain('.whl'); // Should be a wheel package
        });
      });
    });

    it('should have expected package counts for versions', () => {
      // v0.5.x versions should have 4 packages each
      const v05Versions = config.amaranthVersions.filter(v => v.startsWith('v0.5'));
      const v04Versions = config.amaranthVersions.filter(v => v.startsWith('v0.4'));

      for (const version of v05Versions) {
        expect(config.pythonPackages[version as keyof typeof config.pythonPackages]).toHaveLength(4);
      }

      for (const version of v04Versions) {
        expect(config.pythonPackages[version as keyof typeof config.pythonPackages]).toHaveLength(2);
      }
    });
  });

  describe('demoCode', () => {
    it('should be an object with version keys', () => {
      expect(typeof config.demoCode).toBe('object');
      expect(Object.keys(config.demoCode)).toEqual(config.amaranthVersions);
    });

    it('should have strings as values representing Python code', () => {
      Object.values(config.demoCode).forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
        expect(code).toContain('from amaranth'); // Should contain amaranth imports
      });
    });

    it('should have different code for v0.4.x vs v0.5.x', () => {
      const v04Code = config.demoCode['v0.4.2'];
      const v05Code = config.demoCode['v0.5.0'];
      
      // v0.4.x should use the old sim API with testbench() function
      expect(v04Code).toContain('def testbench():');
      expect(v04Code).toContain('yield Tick(');
      expect(v04Code).toContain('yield count');
      
      // v0.5.x should use the new async API with testbench(ctx) parameter
      expect(v05Code).toContain('async def testbench(ctx):');
      expect(v05Code).toContain('await ctx.tick()');
      expect(v05Code).toContain('ctx.get(count)');
      
      // They should be different
      expect(v04Code).not.toBe(v05Code);
    });

    it('should map versions to appropriate code samples', () => {
      // All v0.5.x versions should have the same code
      const v05Code = config.demoCode['v0.5.0'];
      for (const version of config.amaranthVersions.filter(v => v.startsWith('v0.5'))) {
        expect(config.demoCode[version as keyof typeof config.demoCode]).toBe(v05Code);
      }

      // All v0.4.x versions should have the same code
      const v04Code = config.demoCode['v0.4.2'];
      for (const version of config.amaranthVersions.filter(v => v.startsWith('v0.4'))) {
        expect(config.demoCode[version as keyof typeof config.demoCode]).toBe(v04Code);
      }
    });
  });

  describe('consistency between data structures', () => {
    it('should have consistent version keys across all data structures', () => {
      const packageVersions = Object.keys(config.pythonPackages);
      const demoVersions = Object.keys(config.demoCode);
      const amaranthVersions = config.amaranthVersions;
      
      expect(packageVersions).toEqual(demoVersions);
      expect(packageVersions).toEqual(amaranthVersions);
      expect(demoVersions).toEqual(amaranthVersions);
    });
  });
});