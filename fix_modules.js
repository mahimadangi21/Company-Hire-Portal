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

const files = walk('c:/Users/achyu/Desktop/KL_HIRE_Unified/src/app/admin');
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   let changed = false;

   // Fix the syntax error I introduced
   if (content.includes('"use client";`n`n')) {
       content = content.replace(/"use client";`n`n/g, '"use client";\n\n');
       changed = true;
   }

   // Fix imports with explicit .jsx
   if (content.match(/\.jsx['"]/)) {
       content = content.replace(/\.jsx(['"])/g, '$1');
       changed = true;
   }

   if (changed) {
       fs.writeFileSync(file, content, 'utf8');
   }
}
console.log("Fixed module errors.");
