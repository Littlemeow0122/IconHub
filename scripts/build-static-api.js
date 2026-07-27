import fs from 'fs';
import path from 'path';

const SVG_DIR = path.join(process.cwd(), 'svg');
const PUBLIC_API_DIR = path.join(process.cwd(), 'public', 'api');
const PUBLIC_SVG_DIR = path.join(process.cwd(), 'public', 'svg');

// Ensure directories exist
fs.mkdirSync(path.join(PUBLIC_API_DIR, 'libraries'), { recursive: true });
fs.mkdirSync(PUBLIC_SVG_DIR, { recursive: true });

function getLibrariesData() {
  if (!fs.existsSync(SVG_DIR)) return [];

  const folders = fs.readdirSync(SVG_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const libraries = [];
  const searchResults = [];

  for (const folder of folders) {
    const folderPath = path.join(SVG_DIR, folder);
    const jsonPath = path.join(folderPath, 'svg.json');
    let libData = {
      prefix: folder.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      info: {
        name: folder,
        total: 0,
        version: '1.0.0',
        author: { name: 'Local Library' },
        license: { title: 'MIT', spdx: 'MIT' },
        height: 24,
        category: 'General',
        tags: ['Custom'],
        palette: false
      },
      lastModified: Date.now(),
      icons: {}
    };

    if (fs.existsSync(jsonPath)) {
      try {
        const content = fs.readFileSync(jsonPath, 'utf-8');
        const parsed = JSON.parse(content);
        libData = { ...libData, ...parsed };
      } catch (e) {
        console.error(`Error parsing ${jsonPath}:`, e);
      }
    }

    // Check loose SVG files
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        if (file.endsWith('.svg') && file !== 'svg.json') {
          const iconName = file.replace(/\.svg$/, '');
          if (!libData.icons[iconName]) {
            try {
              const svgContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
              const bodyMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
              const body = bodyMatch ? bodyMatch[1] : svgContent;
              libData.icons[iconName] = { body };
            } catch (err) {
              console.error(`Error reading loose svg ${file}:`, err);
            }
          }
        }
      }
    }

    const iconKeys = Object.keys(libData.icons || {});
    libData.info.total = iconKeys.length;

    // Pick 6 preview icons
    const samplesFromInfo = Array.isArray(libData.info.samples) ? libData.info.samples : [];
    const validSamples = samplesFromInfo.filter((key) => libData.icons[key]);
    const remainingKeys = iconKeys.filter((k) => !validSamples.includes(k));
    const sampleKeys = [...validSamples, ...remainingKeys].slice(0, 6);

    const random6 = sampleKeys.map((key) => ({
      name: key,
      body: libData.icons[key]?.body || '',
      height: libData.icons[key]?.height || libData.info.height || 24,
      width: libData.icons[key]?.width || libData.icons[key]?.height || libData.info.height || 24,
    }));

    libraries.push({
      folderName: folder,
      prefix: libData.prefix || 'custom',
      info: libData.info || {},
      lastModified: libData.lastModified || Date.now(),
      totalIcons: iconKeys.length,
      samples: libData.info.samples || [],
      random6,
      iconKeys
    });

    // Save individual library detail JSON for static hosting (multiple filename variations for max compatibility)
    const detailJson = {
      success: true,
      folderName: folder,
      library: libData
    };
    const jsonStr = JSON.stringify(detailJson);
    fs.writeFileSync(
      path.join(PUBLIC_API_DIR, 'libraries', `${folder}.json`),
      jsonStr,
      'utf-8'
    );
    if (encodeURIComponent(folder) !== folder) {
      fs.writeFileSync(
        path.join(PUBLIC_API_DIR, 'libraries', `${encodeURIComponent(folder)}.json`),
        jsonStr,
        'utf-8'
      );
    }
    const slugName = folder.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (slugName !== folder && slugName !== encodeURIComponent(folder)) {
      fs.writeFileSync(
        path.join(PUBLIC_API_DIR, 'libraries', `${slugName}.json`),
        jsonStr,
        'utf-8'
      );
    }

    // Build search array
    const height = libData.info.height || 24;
    for (const iconKey of iconKeys) {
      const iconObj = libData.icons[iconKey];
      searchResults.push({
        libraryName: folder,
        libraryPrefix: libData.prefix,
        iconName: iconKey,
        body: iconObj.body,
        height: iconObj.height || height,
        width: iconObj.width || height,
      });
    }

    // Also copy folder to public/svg for static raw svg file access
    const publicLibDir = path.join(PUBLIC_SVG_DIR, folder);
    fs.mkdirSync(publicLibDir, { recursive: true });
    if (fs.existsSync(jsonPath)) {
      fs.copyFileSync(jsonPath, path.join(publicLibDir, 'svg.json'));
    }
  }

  // Save libraries list JSON
  fs.writeFileSync(
    path.join(PUBLIC_API_DIR, 'libraries.json'),
    JSON.stringify({ success: true, libraries }),
    'utf-8'
  );

  // Save search JSON
  fs.writeFileSync(
    path.join(PUBLIC_API_DIR, 'search.json'),
    JSON.stringify({ success: true, results: searchResults }),
    'utf-8'
  );

  console.log(`[Static API] Successfully generated static API for ${libraries.length} libraries.`);
}

getLibrariesData();
