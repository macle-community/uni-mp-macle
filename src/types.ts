export interface RuleUrl {
  original?: string;
  target?: string;
  [key: string]: unknown;
}

export interface RuleParameter {
  type?: number;
  msg?: string;
  [key: string]: unknown;
}

export interface RuleBody {
  type?: number;
  value?: string;
  params?: {
    props?: Record<string, RuleParameter>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Rule {
  status?: number;
  type?: number;
  url?: RuleUrl;
  body?: RuleBody;
  props?: Record<string, Rule>;
  [key: string]: unknown;
}

export interface RuleSet {
  apis: Record<string, Rule>;
  components: Record<string, Rule>;
  globalconfig: Record<string, Rule>;
  pageconfig: Record<string, Rule>;
}

export interface CalledApi {
  props: string[];
}

export type CalledApis = Record<string, CalledApi>;

export interface TransformComponent {
  name: string;
  attrs: string[];
  doc: string;
}

export interface TransformRecord {
  type: string;
  status: number;
  components: TransformComponent[];
  openData?: unknown[];
}
