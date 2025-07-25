import { TinyMCE } from 'tinymce/core/api/PublicApi';

declare let tinymce: TinyMCE;

tinymce.init({
  selector: 'textarea.tinymce',
  license_key: 'gpl',
  theme: 'silver',
  skin_url: '../../../../../js/tinymce/skins/ui/oxide',
  plugins: 'preview code',
  toolbar: 'preview code',
  height: 600
});

export {};
