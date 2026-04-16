const fs = require('fs');
const path = require('path');

function processCssFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processCssFiles(fullPath);
    } else if (fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 替换 :where([title]) -> [title]
      content = content.replace(/:where\(\[title\]\)/g, '[title]');
      
      // 替换 :is(.dark .class) -> .dark .class
      // 注意:is() 里面可能有多个层级，所以匹配 .dark 后面直到 )
      content = content.replace(/:is\(\.dark ([^)]+)\)/g, '.dark $1');
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`[CSS Compat] Processed ${fullPath}`);
    }
  }
}

const cssDir = path.join(__dirname, '../out/_next/static/chunks');
if (fs.existsSync(cssDir)) {
  processCssFiles(cssDir);
  console.log('[CSS Compat] Successfully removed :is() and :where() for Android 8 compatibility.');
} else {
  console.log('[CSS Compat] No CSS directory found at', cssDir);
}