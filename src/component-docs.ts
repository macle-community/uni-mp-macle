const componentDocSlugs: Record<string, string> = {
  'scroll-view': 'scroll-view',
  swiper: 'swiper',
  'swiper-item': 'swiper-item',
  view: 'view',
  'cover-view': 'cover-view',
  'cover-image': 'cover-image',
  icon: 'icon',
  text: 'text',
  'rich-text': 'rich-text',
  progress: 'progress',
  button: 'button',
  checkbox: 'checkbox',
  'checkbox-group': 'checkbox-group',
  form: 'form',
  input: 'input',
  picker: 'picker',
  'picker-view': 'picker-view',
  'picker-view-column': 'picker-view-column',
  label: 'label',
  switch: 'switch',
  radio: 'radio',
  'radio-group': 'radio-group',
  slider: 'slider',
  textarea: 'textarea',
  navigator: 'navigator',
  image: 'image',
  video: 'video',
  audio: 'audio',
  camera: 'camera',
  'web-view': 'web-view',
  'page-meta': 'page-meta',
  map: 'map',
};

const docsBase = 'https://macle-opendoc-community.vercel.app/openplatform/macledocs/#';
const mauiComponentDocSlugs: Record<string, string> = {
  'maui-row': 'Layout',
  'maui-col': 'Layout',
  'maui-button': 'Button',
  'maui-field': 'Field',
  'maui-empty': 'Empty',
  'maui-loading': 'Loading',
  'maui-overlay': 'Overlay',
  'maui-popup': 'Popup',
  'maui-toast': 'Toast',
  'maui-image': 'Image',
  'maui-dialog': 'Dialog',
  'maui-icon': 'Icon',
  'maui-cell': 'Cell',
  'maui-progress': 'Progress',
  'maui-radio': 'Radio',
  'maui-checkbox': 'Checkbox',
  'maui-stepper': 'Stepper',
  'maui-title-bar': 'titleBar',
  'maui-steps': 'Steps',
  'maui-sticky': 'Sticky',
  'maui-tab': 'Tab',
  'maui-tag': 'Tag',
  'maui-switch': 'Switch',
  'maui-sidebar': 'Sidebar',
  'maui-divider': 'Divider',
  'maui-slider': 'Slider',
  'maui-modal': 'Modal',
  'maui-list': 'List',
};

const docsRoot = `${docsBase}/component`;
export const MACLE_DOCUMENTED_COMPONENTS = Object.keys(componentDocSlugs);
export const MACLE_UI_LIBRARY_COMPONENTS = Object.keys(mauiComponentDocSlugs);
export const MACLE_UI_LIBRARY_INTRO_URL = `${docsBase}/maui-component/introduce?locale=en_US`;

export function getMacleComponentDocUrl(componentName: string): string {
  const mauiSlug = mauiComponentDocSlugs[componentName.toLowerCase()];
  if (mauiSlug) {
    return `${docsBase}/maui-component/${mauiSlug}?locale=en_US`;
  }

  const slug = componentDocSlugs[componentName.toLowerCase()];
  return slug
    ? `${docsRoot}/${slug}?locale=en_US`
    : `${docsRoot}?locale=en_US`;
}
