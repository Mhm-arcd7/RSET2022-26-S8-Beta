export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  url: string;
  vulnerabilities: Vulnerability[];
}

export interface Vulnerability {
  type: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  locations: Array<{ x: number; y: number; width: number; height: number }>;
}