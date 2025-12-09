<?php
!defined('EMLOG_ROOT') && exit('access deined!');
function plugin_setting_view() {
    $fold=substr(basename(__FILE__),0,-12);
    $off_article=intval(Storage::getInstance('emlog_tinymce')->getValue('off_article'));
    $off_twitter=intval(Storage::getInstance('emlog_tinymce')->getValue('off_twitter'));
    $off_page=intval(Storage::getInstance('emlog_tinymce')->getValue('off_page'));
    $imglink=intval(Storage::getInstance('emlog_tinymce')->getValue('imglink'));
    if(isset($_GET['suc'])): ?>
        <div class="alert alert-success">保存成功</div>
    <?php endif; ?>
    <form method="post" action="./plugin.php?plugin=<?php echo $fold; ?>&action=setting">
        <b>启用范围：</b>
        <br />
        <input name="off_article" type="checkbox" value="9" <?php if(!$off_article){echo 'checked';} ?> />文章
        <input name="off_twitter" type="checkbox" value="9" <?php if(!$off_twitter){echo 'checked';} ?> />微语
        <input name="off_page" type="checkbox" value="9" <?php if(!$off_page){echo 'checked';} ?> />页面
        <br />
        <hr />
        <b>原图链接：</b>
        <br />
        <input name="imglink" type="radio" value="0" <?php if($imglink==0){echo 'checked';} ?> />插入缩略图时
        <input name="imglink" type="radio" value="1" <?php if($imglink==1){echo 'checked';} ?> />总是
        <input name="imglink" type="radio" value="2" <?php if($imglink==2){echo 'checked';} ?> />禁用
        <br />
        <a href="./setting.php" target="_blank">后台上传设置开关缩略图</a>
        <br />
        <hr />
        <b>配置覆写：</b>
        <textarea name="options" style="width:100%;height:400px;padding:5px;"><?php 
            echo stripslashes(Storage::getInstance('emlog_tinymce')->getValue('options'))
        ?></textarea>
        <hr />
        <input
            type="button"
            onclick="if(confirm('如果崩了，清空配置，再次保存。')){submitForm(this.form);}"
            style="width:100px;max-width:50%;font-weight:bold;"
            value="保存"
        />
        <a href="https://www.tiny.cloud/" target="_blank">TinyMCE</a>
        </form>
<?php
}
function plugin_setting() {
    Storage::getInstance('emlog_tinymce')->setValue('off_article',Input::postIntVar('off_article')?0:9);
    Storage::getInstance('emlog_tinymce')->setValue('off_twitter',Input::postIntVar('off_twitter')?0:9);
    Storage::getInstance('emlog_tinymce')->setValue('off_page',Input::postIntVar('off_page')?0:9);
    Storage::getInstance('emlog_tinymce')->setValue('imglink',Input::postIntVar('imglink'));
    Storage::getInstance('emlog_tinymce')->setValue('options',Input::postStrVar('options'));
    Output::ok();
}