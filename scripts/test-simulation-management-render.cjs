/* eslint-disable @typescript-eslint/no-require-imports -- Node render regression test. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const page = path.join(root, 'src/app/admin/simulations/page.tsx');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'simulation-management-render-'));
const fixture = global.simulationManagementFixture = { role: 'admin', simulations: [] };

async function main() {
  const mocks = {
    'next-auth/react': `export const useSession=()=>({data:{user:{email:'fixture@example.invalid',role:global.simulationManagementFixture.role}},status:'authenticated'});`,
    'next/navigation': `export const useRouter=()=>({push:()=>{}});`,
    'page-react': `import * as React from 'react';export * from 'react';export const useState=initial=>React.useState(Array.isArray(initial)?global.simulationManagementFixture.simulations:typeof initial==='boolean'?false:initial);`,
  };
  await require(root + '/node_modules/esbuild').build({
    stdin: {
      contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Page from './src/app/admin/simulations/page';export const render=()=>renderToStaticMarkup(<Page/>);`,
      loader: 'tsx', resolveDir: root,
    },
    outfile: out + '/render.cjs', bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
    plugins: [{ name: 'authenticated-fixture', setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        const key = args.path === 'react' && args.importer === page ? 'page-react' : args.path;
        return mocks[key] ? { path: key, namespace: 'fixture' } : undefined;
      });
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path], loader: 'js', resolveDir: root }));
    } }],
  });
  const { render } = require(out + '/render.cjs');
  for (const role of ['admin', 'teacher']) {
    fixture.role = role;
    for (const populated of [false, true]) {
      fixture.simulations = populated ? [{id:'fixture',title:'Route investigation',description:'Compare distance and displacement.',slug:'distance-displacement',difficulty:'beginner',unit:'unit-1',topic:'Motion',sortOrder:1,published:true,totalPlays:2}] : [];
      const html = render();
      assert.match(html, /Physics Simulations Management/);
      assert.match(html, /href="\/admin\/simulations\/activities"[^>]*>Guided activities &amp; class access<\/a>/);
      assert.match(html, /href="\/admin\/simulations\/analytics"/);
      assert.match(html, /View Analytics/);
      assert.match(html, populated ? /Route investigation/ : /No simulations available/);
      console.log('PASS ' + role + ' ' + (populated ? 'populated' : 'empty') + ' management page renders with both navigation links');
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
