import { Arr, Obj, Type } from '@ephox/katamari';

import Editor from 'tinymce/core/api/Editor';
import type { TinyMCE } from 'tinymce/core/api/Tinymce';
import { Dialog } from 'tinymce/core/api/ui/Ui';
import I18n from 'tinymce/core/api/util/I18n';

import * as Options from '../api/Options';
import * as PluginUrls from '../data/PluginUrls';

declare let tinymce: TinyMCE;

interface PluginData {
  // The name is just used for sorting alphabetically.
  readonly name: string;
  readonly html: string;
}

const tab = (editor: Editor): Dialog.TabSpec & { name: string } => {
  const availablePlugins = () => {
    const premiumPlugins = Arr.filter(PluginUrls.urls, ({ type }) => {
      return type === PluginUrls.PluginType.Premium;
    });

    const sortedPremiumPlugins = Arr.sort(
      Arr.map(premiumPlugins, (p) => p.name),
      (s1, s2) => s1.localeCompare(s2)
    );

    const premiumPluginList = Arr.map(sortedPremiumPlugins, (pluginName) => `<li>${pluginName}</li>`).join('');
    return '<div>' +
      '<p><b>' + I18n.translate('Premium plugins:') + '</b></p>' +
      '<ul>' +
      premiumPluginList +
      '<li class="tox-help__more-link" ">' +
      '<a href="https://www.tiny.cloud/pricing/?utm_campaign=help_dialog_plugin_tab&utm_source=tiny&utm_medium=referral&utm_term=read_more&utm_content=premium_plugin_heading" rel="noopener" target="_blank"' +
      ' data-alloy-tabstop="true" tabindex="-1">' + I18n.translate('Learn more...') + '</a></li>' +
      '</ul>' +
      '</div>';
  };

  const makeLink = (p: { name: string; url: string }): string =>
    `<a data-alloy-tabstop="true" tabindex="-1" href="${p.url}" target="_blank" rel="noopener">${p.name}</a>`;

  const identifyUnknownPlugin = (editor: Editor, key: string): PluginData => {
    const getMetadata = editor.plugins[key].getMetadata;
    if (Type.isFunction(getMetadata)) {
      const metadata = getMetadata();
      return { name: metadata.name, html: makeLink(metadata) };
    } else {
      return { name: key, html: key };
    }
  };

  const getPluginData = (editor: Editor, key: string): PluginData => Arr.find(PluginUrls.urls, (x) => {
    return x.key === key;
  }).fold(() => {
    return identifyUnknownPlugin(editor, key);
  }, (x) => {
    // We know this plugin, so use our stored details.
    const name = x.type === PluginUrls.PluginType.Premium ? `${x.name}*` : x.name;
    const html = makeLink({ name, url: `https://www.tiny.cloud/docs/tinymce/${tinymce.majorVersion}/${x.slug}/` });
    return { name, html };
  });

  const getPluginKeys = (editor: Editor) => {
    const keys = Obj.keys(editor.plugins);
    const forcedPlugins = Options.getForcedPlugins(editor);
    const hiddenPlugins = Type.isUndefined(forcedPlugins) ? [ 'onboarding' ] : forcedPlugins.concat([ 'onboarding' ] );

    return Arr.filter(keys, (k) => !Arr.contains(hiddenPlugins, k));
  };

  const pluginLister = (editor: Editor) => {
    const pluginKeys = getPluginKeys(editor);
    const sortedPluginData = Arr.sort(
      Arr.map(pluginKeys, (k) => getPluginData(editor, k)),
      (pd1, pd2) => pd1.name.localeCompare(pd2.name)
    );

    const pluginLis = Arr.map(sortedPluginData, (key) => {
      return '<li>' + key.html + '</li>';
    });
    const count = pluginLis.length;
    const pluginsString = pluginLis.join('');

    const html = '<p><b>' + I18n.translate([ 'Plugins installed ({0}):', count ]) + '</b></p>' +
      '<ul>' + pluginsString + '</ul>';

    return html;
  };

  const installedPlugins = (editor: Editor) => {
    if (editor == null) {
      return '';
    }
    return '<div>' +
      pluginLister(editor) +
      '</div>';
  };

  const htmlPanel: Dialog.HtmlPanelSpec = {
    type: 'htmlpanel',
    presets: 'document',
    html: [
      installedPlugins(editor),
      availablePlugins()
    ].join('')
  };
  return {
    name: 'plugins',
    title: 'Plugins',
    items: [
      htmlPanel
    ]
  };
};

export {
  tab
};
