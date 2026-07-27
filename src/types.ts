export interface SvgAuthor {
  name: string;
  url?: string;
}

export interface SvgLicense {
  title: string;
  spdx?: string;
  url?: string;
}

export interface SvgLibraryInfo {
  name: string;
  total: number;
  version?: string;
  author?: SvgAuthor;
  license?: SvgLicense;
  samples?: string[];
  height?: number;
  category?: string;
  tags?: string[];
  palette?: boolean;
}

export interface RandomIconSample {
  name: string;
  body: string;
  height?: number;
  width?: number;
}

export interface SvgLibrarySummary {
  folderName: string;
  prefix: string;
  info: SvgLibraryInfo;
  lastModified: number;
  totalIcons: number;
  samples?: string[];
  random6: RandomIconSample[];
  iconKeys: string[];
}

export interface SvgIconDetail {
  libraryName: string;
  libraryPrefix?: string;
  iconName: string;
  body: string;
  height?: number;
  width?: number;
  viewBox?: string;
}

export interface ColorTarget {
  id: string; // unique key or element id
  elementName: string; // e.g. "path #1", "folder-back", "sun-rays"
  property: 'fill' | 'stroke' | 'currentColor';
  currentColor: string; // hex or rgb or "currentColor"
  selectorType: 'id' | 'tag' | 'class' | 'inline';
}
