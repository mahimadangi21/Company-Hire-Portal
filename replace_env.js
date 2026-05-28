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

   if (content.includes('import.meta.env.VITE_API_BASE_URL')) {
       content = content.replace(/import\.meta\.env\.VITE_API_BASE_URL\s*\+\s*/g, "'' + ");
       content = content.replace(/import\.meta\.env\.VITE_API_BASE_URL/g, "''");
       changed = true;
   }
   if (content.includes('import.meta.env.VITE_PARSER_URL')) {
       content = content.replace(/import\.meta\.env\.VITE_PARSER_URL\s*\+\s*/g, "'' + ");
       content = content.replace(/import\.meta\.env\.VITE_PARSER_URL/g, "''");
       changed = true;
   }
   if (content.includes('import.meta.env.VITE_ADMIN_EMAIL')) {
       content = content.replace(/import\.meta\.env\.VITE_ADMIN_EMAIL/g, "process.env.NEXT_PUBLIC_DASHBOARD_EMAIL");
       changed = true;
   }
   if (content.includes('import.meta.env.VITE_ADMIN_PASSWORD')) {
       content = content.replace(/import\.meta\.env\.VITE_ADMIN_PASSWORD/g, "process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD");
       changed = true;
   }

   if (changed) {
       fs.writeFileSync(file, content, 'utf8');
   }
}
console.log("Replaced ENV vars.");
