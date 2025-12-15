<?php
/*
Version: 2025.12.15
Plugin Name: TinyMCE编辑器
Author: TinyMCE
Author URL: https://www.emlog.net/plugin/detail/362
Description: 所见即所得编辑器，媒体批量上传，外链嵌入：AcFun、BiliBili、抖音、优酷、搜狐视频、腾讯视频、网易云音乐。
*/
!defined('EMLOG_ROOT') && exit('access deined!');
function emlog_tinymce_uses() {
    if (!intval(Storage::getInstance('emlog_tinymce')->getValue('off_article'))) {$uses[] = '/article.php';}
    if (!intval(Storage::getInstance('emlog_tinymce')->getValue('off_twitter'))) {$uses[] = '/twitter.php';}
    if (!intval(Storage::getInstance('emlog_tinymce')->getValue('off_page'))) {$uses[] = '/page.php';}
    if (!in_array(strrchr($_SERVER['SCRIPT_NAME'], '/'), $uses)) {return false;}
    return true;
}
addAction('adm_head', function () {
    if (!emlog_tinymce_uses()) {return false;}
    ?>
    <style>
        .tox-tbtn:not(.tox-tbtn--select):not(.tox-split-button__chevron) {width: 32px !important;}
        .tox-tbtn__select-chevron, tox-split-button__chevron {width: 16px !important;}
        .tox-tbtn__select-label {width: auto !important;}
    </style>
    <?php
});
addAction('adm_footer', function () {
    if (!emlog_tinymce_uses()) {return false;}
    $fold = substr(basename(__FILE__), 0, -4);
    ?>
    <script>
        function insert_media_video(fileurl) { tinymce.get(emlog_tinymce_area.id).insertContent(emlog_tinymce_html({ act: 'video', source: fileurl })); };
        function insert_media_audio(fileurl) { tinymce.get(emlog_tinymce_area.id).insertContent(emlog_tinymce_html({ act: 'audio', source: fileurl })); };
        function insert_media_img(fileurl) { tinymce.get(emlog_tinymce_area.id).insertContent(emlog_tinymce_html({ act: 'image', source: fileurl })); };
        function insert_media(fileurl, filename) { tinymce.get(emlog_tinymce_area.id).insertContent(emlog_tinymce_html({ act: 'file', source: fileurl, alt: filename })); };
        const emlog_tinymce_area = document.createElement('textarea');
        const emlog_tinymce_type = [<?php foreach(Option::getAttType() as $ext){if($ext){echo '".'.$ext.'",';}}; ?>];
        const emlog_tinymce_size = <?php echo Option::getAttMaxSize(); ?>;
        const emlog_tinymce_link = <?php echo intval(Storage::getInstance('emlog_tinymce')->getValue('imglink')); ?>;
        const emlog_tinymce_boot = new MutationObserver(() => {
            emlog_tinymce_boot.disconnect();
            const emlog_official_editor = Editor.editor.find('textarea[name=logcontent], textarea[name=pagecontent], textarea[name=t]').first();
            emlog_tinymce_area.name = emlog_official_editor.attr('name');
            emlog_tinymce_area.value = emlog_official_editor.val();
            emlog_tinymce_area.className = 'useTinyMCE';
            Editor.editor.before(emlog_tinymce_area);
            Editor.editor.remove();
            Editor = {
                getValue: function () { return tinymce.get(emlog_tinymce_area.id).getContent(); },
                getValueText: function () { return tinymce.get(emlog_tinymce_area.id).getContent({ format: "text" }); },
                getSelection: function () { return tinymce.get(emlog_tinymce_area.id).selection.getContent(); },
                getSelectionText: function () { return tinymce.get(emlog_tinymce_area.id).selection.getContent({ format: "text" }); },
                setValue: function (c) { tinymce.get(emlog_tinymce_area.id).setContent(c); },
                insertValue: function (c) { tinymce.get(emlog_tinymce_area.id).insertContent(c); },
            };
            Editor.getHTML = Editor.getValue;
            Editor.getPreviewedHTML = Editor.getValue;
            Editor.getMarkdown = Editor.getValueText;
            emlog_tinymce_conf = { <?php echo stripslashes(Storage::getInstance('emlog_tinymce')->getValue('options')); ?> };
            emlog_tinymce_init("../content/plugins/<?php echo $fold; ?>/core/tinymce.min.js", "../content/plugins/<?php echo $fold; ?>/zh_CN.js");
        });
        emlog_tinymce_boot.observe(document.querySelector('textarea'), { attributes: true, childList: true, subtree: true });
        $(document).on("focusin", function (e) { // Patch by 曦颜XY
            if ($(e.target).closest(".tox-textfield").length) { e.stopImmediatePropagation(); };
            if ($(e.target).closest(".tox-textarea").length) { e.stopImmediatePropagation(); };
        });
    </script>
    <script src="../admin/editor.md/lib/marked.min.js"></script>
    <script src="../content/plugins/<?php echo $fold; ?>/tiny.js?<?php echo date('Ymd', time()); ?>"></script>
    <?php
});
?>