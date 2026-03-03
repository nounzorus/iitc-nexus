import { defineConfig } from 'vite';
import { resolve } from 'path';
import preact from '@preact/preset-vite';

const HEADER = `// ==UserScript==
// @id             iitc-nexus
// @name           IITC Plugin: Nexus
// @category       UI
// @version        0.1.0
// @author         nounzor
// @namespace      https://github.com/nounzorus/iitc-nexus
// @description    Full-viewport sci-fi dashboard overlay for IITC
// @match          https://intel.ingress.com/*
// @license        GPL-3.0-only
// @grant          none
// @downloadURL    none
// @updateURL      none
// ==/UserScript==
`;

// Post-build plugin: wraps the IIFE output in the IITC plugin wrapper
function iitcWrapperPlugin() {
  return {
    name: 'iitc-wrapper',
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.fileName.endsWith('.user.js')) {
          const iifeCode = file.code;

          file.code = HEADER + `
function wrapper(plugin_info) {
if (typeof window.plugin !== 'function') window.plugin = function () {};

window.plugin.nexus = {};

// __CSS_MODULE_PLACEHOLDER__

// --- BEGIN PLUGIN CODE ---
${iifeCode}
// --- END PLUGIN CODE ---

// setup() is exported by the IIFE as iitcNexus.setup
var setup = typeof iitcNexus !== 'undefined' && iitcNexus.setup
  ? iitcNexus.setup
  : (typeof iitcNexus === 'function' ? iitcNexus : function(){});

setup.info = plugin_info;
if (window.iitcLoaded) {
  setup();
} else {
  if (!window.bootPlugins) window.bootPlugins = [];
  window.bootPlugins.push(setup);
}
} // end wrapper

// IITC-CE button loads plugins directly in page context — detect and handle
if (typeof window.iitcLoaded !== 'undefined' || typeof window.bootPlugins !== 'undefined') {
  // Running inside IITC context already (IITC-CE button)
  wrapper({});
} else {
  // Running as userscript (Tampermonkey/Greasemonkey) — inject into page
  var script = document.createElement('script');
  var info = {};
  try {
    if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
      info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
    }
  } catch(e) {}
  script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
  (document.body || document.head || document.documentElement).appendChild(script);
}
`;
        }
      }
    },
  };
}

// Post-build: inline extracted CSS into userscript files, remove standalone .css
function inlineCSSPlugin() {
  return {
    name: 'inline-css',
    enforce: 'post',
    async writeBundle(options, bundle) {
      const fs = await import('fs');
      const path = await import('path');
      const outDir = options.dir || 'dist';
      const cssPath = path.resolve(outDir, 'iitc-nexus.css');

      let moduleCSS = '';
      try {
        moduleCSS = fs.readFileSync(cssPath, 'utf-8');
        fs.unlinkSync(cssPath);
      } catch(e) { return; }

      if (!moduleCSS.trim()) return;

      const injection = `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(moduleCSS)};document.head.appendChild(s);})();`;

      for (const name of Object.keys(bundle)) {
        if (name.endsWith('.user.js') || name.endsWith('.dev.user.js')) {
          const filePath = path.resolve(outDir, name);
          let code = fs.readFileSync(filePath, 'utf-8');
          code = code.replace('// __CSS_MODULE_PLACEHOLDER__', injection);
          fs.writeFileSync(filePath, code);
        }
      }
    },
  };
}

// Build size budget: output must be ≤ 85KB (87040 bytes) including userscript header
// Current baseline pre-Phase-10: ~100.47KB. Run `wc -c dist/iitc-nexus.user.js` to verify.
export default defineConfig({
  css: {
    modules: {
      generateScopedName: '[name]__[local]__[hash:base64:5]',
      hashPrefix: 'iitc-dashboard',
    },
  },
  esbuild: {
    minifyIdentifiers: true,
    minifyWhitespace: true,
    minifySyntax: true,
    legalComments: 'none',
    drop: ['console'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      formats: ['iife'],
      name: 'iitcNexus',
      fileName: () => 'iitc-nexus.user.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [preact(), iitcWrapperPlugin(), inlineCSSPlugin(), {
    name: 'duplicate-unminified',
    async generateBundle(_, bundle) {
      // Re-build unminified version
      const { build } = await import('vite');
      const result = await build({
        configFile: false,
        css: {
          modules: {
            generateScopedName: '[name]__[local]__[hash:base64:5]',
            hashPrefix: 'iitc-dashboard',
          },
        },
        build: {
          lib: {
            entry: resolve(__dirname, 'src/main.js'),
            formats: ['iife'],
            name: 'iitcNexus',
            fileName: () => 'iitc-nexus.user.js',
          },
          rollupOptions: { output: { inlineDynamicImports: true } },
          cssCodeSplit: false,
          minify: false,
          write: false,
        },
        plugins: [preact(), iitcWrapperPlugin()],
      });
      const chunk = result[0].output.find(o => o.fileName.endsWith('.user.js'));
      if (chunk) {
        this.emitFile({ type: 'asset', fileName: 'iitc-nexus.dev.user.js', source: chunk.code });
      }
    }
  }],
});
