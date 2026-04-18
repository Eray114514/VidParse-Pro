const fs = require('fs');

async function test() {
  const res = await fetch('https://api.github.com/repos/Eray114514/VidParse-Pro/releases/latest', {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VidParse-Pro-Updater',
    }
  });
  const data = await res.json();
  const latestVersion = data.tag_name.replace(/^v/, '');
  console.log("latestVersion:", latestVersion);
  
  const assets = data.assets || [];
  let exeAsset = assets.find((a) => a.name.endsWith('setup.exe') && a.name.includes('x64'));
  if (!exeAsset) {
    exeAsset = assets.find((a) => a.name.endsWith('.msi') && a.name.includes('x64'));
  }
  if (!exeAsset) {
    exeAsset = assets.find((a) => (a.name.endsWith('.exe') || a.name.endsWith('.zip')) && a.name.includes('x64') && a.name.includes('VidParse'));
  }
  console.log("exeAsset:", exeAsset ? exeAsset.name : 'Not Found');
  
  let sigAsset = assets.find((a) => a.name === (exeAsset?.name + '.sig'));
  console.log("sigAsset:", sigAsset ? sigAsset.name : 'Not Found');
  
  if (!exeAsset || !sigAsset) {
    console.log("404 Not Found");
    return;
  }
  
  console.log("All found successfully!");
}

test();
