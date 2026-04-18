const fs = require('fs');
let code = fs.readFileSync('src/app/api/updater/route.ts', 'utf8');

code = code.replace(
  "return new NextResponse('云端暂未就绪当前版本的更新文件，请稍后再试', { status: 404 });",
  "return NextResponse.json({ error: '云端暂未就绪当前版本的更新文件，请稍后再试' }, { status: 404 });"
);

code = code.replace(
  "return new NextResponse('Failed to fetch latest release', { status: 500 });",
  "return NextResponse.json({ error: 'Failed to fetch latest release' }, { status: 500 });"
);

code = code.replace(
  "return new NextResponse('Failed to fetch signature', { status: 500 });",
  "return NextResponse.json({ error: 'Failed to fetch signature' }, { status: 500 });"
);

code = code.replace(
  "return new NextResponse('Internal Server Error', { status: 500 });",
  "return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });"
);

fs.writeFileSync('src/app/api/updater/route.ts', code);
