import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const SVG_DIR = path.join(process.cwd(), 'svg');

  // Ensure svg directory exists
  if (!fs.existsSync(SVG_DIR)) {
    fs.mkdirSync(SVG_DIR, { recursive: true });
  }

  app.use(express.json({ limit: '10mb' }));

  // Helper function to load all libraries
  function getLibrariesData() {
    if (!fs.existsSync(SVG_DIR)) return [];
    
    const folders = fs.readdirSync(SVG_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const libraries = [];

    for (const folder of folders) {
      const folderPath = path.join(SVG_DIR, folder);
      const jsonPath = path.join(folderPath, 'svg.json');
      let libData: any = {
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

      // Check loose SVG files in folder
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        if (file.endsWith('.svg') && file !== 'svg.json') {
          const iconName = file.replace(/\.svg$/, '');
          if (!libData.icons[iconName]) {
            try {
              const svgContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
              // Extract body inside <svg>...</svg>
              const bodyMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
              const body = bodyMatch ? bodyMatch[1] : svgContent;
              libData.icons[iconName] = { body };
            } catch (err) {
              console.error(`Error reading loose svg ${file}:`, err);
            }
          }
        }
      }

      const iconKeys = Object.keys(libData.icons || {});
      libData.info.total = iconKeys.length;

      // Pick 6 preview icons (prioritize samples from info if specified)
      const samplesFromInfo: string[] = Array.isArray(libData.info.samples) ? libData.info.samples : [];
      const validSamples = samplesFromInfo.filter((key: string) => libData.icons[key]);
      const remainingKeys = iconKeys.filter((k: string) => !validSamples.includes(k));
      const shuffledRemaining = [...remainingKeys].sort(() => 0.5 - Math.random());
      const sampleKeys = [...validSamples, ...shuffledRemaining].slice(0, 6);

      const random6 = sampleKeys.map((key: string) => ({
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
    }

    return libraries;
  }

  // API 1: List all libraries for Home Page
  app.get('/api/libraries', (req, res) => {
    try {
      const libs = getLibrariesData();
      res.json({ success: true, libraries: libs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 2: Get single library detail with all icons
  app.get('/api/libraries/:libName', (req, res) => {
    try {
      const { libName } = req.params;
      const folderPath = path.join(SVG_DIR, libName);

      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ success: false, error: 'Library not found' });
      }

      const jsonPath = path.join(folderPath, 'svg.json');
      let libData: any = {
        prefix: libName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        info: { name: libName, total: 0, height: 24 },
        icons: {}
      };

      if (fs.existsSync(jsonPath)) {
        const content = fs.readFileSync(jsonPath, 'utf-8');
        libData = JSON.parse(content);
      }

      // Check loose svg files
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        if (file.endsWith('.svg')) {
          const iconName = file.replace(/\.svg$/, '');
          if (!libData.icons[iconName]) {
            const svgContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
            const bodyMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
            libData.icons[iconName] = { body: bodyMatch ? bodyMatch[1] : svgContent };
          }
        }
      }

      res.json({ success: true, folderName: libName, library: libData });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 3: Global or Local Search
  app.get('/api/search', (req, res) => {
    try {
      const query = (req.query.q as string || '').toLowerCase().trim();
      const libraryFilter = req.query.library as string || '';

      const libraries = getLibrariesData();
      const results: any[] = [];

      for (const libSummary of libraries) {
        if (libraryFilter && libSummary.folderName !== libraryFilter) {
          continue;
        }

        const folderPath = path.join(SVG_DIR, libSummary.folderName);
        const jsonPath = path.join(folderPath, 'svg.json');
        let iconsMap: any = {};
        let height = libSummary.info.height || 24;

        if (fs.existsSync(jsonPath)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            iconsMap = parsed.icons || {};
            height = parsed.info?.height || height;
          } catch (e) {}
        }

        for (const iconKey of Object.keys(iconsMap)) {
          if (!query || iconKey.toLowerCase().includes(query) || libSummary.info.name.toLowerCase().includes(query) || (libSummary.info.category && libSummary.info.category.toLowerCase().includes(query))) {
            const iconObj = iconsMap[iconKey];
            results.push({
              libraryName: libSummary.folderName,
              libraryPrefix: libSummary.prefix,
              iconName: iconKey,
              body: iconObj.body,
              height: iconObj.height || height,
              width: iconObj.width || height,
            });
          }
        }
      }

      res.json({ success: true, query, total: results.length, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 4: Create new Library
  app.post('/api/libraries/create', (req, res) => {
    try {
      const { name, category, prefix, author, license } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Library name required' });

      const folderPath = path.join(SVG_DIR, name);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const initialJson = {
        prefix: prefix || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        info: {
          name,
          total: 0,
          version: '1.0.0',
          author: author || { name: 'User Created' },
          license: license || { title: 'MIT', spdx: 'MIT' },
          samples: [],
          height: 24,
          category: category || 'General',
          tags: ['Custom'],
          palette: false
        },
        lastModified: Date.now(),
        icons: {}
      };

      fs.writeFileSync(path.join(folderPath, 'svg.json'), JSON.stringify(initialJson, null, 2), 'utf-8');
      res.json({ success: true, folderName: name, library: initialJson });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 5: Add or upload SVG to a library
  app.post('/api/libraries/:libName/upload', (req, res) => {
    try {
      const { libName } = req.params;
      const { iconName, svgCode } = req.body;

      if (!iconName || !svgCode) {
        return res.status(400).json({ success: false, error: 'iconName and svgCode required' });
      }

      const folderPath = path.join(SVG_DIR, libName);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Save standalone .svg file
      const cleanName = iconName.replace(/\.svg$/, '');
      const fullSvg = svgCode.includes('<svg') 
        ? svgCode 
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${svgCode}</svg>`;

      fs.writeFileSync(path.join(folderPath, `${cleanName}.svg`), fullSvg, 'utf-8');

      // Update svg.json
      const jsonPath = path.join(folderPath, 'svg.json');
      let libData: any = {
        prefix: libName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        info: { name: libName, total: 0, height: 24 },
        icons: {}
      };

      if (fs.existsSync(jsonPath)) {
        libData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      }

      const bodyMatch = fullSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
      const body = bodyMatch ? bodyMatch[1] : svgCode;

      libData.icons = libData.icons || {};
      libData.icons[cleanName] = { body };
      libData.lastModified = Date.now();
      libData.info.total = Object.keys(libData.icons).length;

      fs.writeFileSync(jsonPath, JSON.stringify(libData, null, 2), 'utf-8');

      res.json({ success: true, iconName: cleanName });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // RAW FILE ENDPOINT: /files/庫名稱/xxx.svg
  app.get('/files/:libName/:iconFile', (req, res) => {
    try {
      const { libName, iconFile } = req.params;
      const cleanName = iconFile.endsWith('.svg') ? iconFile.slice(0, -4) : iconFile;
      const folderPath = path.join(SVG_DIR, libName);

      // Option A: Check direct disk file
      const exactSvgPath = path.join(folderPath, `${cleanName}.svg`);
      if (fs.existsSync(exactSvgPath)) {
        const content = fs.readFileSync(exactSvgPath, 'utf-8');
        res.type('image/svg+xml');
        return res.send(content);
      }

      // Option B: Look up in svg.json
      const jsonPath = path.join(folderPath, 'svg.json');
      if (fs.existsSync(jsonPath)) {
        const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const iconData = jsonContent.icons?.[cleanName];
        if (iconData) {
          const height = iconData.height || jsonContent.info?.height || 24;
          const width = iconData.width || iconData.height || jsonContent.info?.height || 24;
          const viewBox = iconData.viewBox || `0 0 ${width} ${height}`;
          
          let fullSvg = iconData.body.trim();
          if (!fullSvg.startsWith('<svg')) {
            fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${iconData.body}</svg>`;
          }

          res.type('image/svg+xml');
          return res.send(fullSvg);
        }
      }

      res.status(404).type('image/svg+xml').send(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50" viewBox="0 0 200 50">
          <text x="10" y="30" fill="red" font-family="sans-serif" font-size="14">SVG Icon Not Found</text>
        </svg>`
      );
    } catch (err: any) {
      res.status(500).send(`Error serving raw SVG: ${err.message}`);
    }
  });

  // Vite development middleware vs production static server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
