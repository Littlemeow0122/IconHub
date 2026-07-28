import { ColorTarget } from '../types';

/**
 * Ensures body string is wrapped in a complete <svg> element
 */
export function buildFullSvgString(
  body: string,
  width: number = 24,
  height: number = 24,
  viewBox?: string
): string {
  const trimmed = body.trim();
  if (trimmed.startsWith('<svg')) {
    return trimmed;
  }
  const vb = viewBox || `0 0 ${width} ${height}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${width}" height="${height}">${trimmed}</svg>`;
}

/**
 * Parses SVG string using DOMParser to extract customizable color elements
 */
export function extractColorTargets(svgString: string): ColorTarget[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return [];

    const targets: ColorTarget[] = [];
    const elements = doc.querySelectorAll('*');

    let counter = 1;

    elements.forEach((el, index) => {
      const tagName = el.tagName.toLowerCase();
      if (['svg', 'g', 'defs', 'clipPath', 'mask', 'style', 'script', 'animate', 'animatetransform'].includes(tagName)) {
        return;
      }

      const idAttr = el.getAttribute('id');
      const fillAttr = el.getAttribute('fill');
      const strokeAttr = el.getAttribute('stroke');

      const nameLabel = idAttr 
        ? idAttr.replace(/[-_]/g, ' ') 
        : `${tagName.toUpperCase()} #${counter++}`;

      // Check fill
      if (fillAttr && fillAttr !== 'none') {
        targets.push({
          id: `el-${index}-fill`,
          elementName: nameLabel,
          property: 'fill',
          currentColor: normalizeColor(fillAttr),
          selectorType: idAttr ? 'id' : 'tag'
        });
      }

      // Check stroke
      if (strokeAttr && strokeAttr !== 'none') {
        targets.push({
          id: `el-${index}-stroke`,
          elementName: nameLabel,
          property: 'stroke',
          currentColor: normalizeColor(strokeAttr),
          selectorType: idAttr ? 'id' : 'tag'
        });
      }

      // If no fill or stroke explicitly set, but it's a path/circle/rect
      if (!fillAttr && !strokeAttr && ['path', 'rect', 'circle', 'ellipse', 'polygon'].includes(tagName)) {
        targets.push({
          id: `el-${index}-default-fill`,
          elementName: nameLabel,
          property: 'fill',
          currentColor: '#000000',
          selectorType: idAttr ? 'id' : 'tag'
        });
      }
    });

    // Deduplicate or add root currentColor if targets list is empty
    if (targets.length === 0) {
      targets.push({
        id: 'root-currentcolor',
        elementName: 'Icon Color (currentColor)',
        property: 'currentColor',
        currentColor: '#000000',
        selectorType: 'inline'
      });
    }

    return targets;
  } catch (err) {
    console.error('Error parsing SVG color targets:', err);
    return [
      {
        id: 'fallback-color',
        elementName: 'Icon Main Color',
        property: 'currentColor',
        currentColor: '#000000',
        selectorType: 'inline'
      }
    ];
  }
}

/**
 * Replaces colors in an SVG string based on target map
 */
export function replaceSvgColors(
  svgString: string,
  colorMap: Record<string, string>
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgString;

    const elements = doc.querySelectorAll('*');

    elements.forEach((el, index) => {
      const fillKey = `el-${index}-fill`;
      const strokeKey = `el-${index}-stroke`;
      const defaultKey = `el-${index}-default-fill`;

      if (colorMap[fillKey]) {
        el.setAttribute('fill', colorMap[fillKey]);
      }
      if (colorMap[strokeKey]) {
        el.setAttribute('stroke', colorMap[strokeKey]);
      }
      if (colorMap[defaultKey]) {
        el.setAttribute('fill', colorMap[defaultKey]);
      }
    });

    // Handle root currentColor override
    if (colorMap['root-currentcolor'] || colorMap['fallback-color']) {
      const mainColor = colorMap['root-currentcolor'] || colorMap['fallback-color'];
      svgEl.setAttribute('fill', mainColor);
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (e) {
    return svgString;
  }
}

/**
 * Converts Hex / Named color to standard 6-char hex for <input type="color">
 */
export function normalizeColor(colorStr: string): string {
  if (!colorStr) return '#000000';
  if (colorStr === 'currentColor') return '#000000';
  if (colorStr.startsWith('#')) {
    if (colorStr.length === 4) {
      // #abc -> #aabbcc
      return '#' + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3];
    }
    return colorStr.slice(0, 7);
  }
  // Named color fallback canvas test
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx) {
    ctx.fillStyle = colorStr;
    return ctx.fillStyle;
  }
  return '#000000';
}

/**
 * Creates SVG Data URL
 */
export function getSvgDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;utf8,${encoded}`;
}

/**
 * Formats SVG into React Component JSX code string
 */
export function convertToReactJsx(svgString: string, componentName: string = 'SvgIcon'): string {
  let jsx = svgString
    .replace(/class=/g, 'className=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
    .replace(/stroke-dasharray=/g, 'strokeDasharray=')
    .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
    .replace(/fill-opacity=/g, 'fillOpacity=')
    .replace(/stroke-opacity=/g, 'strokeOpacity=')
    .replace(/transform-origin=/g, 'transformOrigin=')
    .replace(/repeatcount=/g, 'repeatCount=')
    .replace(/attributename=/g, 'attributeName=')
    .replace(/keytimes=/g, 'keyTimes=');

  const formattedName = componentName
    .split(/[-_ ]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return `import React from 'react';

export const ${formattedName}Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  ${jsx.replace('<svg', '<svg {...props}')}
);
`;
}
