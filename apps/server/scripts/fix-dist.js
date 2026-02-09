const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../dist/apps/server/src');
const targetDir = path.join(__dirname, '../dist');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(sourceDir)) {
  // Copy all files from dist/apps/server/src to dist
  copyRecursiveSync(sourceDir, targetDir);
  console.log('Fixed dist structure: copied all files to correct location');
} else {
  console.log('Source directory not found, skipping fix');
}
