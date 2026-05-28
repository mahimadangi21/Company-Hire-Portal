const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.match(/\.(tsx|ts|jsx|js)$/)) results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/achyu/Desktop/KL_HIRE_Unified/src');
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   let changed = false;

   if (content.match(/['"](?:\.\.\/)+context\/AppContext['"]/)) {
       content = content.replace(/['"](?:\.\.\/)+context\/AppContext['"]/g, "'@/components/admin/context/AppContext'");
       changed = true;
   }

   if (changed) {
       fs.writeFileSync(file, content, 'utf8');
   }
}
console.log("Fixed context imports.");
