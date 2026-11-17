import * as vscode from 'vscode';
import {
  getMacleComponentDocUrl,
  MACLE_DOCUMENTED_COMPONENTS,
  MACLE_UI_LIBRARY_COMPONENTS,
  MACLE_UI_LIBRARY_INTRO_URL,
} from '../../src/component-docs';
import { components } from '../../src/rules';
import { vueSectionAt } from './diagnostics';

const componentNames = Array.from(
  new Set([
    ...MACLE_DOCUMENTED_COMPONENTS,
    ...MACLE_UI_LIBRARY_COMPONENTS,
    ...Object.keys(components),
  ])
).sort();

const scrollViewAttributes: Record<string, string> = {
  'scroll-x': 'Enable horizontal scrolling.',
  'scroll-y': 'Enable vertical scrolling.',
  'upper-threshold': 'Distance from the top or left that triggers scrolltoupper.',
  'lower-threshold': 'Distance from the bottom or right that triggers scrolltolower.',
  'scroll-top': 'Vertical scroll position.',
  'scroll-left': 'Horizontal scroll position.',
  'scroll-into-view': 'Scroll to the element with the specified ID.',
  'scroll-with-animation': 'Animate changes to the scroll position.',
  enhanced: 'Enable enhanced scroll-view behavior.',
  'show-scrollbar': 'Show the scrollbar when enhanced scrolling is enabled.',
  bindscrolltoupper: 'Event fired when scrolling reaches the top or left.',
  bindscrolltolower: 'Event fired when scrolling reaches the bottom or right.',
  bindscroll: 'Event fired while scrolling.',
  binddragstart: 'Drag-start event for enhanced scrolling.',
  binddragging: 'Drag event for enhanced scrolling.',
  binddragend: 'Drag-end event for enhanced scrolling.',
};

const mauiAttributes: Record<string, Record<string, string>> = {
  'maui-row': { gutter: 'Spacing between column elements in pixels.' },
  'maui-col': {
    span: 'Column width in the 24-column grid.',
    offset: 'Column offset in the 24-column grid.',
  },
  'maui-button': {
    type: 'Button type: default, primary, info, warning, or danger.',
    size: 'Button size: normal, large, small, or mini.',
    color: 'Button color; linear-gradient values are supported.',
    icon: 'Icon URL displayed on the button.',
    plain: 'Use a plain button style.',
    block: 'Display the button as a block-level element.',
    round: 'Use a round button shape.',
    square: 'Use a square button shape.',
    disabled: 'Disable the button.',
    hairline: 'Use a half-pixel border.',
    loading: 'Display the loading state.',
    'loading-text': 'Text displayed while loading.',
    'loading-type': 'Loading icon type, for example spinner.',
    'loading-size': 'Loading icon size.',
    'custom-style': 'Custom inline style.',
  },
  'maui-field': {
    label: 'Text displayed beside the field.',
    value: 'Current field value.',
    type: 'Input type, including text, number, idcard, digit, or textarea.',
    focus: 'Focus the field.',
    disabled: 'Disable the field.',
    password: 'Use password input mode.',
    maxlength: 'Maximum input length; -1 removes the limit.',
    placeholder: 'Placeholder shown when the field is empty.',
    'placeholder-style': 'Placeholder CSS styles.',
    'show-word-limit': 'Show the word count.',
    error: 'Mark the field as invalid.',
    'error-message': 'Validation message displayed below the field.',
    'error-message-align': 'Alignment of the validation message.',
    'input-align': 'Alignment of the input value.',
    autosize: 'Automatically fit the height of textarea fields.',
    'confirm-type': 'Keyboard confirmation button label.',
    'confirm-hold': 'Keep the keyboard open after confirmation.',
    'adjust-position': 'Move the page when the keyboard opens.',
    'selection-start': 'Start of the selected text range.',
    'selection-end': 'End of the selected text range.',
    cursor: 'Cursor position when focused.',
  },
  'maui-title-bar': {
    title: 'Navigation bar title.',
    'title-style': 'Title style.',
    'left-text': 'Text on the left side.',
    'left-style': 'Style for the left side.',
    'right-text': 'Text on the right side.',
    'right-style': 'Style for the right side.',
    'left-arrow': 'Show the left arrow.',
    'left-icon': 'Custom left icon.',
    'left-image': 'Image used as the left icon.',
    fixed: 'Fix the navigation bar to the top.',
    'safe-area-inset-top': 'Leave space for the status bar.',
    'z-index': 'Navigation bar stacking order.',
    'use-slot': 'Use a slot for right-side content.',
  },
};

function componentDocumentation(name: string): vscode.MarkdownString {
  const rule = components[name];
  const markdown = new vscode.MarkdownString();
  if (name.startsWith('maui-')) {
    markdown.appendText(
      'MAUI UI library component. Copy the library dist files into the project and register the component in usingComponents.'
    );
    markdown.appendMarkdown(
      `\n\n[Setup guide](${MACLE_UI_LIBRARY_INTRO_URL}) · [Component docs](${getMacleComponentDocUrl(name)})`
    );
    return markdown;
  }
  if (rule?.name && typeof rule.name === 'string') {
    markdown.appendText(rule.name);
    markdown.appendMarkdown('\n\n');
  }
  if (rule?.status === 2) markdown.appendText('Not supported in Macle.');
  else if (rule?.status === 1) markdown.appendText('Partially supported in Macle.');
  else markdown.appendText('Macle component.');
  markdown.appendMarkdown(`\n\n[Open Macle component docs](${getMacleComponentDocUrl(name)})`);
  return markdown;
}

function componentCompletionItems(
  position: vscode.Position,
  prefix: string
): vscode.CompletionItem[] {
  const start = position.character - prefix.length;
  const range = new vscode.Range(position.line, start, position.line, position.character);
  return componentNames
    .filter((name) => name.startsWith(prefix.toLowerCase()))
    .map((name) => {
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Class);
      item.range = range;
      item.insertText = name;
      item.detail = name.startsWith('maui-')
        ? 'MAUI UI library component (manual registration)'
        : components[name]?.status === 2
          ? 'Unsupported in Macle'
          : components[name]?.status === 1
            ? 'Partially supported in Macle'
            : 'Macle component';
      item.documentation = componentDocumentation(name);
      return item;
    });
}

function attributeCompletionItems(
  componentName: string,
  position: vscode.Position,
  prefix: string
): vscode.CompletionItem[] {
  const rule = components[componentName];
  const mauiComponentAttributes = mauiAttributes[componentName] ?? {};
  const names = new Set([
    'id',
    'class',
    'style',
    'hidden',
    ...Object.keys(rule?.props ?? {}),
    ...Object.keys(mauiComponentAttributes),
  ]);
  if (componentName === 'scroll-view') {
    for (const name of Object.keys(scrollViewAttributes)) names.add(name);
  }
  const start = position.character - prefix.length;
  const range = new vscode.Range(position.line, start, position.line, position.character);

  return [...names]
    .filter((name) => name.startsWith(prefix))
    .map((name) => {
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Property);
      item.range = range;
      item.insertText = name;
      const propRule = rule?.props?.[name];
      const description =
        scrollViewAttributes[name] ||
        mauiComponentAttributes[name] ||
        (typeof propRule?.desc === 'string' ? propRule.desc : undefined);
      const unsupported = propRule?.status === 2;
      item.detail = unsupported ? 'Not supported in Macle' : 'Component attribute';
      if (description || unsupported) {
        const markdown = new vscode.MarkdownString();
        if (description) markdown.appendText(description);
        if (unsupported) {
          if (description) markdown.appendMarkdown('\n\n');
          markdown.appendText('This attribute is not supported in Macle.');
        }
        markdown.appendMarkdown(`\n\n[Open Macle component docs](${getMacleComponentDocUrl(componentName)})`);
        item.documentation = markdown;
      }
      return item;
    });
}

export function componentCompletionProvider(): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(document, position) {
      const text = document.getText();
      if (vueSectionAt(text, document.offsetAt(position)) !== 'template') return undefined;

      const before = document.lineAt(position.line).text.slice(0, position.character);
      const attributeTag = before.match(/<([A-Za-z][\w-]*)\s+([^<>]*)$/);
      if (attributeTag) {
        const componentName = attributeTag[1].toLowerCase();
        const attributePrefix = attributeTag[2].match(/[\w-]*$/)?.[0] ?? '';
        return attributeCompletionItems(componentName, position, attributePrefix);
      }

      const tag = before.match(/<([A-Za-z][\w-]*)?$/);
      if (!tag) return undefined;
      return componentCompletionItems(position, tag[1] ?? '');
    },
  };
}
