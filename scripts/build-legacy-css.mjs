import fs from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';

function simplifySelector(selector) {
  let current = selector;
  const re = /:(where|is)\(([^()]+)\)/g;
  for (let i = 0; i < 20; i += 1) {
    const next = current.replace(re, '$2');
    if (next === current) return current;
    current = next;
  }
  return current;
}

async function main() {
  const outDir = path.join(process.cwd(), 'out');
  const cssDir = path.join(outDir, '_next', 'static', 'chunks');

  let entries;
  try {
    entries = await fs.readdir(cssDir, { withFileTypes: true });
  } catch {
    return;
  }

  const cssFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.css'))
    .map((e) => path.join(cssDir, e.name))
    .sort((a, b) => a.localeCompare(b));

  if (cssFiles.length === 0) return;

  const processed = [];

  for (const file of cssFiles) {
    const css = await fs.readFile(file, 'utf8');
    const root = postcss.parse(css, { from: file });

    root.walkAtRules('layer', (atRule) => {
      if (atRule.nodes && atRule.nodes.length > 0) {
        atRule.replaceWith(...atRule.nodes);
      } else {
        atRule.remove();
      }
    });

    root.walkAtRules('property', (atRule) => {
      atRule.remove();
    });

    root.walkRules((rule) => {
      if (typeof rule.selector === 'string') {
        rule.selector = simplifySelector(rule.selector);
      }
    });

    processed.push(root.toString());
  }

  const legacyCss = processed.join('\n');
  const legacyPath = path.join(outDir, '_next', 'static', 'legacy.css');
  await fs.writeFile(legacyPath, legacyCss, 'utf8');
}

await main();

