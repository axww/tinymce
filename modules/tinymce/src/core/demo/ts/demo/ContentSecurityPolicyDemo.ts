/* eslint-disable no-console */
import { Merger } from '@ephox/katamari';
import { Css, SugarElement } from '@ephox/sugar';

import { Editor, RawEditorOptions, TinyMCE } from 'tinymce/core/api/PublicApi';

declare let tinymce: TinyMCE;

const makeSidebar = (ed: Editor, name: string, background: string, width: number) => {
  ed.ui.registry.addSidebar(name, {
    icon: 'comment',
    tooltip: 'Tooltip for ' + name,
    onSetup: (api) => {
      console.log('onSetup ' + name);
      const box = SugarElement.fromTag('div');
      Css.setAll(box, {
        width: width + 'px',
        background
      });
      api.element().appendChild(box.dom);
      return () => {
        api.element().removeChild(box.dom);
      };
    },
    onShow: (_api) => {
      console.log('onShow ' + name);
    },
    onHide: (_api) => {
      console.log('onHide ' + name);
    }
  });
};

const settings: RawEditorOptions = {
  skin_url: '../../../../js/tinymce/skins/ui/oxide',
  content_css: '../../../../js/tinymce/skins/content/default/content.css',
  images_upload_url: 'd',
  selector: 'textarea',
  license_key: 'gpl',
  // rtl_ui: true,
  link_list: [
    { title: 'My page 1', value: 'http://www.tinymce.com' },
    { title: 'My page 2', value: 'http://www.moxiecode.com' }
  ],
  image_list: [
    { title: 'My page 1', value: 'http://www.tinymce.com' },
    { title: 'My page 2', value: 'http://www.moxiecode.com' }
  ],
  image_class_list: [
    { title: 'None', value: '' },
    { title: 'Some class', value: 'class-name' }
  ],
  importcss_append: true,
  height: 400,
  image_advtab: true,
  file_picker_callback: (callback, _value, meta) => {
    if (meta.fieldname === 'poster') {
      callback('test.mp4', { altsource: 'blah.ogg', width: '400px', poster: 'testing.jpg', embed: '<p>test</p>' });
      return;
    }
    // Provide file and text for the link dialog
    if (meta.filetype === 'file') {
      callback('https://www.google.com/logos/google.jpg', { text: 'My text', title: 'blah' });
    }

    // Provide image and alt text for the image dialog
    if (meta.filetype === 'image') {
      // tslint:disable-next-line: no-debugger
      callback('https://www.google.com/logos/google.jpg', { alt: 'My alt text', style: 'border: 10px solid black;' });
    }

    // Provide alternative source and posted for the media dialog
    if (meta.filetype === 'media') {
      callback('movie.mp4', { embed: '<p>test</p>' });
    }
  },
  image_caption: true,
  theme: 'silver',
  setup: (ed) => {
    makeSidebar(ed, 'sidebar1', 'green', 200);
  },
  plugins: [
    'autosave', 'advlist', 'autolink', 'link', 'image', 'lists', 'charmap', 'preview', 'anchor', 'pagebreak',
    'searchreplace', 'wordcount', 'visualblocks', 'visualchars', 'code', 'fullscreen', 'insertdatetime', 'media', 'nonbreaking',
    'save', 'table', 'directionality', 'emoticons', 'importcss', 'codesample', 'help'
  ],
  // rtl_ui: true,
  add_unload_trigger: false,
  autosave_ask_before_unload: false,
  toolbar: 'undo redo sidebar1 align fontsize fontfamily blocks styles insertfile | styles | bold italic | alignleft aligncenter alignright alignjustify | ' +
  'bullist numlist outdent indent | link image | print preview media | forecolor backcolor emoticons table codesample code | ltr rtl | fullscreen',

  // Multiple toolbar array
  // toolbar: ['undo redo sidebar1 align fontsize insertfile | fontfamily blocks styles insertfile | styles | bold italic',
  // 'alignleft aligncenter alignright alignjustify | print preview media | forecolor backcolor emoticons table codesample code | ltr rtl',
  // 'bullist numlist outdent indent | link image'],

  // Toolbar<n>
  // toolbar1: 'undo redo sidebar1 align fontsize insertfile | fontfamily blocks styles insertfile | styles | bold italic',
  // toolbar2: 'alignleft aligncenter alignright alignjustify | print preview media | forecolor backcolor emoticons table codesample code | ltr rtl',
  // toolbar3: 'bullist numlist outdent indent | link image',

  // Toolbar with group names
  // toolbar: [
  //   {
  //     name: 'history', items: [ 'undo', 'redo' ]
  //   },
  //   {
  //     name: 'styles', items: [ 'styles' ]
  //   },
  //   {
  //     name: 'formatting', items: [ 'bold', 'italic']
  //   },
  //   {
  //     name: 'alignment', items: [ 'alignleft', 'aligncenter', 'alignright', 'alignjustify' ]
  //   },
  //   {
  //     name: 'indentation', items: [ 'outdent', 'indent' ]
  //   },
  //   {
  //     name: 'permanent pen', items: [ 'permanentpen' ]
  //   },
  //   {
  //     name: 'comments', items: [ 'addcomment' ]
  //   }
  // ],
  toolbar_mode: 'floating',
  emoticons_database_url: '/src/plugins/emoticons/main/js/emojis.js',
  resize_img_proportional: true
};

tinymce.init(settings);
tinymce.init(Merger.deepMerge(settings, { inline: true, selector: 'div.tinymce' }));
