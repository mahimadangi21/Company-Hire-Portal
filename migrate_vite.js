const fs = require('fs');
const path = require('path');

const VITE_SRC = 'c:/Users/achyu/Desktop/VideoScreenBot/KL_HIRE_Dashboard/app/src';
const NEXT_COMPONENTS = 'c:/Users/achyu/Desktop/KL_HIRE_Unified/src/components/admin';
const NEXT_PAGES = 'c:/Users/achyu/Desktop/KL_HIRE_Unified/src/app/admin';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function processFile(content) {
  let newContent = '"use client";\n\n' + content;
  
  // Replace imports
  newContent = newContent.replace(/from\s+['"]react-router-dom['"]/g, "from 'next/navigation'");
  newContent = newContent.replace(/useNavigate\(\)/g, "useRouter()");
  newContent = newContent.replace(/<Link\s+to=/g, "<Link href=");
  newContent = newContent.replace(/<NavLink\s+to=/g, "<Link href=");
  newContent = newContent.replace(/<\/NavLink>/g, "</Link>");
  
  // Fix Link imports
  if (newContent.includes('Link')) {
      newContent = newContent.replace(/import\s+{([^}]*)}\s+from\s+'next\/navigation';/, (match, p1) => {
          if (p1.includes('Link') || p1.includes('NavLink')) {
             return "import Link from 'next/link';\nimport { " + p1.replace(/,\s*Link|Link\s*,?|,\s*NavLink|NavLink\s*,?/g, '') + " } from 'next/navigation';";
          }
          return match;
      });
  }

  // Fix internal paths (e.g. '../components/X' -> '@/components/admin/X')
  newContent = newContent.replace(/\.\.\/components\//g, "@/components/admin/");
  newContent = newContent.replace(/\.\.\/context\//g, "@/components/admin/context/");
  newContent = newContent.replace(/\.\/context\//g, "@/components/admin/context/");

  return newContent;
}

ensureDir(NEXT_COMPONENTS);
ensureDir(NEXT_PAGES);
ensureDir(path.join(NEXT_COMPONENTS, 'context'));

// Copy Context
const ctxFiles = fs.readdirSync(path.join(VITE_SRC, 'context'));
for (const f of ctxFiles) {
  if (f.endsWith('.jsx') || f.endsWith('.js')) {
    const content = fs.readFileSync(path.join(VITE_SRC, 'context', f), 'utf-8');
    fs.writeFileSync(path.join(NEXT_COMPONENTS, 'context', f.replace('.jsx', '.tsx')), processFile(content));
  }
}

// Copy Components
const compFiles = fs.readdirSync(path.join(VITE_SRC, 'components'));
for (const f of compFiles) {
  if (f.endsWith('.jsx') || f.endsWith('.js')) {
    const content = fs.readFileSync(path.join(VITE_SRC, 'components', f), 'utf-8');
    fs.writeFileSync(path.join(NEXT_COMPONENTS, f.replace('.jsx', '.tsx')), processFile(content));
  }
}

// Copy Pages
const pageFiles = fs.readdirSync(path.join(VITE_SRC, 'pages'));
for (const f of pageFiles) {
  if (f.endsWith('.jsx') || f.endsWith('.js')) {
    const content = fs.readFileSync(path.join(VITE_SRC, 'pages', f), 'utf-8');
    
    let routeName = f.toLowerCase().replace('.jsx', '');
    if (routeName === 'dashboard') routeName = '';
    
    const pageDir = path.join(NEXT_PAGES, routeName);
    ensureDir(pageDir);
    
    fs.writeFileSync(path.join(pageDir, 'page.tsx'), processFile(content));
  }
}

console.log("Migration script complete.");
