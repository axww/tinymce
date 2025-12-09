function emlog_tinymce_html(data) {
    data.use = null;
    let tail = data.source.substring(data.source.lastIndexOf('.'));
    if (data.act == 'image' || emlog_tinymce_image.indexOf(tail) >= 0) { data.use = 'image' }
    else if (data.act == 'video' || emlog_tinymce_video.indexOf(tail) >= 0) { data.use = 'video' }
    else if (data.act == 'audio' || emlog_tinymce_audio.indexOf(tail) >= 0) { data.use = 'audio' }
    if (data.act == 'file') { data.use = 'file' };
    switch (data.use) {
        case 'image':
            const slash = data.source.lastIndexOf('/') + 1;
            const known = data.source.slice(slash);
            if (known.startsWith('thum-')) {
                data.thumb = data.source;
                data.source = data.source.slice(0, slash) + known.substring(5);
            }
            const origin = !data.thumb || localStorage.getItem('emlog_tinymce_umod');
            const image = '<img src="' + (origin ? data.source : data.thumb) + '" alt="' + (data.alt || '') + '" />';
            if ((!emlog_tinymce_link && origin) || emlog_tinymce_link == 2) {
                return '<p>' + image + '</p>';
            } else {
                return '<p><a href="' + data.source + '" target="_blank">' + image + '</a></p>';
            }
        case 'video':
            return '<p><video controls="controls"><source src="' + data.source + '" /></video></p>';
        case 'audio':
            return '<p><audio controls="controls"><source src="' + data.source + '" /></audio></p>';
        default:
            return '<p><a href="' + data.source + '" target="_blank">' + (data.alt || data.source) + '</a></p>';
    };
};
function emlog_tinymce_recv(recv) {
    for (let obj of recv) {
        let tail = obj.name.substring(obj.name.lastIndexOf('.')).toLowerCase();
        let act;
        if (emlog_tinymce_image_use.indexOf(tail) >= 0) { act = 'image' }
        else if (emlog_tinymce_media_use.indexOf(tail) >= 0) { act = 'media' }
        else { act = 'file'; }
        emlog_tinymce_pool.push({
            act: act,
            now: "wait",
            source: obj,
            alt: obj.name
        });
        document.querySelector('#emlog_tinymce_list').insertAdjacentHTML('afterbegin', '<div style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a id="emlog_tinymce_file_' + (emlog_tinymce_pool.length - 1) + '" href="javascript:;" onclick="emlog_tinymce_stop(' + (emlog_tinymce_pool.length - 1) + ');">[等待]</a> [粘贴] ' + obj.name + '</div>');
        emlog_tinymce_info('rest', 1);
    };
    emlog_tinymce_deal(null)
};
function emlog_tinymce_pick(call, what, meta) {
    let show;
    switch (meta.filetype) {
        case 'image':
            show = '图片',
                accept = emlog_tinymce_image_use.join(',');
            break;
        case 'media':
            show = '媒体',
                accept = emlog_tinymce_media_use.join(',');
            break;
        case 'file':
            show = '文件',
                accept = emlog_tinymce_type.join(',');
            break;
        default:
            console.log('unknown_filetype');
            return;
    };
    emlog_tinymce_butt.setAttribute('accept', accept);
    emlog_tinymce_butt.setAttribute('type', 'file');
    emlog_tinymce_butt.setAttribute('multiple', 'multiple');
    emlog_tinymce_butt.onchange = function () {
        for (let obj of emlog_tinymce_butt.files) {
            emlog_tinymce_pool.push({
                act: meta.filetype,
                now: "wait",
                source: obj,
                alt: obj.name
            });
            document.querySelector('#emlog_tinymce_list').insertAdjacentHTML('afterbegin', '<div style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a id="emlog_tinymce_file_' + (emlog_tinymce_pool.length - 1) + '" href="javascript:;" onclick="emlog_tinymce_stop(' + (emlog_tinymce_pool.length - 1) + ');">[等待]</a> [' + show + '] ' + obj.name + '</div>')
        };
        if (emlog_tinymce_butt.files.length == 1) {
            emlog_tinymce_deal(emlog_tinymce_pool.length - 1, call)
        } else {
            tinymce.activeEditor.windowManager.close();
            emlog_tinymce_deal(null)
        };
        emlog_tinymce_info('rest', emlog_tinymce_butt.files.length);
        emlog_tinymce_butt.value = null
    };
    if (!document.querySelector('#emlog_tinymce_solo')) {
        document.querySelector('.tox-dialog__title').insertAdjacentHTML('beforeend', ' <a id="emlog_tinymce_solo" href="javascript:;" style="cursor:pointer;"></a>')
    };
    emlog_tinymce_butt.click()
};
function emlog_tinymce_deal(ikey, call) {
    if (ikey === null) {
        for (let key in emlog_tinymce_pool) {
            if (!emlog_tinymce_pool[key]) {
                continue
            };
            if (emlog_tinymce_pool[key].now == 'proc') {
                return
            };
            if (emlog_tinymce_pool[key].now == 'wait') {
                ikey = key;
                emlog_tinymce_pool[ikey].now = 'proc';
                break
            }
        }
    } else {
        emlog_tinymce_pool[ikey].now = 'solo';
    };
    if (ikey === null) {
        if (emlog_tinymce_into) {
            tinymce.activeEditor.selection.collapse();
            tinymce.activeEditor.insertContent(emlog_tinymce_into);
            emlog_tinymce_into = ''
        };
        return
    };
    emlog_tinymce_auth(emlog_tinymce_pool[ikey].source, ikey, call)
};
function emlog_tinymce_auth(file, ikey, call) {
    let solo = (emlog_tinymce_pool[ikey].now == 'solo');
    if (!emlog_tinymce_size) {
        emlog_tinymce_fail({
            "message": "auth"
        },
            ikey, solo, call);
        return
    };
    if (file.size > emlog_tinymce_size) {
        emlog_tinymce_fail({
            "message": "size"
        },
            ikey, solo, call);
        return
    };
    let tail = emlog_tinymce_pool[ikey].alt.substring(emlog_tinymce_pool[ikey].alt.lastIndexOf('.')).toLowerCase();
    switch (emlog_tinymce_pool[ikey].act) {
        case 'image':
            if (emlog_tinymce_image_use.indexOf(tail) < 0) {
                emlog_tinymce_fail({
                    "message": "type"
                },
                    ikey, solo, call);
                return
            };
            break;
        case 'media':
            if (emlog_tinymce_media_use.indexOf(tail) < 0) {
                emlog_tinymce_fail({
                    "message": "type"
                },
                    ikey, solo, call);
                return
            };
            break;
        default:
            if (emlog_tinymce_type.indexOf(tail) < 0) {
                emlog_tinymce_fail({
                    "message": "type"
                },
                    ikey, solo, call);
                return
            };
            break;
    };
    emlog_tinymce_save(file, ikey, call)
};
function emlog_tinymce_save(file, ikey, call) {
    let solo = (emlog_tinymce_pool[ikey].now == 'solo');
    let xhr = new XMLHttpRequest();
    emlog_tinymce_pool[ikey].xhr = xhr;
    xhr.open('POST', 'media.php?action=upload&editor=tinymce', true);
    xhr.onerror = function (e) {
        emlog_tinymce_fail({
            "message": "xhr"
        },
            ikey, solo, call)
    };
    xhr.upload.onprogress = function (e) {
        if (!e.lengthComputable) {
            return
        };
        let prog = parseInt(99 * e.loaded / e.total) + '%';
        if (solo && document.querySelector('#emlog_tinymce_solo')) {
            document.querySelector('#emlog_tinymce_solo').innerHTML = '<span style="color:darkorange;">[' + prog + ']</span>';
            document.querySelector('#emlog_tinymce_solo').setAttribute('onclick', 'emlog_tinymce_stop(' + ikey + ');')
        };
        document.querySelector('#emlog_tinymce_file_' + ikey).innerHTML = '<span style="color:darkorange;">[' + prog + ']</span>';
        emlog_tinymce_proc(false)
    };
    xhr.onreadystatechange = function (e) {
        if (this.readyState === 4 && this.status === 200) {
            delete emlog_tinymce_pool[ikey].xhr;
            let json = JSON.parse(this.responseText);
            if (json['success']) {
                emlog_tinymce_done(json, ikey, solo, call)
            } else {
                emlog_tinymce_fail(json, ikey, solo, call)
            }
        }
    };
    let data = new FormData();
    data.append('editormd-image-file', file.name ? file : new File([file], emlog_tinymce_pool[ikey].alt));
    xhr.send(data)
};
function emlog_tinymce_done(json, ikey, solo, call) {
    emlog_tinymce_pool[ikey].now = 'done';
    emlog_tinymce_pool[ikey].source = json['url'];
    emlog_tinymce_pool[ikey].thumb = json['file_info'].thum_file ? json['file_info'].thum_file : json['url'];
    emlog_tinymce_pool[ikey].alt = json['file_info'].file_name ? json['file_info'].file_name : '';
    if (solo && document.querySelector('#emlog_tinymce_solo')) {
        document.querySelector('#emlog_tinymce_solo').innerHTML = '<span style="color:green;">[完成]</span>';
        document.querySelector('#emlog_tinymce_solo').removeAttribute('onclick');
        if (call) {
            call((emlog_tinymce_pool[ikey].act == 'image' && !localStorage.getItem('emlog_tinymce_umod')) ? emlog_tinymce_pool[ikey].thumb : emlog_tinymce_pool[ikey].source, {
                text: emlog_tinymce_pool[ikey].alt,
                alt: emlog_tinymce_pool[ikey].alt
            })
        }
    } else {
        emlog_tinymce_into += emlog_tinymce_html({
            act: emlog_tinymce_pool[ikey].act,
            source: emlog_tinymce_pool[ikey].source,
            thumb: emlog_tinymce_pool[ikey].thumb,
            text: emlog_tinymce_pool[ikey].alt,
            alt: emlog_tinymce_pool[ikey].alt
        })
    };
    document.querySelector('#emlog_tinymce_file_' + ikey).innerHTML = '<span style="color:green;">[完成]</span>';
    document.querySelector('#emlog_tinymce_file_' + ikey).setAttribute('onclick', 'emlog_tinymce_exec(' + ikey + ');');
    emlog_tinymce_info('done', 1);
    emlog_tinymce_proc(true);
    if (!solo) {
        emlog_tinymce_deal(null)
    }
};
function emlog_tinymce_fail(json, ikey, solo, call) {
    emlog_tinymce_pool[ikey].now = json['message'];
    if (solo && document.querySelector('#emlog_tinymce_solo')) {
        document.querySelector('#emlog_tinymce_solo').innerHTML = '<span style="color:red;">[错误]</span>';
        document.querySelector('#emlog_tinymce_solo').setAttribute('onclick', 'emlog_tinymce_exec(' + ikey + ');')
    };
    delete emlog_tinymce_pool[ikey].source;
    document.querySelector('#emlog_tinymce_file_' + ikey).innerHTML = '<span style="color:red;">[错误]</span>';
    document.querySelector('#emlog_tinymce_file_' + ikey).setAttribute('onclick', 'emlog_tinymce_exec(' + ikey + ');');
    emlog_tinymce_info('fail', 1);
    emlog_tinymce_proc(true);
    if (!solo) { emlog_tinymce_deal(null); };
};
function emlog_tinymce_stop(ikey) {
    tinymce.activeEditor.windowManager.confirm((ikey === null) ? '停止队列？' : '删除任务？',
        function (yes) {
            if (!yes) { return; };
            if (ikey === null) {
                for (let key in emlog_tinymce_pool) {
                    if (!emlog_tinymce_pool[key].xhr) { continue; };
                    emlog_tinymce_pool[key].xhr.abort();
                    delete emlog_tinymce_pool[key].xhr;
                    emlog_tinymce_pool[key].now = 'wait';
                    document.querySelector('#emlog_tinymce_file_' + key).innerHTML = '<span style="color:blue;">[等待]</span>';
                };
                emlog_tinymce_proc(true);
            } else {
                let proc = false;
                if (emlog_tinymce_pool[ikey].xhr) {
                    if (emlog_tinymce_pool[ikey].now == 'proc') {
                        proc = true;
                    };
                    emlog_tinymce_pool[ikey].xhr.abort();
                };
                delete emlog_tinymce_pool[ikey];
                emlog_tinymce_info('rest', -1);
                document.querySelector('#emlog_tinymce_file_' + ikey).parentNode.innerHTML = '';
                if (document.querySelector('#emlog_tinymce_solo')) {
                    document.querySelector('#emlog_tinymce_solo').innerHTML = '';
                    document.querySelector('#emlog_tinymce_solo').removeAttribute('onclick');
                };
                emlog_tinymce_proc(true);
                if (proc) { emlog_tinymce_deal(null); };
            }
        })
};
function emlog_tinymce_exec(ikey) {
    switch (emlog_tinymce_pool[ikey].now) {
        case 'done':
            tinymce.activeEditor.selection.collapse();
            tinymce.activeEditor.insertContent(emlog_tinymce_html({
                act: emlog_tinymce_pool[ikey].act,
                source: emlog_tinymce_pool[ikey].source,
                thumb: emlog_tinymce_pool[ikey].thumb,
                text: emlog_tinymce_pool[ikey].alt,
                alt: emlog_tinymce_pool[ikey].alt
            }));
            break;
        case 'auth':
            tinymce.activeEditor.windowManager.alert('无权使用插件');
            break;
        case 'size':
            tinymce.activeEditor.windowManager.alert('文件大小超限');
            break;
        case 'type':
            tinymce.activeEditor.windowManager.alert('文件类型禁止');
            break;
        case 'xhr':
            tinymce.activeEditor.windowManager.alert('网络请求失败');
            break;
        default:
            tinymce.activeEditor.windowManager.alert(emlog_tinymce_pool[ikey].now);
            break;
    }
};
function emlog_tinymce_info(mode, qnty) {
    document.querySelector('#emlog_tinymce_info_' + mode).innerHTML = parseInt(document.querySelector('#emlog_tinymce_info_' + mode).innerHTML) + qnty;
    if (mode != 'rest') { emlog_tinymce_info('rest', -1); }
};
function emlog_tinymce_proc(stop) {
    document.querySelector('#emlog_tinymce_proc').innerHTML = stop ? '开始' : '停止';
    document.querySelector('#emlog_tinymce_proc').setAttribute('onclick', stop ? 'emlog_tinymce_deal(null);' : 'emlog_tinymce_stop(null);');
};
function emlog_tinymce_umod(that) {
    if (localStorage.getItem('emlog_tinymce_umod')) {
        localStorage.removeItem('emlog_tinymce_umod');
        that.style.textDecoration = '';
        that.style.fontWeight = '';
    } else {
        localStorage.setItem('emlog_tinymce_umod', 'origin');
        that.style.textDecoration = 'underline';
        that.style.fontWeight = 'bold';
    }
};
function emlog_tinymce_list() {
    document.querySelector('#emlog_tinymce_list').style.display = (document.querySelector('#emlog_tinymce_list').style.display == 'none') ? '' : 'none';
};
function emlog_tinymce_init(core, lang) {
    if (emlog_tinymce_load) { return; };
    emlog_tinymce_load = true;
    let item = document.createElement("script");
    item.src = core;
    item.onload = function () {
        tinymce.init(Object.assign({
            license_key: 'GPL',
            base_url: core.substring(0, core.lastIndexOf("/")),
            language_url: lang,
            language: 'zh_CN',
            height: 560,
            selector: 'textarea.useTinyMCE',
            relative_urls: false,
            remove_script_host: true,
            plugins: 'advlist code codesample image link lists media table wordcount',
            toolbar: 'bold italic underline strikethrough forecolor backcolor fontsize image media link unlink codesample hr styles numlist bullist table removeformat undo redo code',
            content_style: '*:not(table){max-width:100%;}body{color:#333;font-size:15px;}img{height:auto;}',
            font_size_formats: '12px 14px 15px 16px 18px 36px 72px',
            toolbar_mode: 'wrap',
            mobile: { toolbar_mode: 'wrap' },
            resize: true,
            menubar: false,
            branding: false,
            contextmenu: false,
            elementpath: false,
            smart_paste: false,
            text_patterns: false,
            sandbox_iframes: false,
            allow_script_urls: true,
            link_default_target: '_blank',
            table_default_styles: { 'border-collapse': 'collapse', 'display': 'table', 'width': '100%' },
            paste_postprocess: function (plugin, args) {
                for (let row of args.node.getElementsByTagName("a")) { row.target = "_blank"; }
            },
            file_picker_types:
                (emlog_tinymce_image_use.length ? 'image ' : '') +
                (emlog_tinymce_media_use.length ? 'media ' : '') +
                (emlog_tinymce_type.length ? 'file ' : '') +
                'emlog'
            ,
            file_picker_callback: emlog_tinymce_pick,
            image_uploadtab: false,
            media_alt_source: false,
            media_poster: false,
            media_url_resolver: (data) => {
                return new Promise((resolve) => {
                    let u;
                    let t;
                    let douyin = data.url.match(/^https?:\/\/(?:www|m)\.(?:ies)?douyin\.com\/(?:share\/)?video\/(\d+)/i);
                    let douyin_m = data.url.match(/^https?:\/\/(?:www|m)\.(?:ies)?douyin\.com\/[\w]+\?modal_id=(\d+)/i);
                    let acfun = data.url.match(/^https?:\/\/www\.acfun\.cn\/v\/ac(\d+)/i);
                    let acfun_m = data.url.match(/^https?:\/\/m\.acfun\.cn\/v\/\?ac=(\d+)/i);
                    let bv = data.url.match(/^BV(\w+)/i);
                    let bilibili = data.url.match(/^https?:\/\/(?:www|m)\.bilibili\.com\/video\/BV(\w+)/i);
                    let bilibili_av = data.url.match(/^https?:\/\/(?:www|m)\.bilibili\.com\/video\/av(\w+)/i);
                    let youku = data.url.match(/^https?:\/\/(?:v|m)\.youku\.com\/(?:v_show|video)\/id_([\w\-\=]+)/i);
                    let sohu = data.url.match(/^https?:\/\/tv\.sohu\.com\/v\/([\w\-\=]+)\.html(?:\?vid=(\d+))?/i);
                    let sohu_m = data.url.match(/^https?:\/\/m\.tv\.sohu\.com\/u\/vw\/([\d]+)/i);
                    let qq = data.url.match(/^https?:\/\/v\.qq\.com\/x\/(?:cover|page)\/.+?\/(\w+)\.html/i);
                    let qq_m = data.url.match(/^https?:\/\/m\.v\.qq\.com\/.*?vid=(\w+)/i);
                    let music163_0 = data.url.match(/^https?:\/\/(?:y\.)?music\.163\.com\/(?:m|\#)\/playlist\?id=(\d+)/i);
                    let music163_1 = data.url.match(/^https?:\/\/(?:y\.)?music\.163\.com\/(?:m|\#)\/album\?id=(\d+)/i);
                    let music163_2 = data.url.match(/^https?:\/\/(?:y\.)?music\.163\.com\/(?:m|\#)\/song\?id=(\d+)/i);
                    if (douyin) { u = 'https://www.douyin.com/light/' + douyin[1]; }
                    else if (douyin_m) { u = 'https://www.douyin.com/light/' + douyin_m[1]; }
                    else if (acfun) { u = 'https://www.acfun.cn/player/ac' + acfun[1]; }
                    else if (acfun_m) { u = 'https://www.acfun.cn/player/ac' + acfun_m[1]; }
                    else if (bv) { u = 'https://player.bilibili.com/player.html?bvid=BV' + bv[1]; }
                    else if (bilibili) { u = 'https://player.bilibili.com/player.html?bvid=BV' + bilibili[1]; }
                    else if (bilibili_av) { u = 'https://player.bilibili.com/player.html?aid=' + bilibili_av[1]; }
                    else if (youku) { u = 'https://player.youku.com/embed/' + youku[1]; }
                    else if (sohu) {
                        let bid = atob(sohu[1]).match(/^us\/\d+\/(\d+)/i);
                        if (bid) { u = 'https://tv.sohu.com/s/sohuplayer/iplay.html?bid=' + bid[1]; }
                        else if (sohu[2]) { u = 'https://tv.sohu.com/s/sohuplayer/iplay.html?vid=' + sohu[2]; }
                    }
                    else if (sohu_m) { u = 'https://tv.sohu.com/s/sohuplayer/iplay.html?bid=' + sohu_m[1]; }
                    else if (qq) { u = 'https://v.qq.com/txp/iframe/player.html?vid=' + qq[1]; }
                    else if (qq_m) { u = 'https://v.qq.com/txp/iframe/player.html?vid=' + qq_m[1]; }
                    else if (music163_0) { u = 'https://music.163.com/outchain/player?type=0&id=' + music163_0[1]; t = 'm'; }
                    else if (music163_1) { u = 'https://music.163.com/outchain/player?type=1&id=' + music163_1[1]; t = 'm'; }
                    else if (music163_2) { u = 'https://music.163.com/outchain/player?type=2&id=' + music163_2[1]; t = 'a'; }
                    if (u && !t) { t = 'v'; }
                    switch (t) {
                        case 'v': resolve({ html: '<iframe src="' + u + '" width="680" height="460"></iframe>' }); break;
                        case 'm': resolve({ html: '<iframe src="' + u + '" width="400" height="600"></iframe>' }); break;
                        case 'a': resolve({ html: '<iframe src="' + u + '" width="400"></iframe>' }); break;
                        default: resolve({ html: '' }); break;
                    }
                });
            },
            video_template_callback: emlog_tinymce_html,
            audio_template_callback: emlog_tinymce_html,
            init_instance_callback: function (editor) {
                editor.on('BeforeSetContent',
                    function (e) {
                        if (!e.set && !e.paste) { return; };
                        let match = e.content.match(/<img(.*?)src="(.*?)(\/content\/uploadfile\/\d{6}\/)(?:thum\-)?([\dA-Za-z]+\.[\dA-Za-z]+)"(.*?)>/);
                        if (!match || ['..', location.href.slice(0, location.href.lastIndexOf('/admin/')), location.pathname.slice(0, location.pathname.lastIndexOf('/admin/'))].indexOf(match[2]) < 0) { return; };
                        e.content = localStorage.getItem('emlog_tinymce_umod') ? '<img' + match[1] + 'src="' + match[2] + match[3] + match[4] + '"' + match[5] + '>' : '<a href="' + match[2] + match[3] + match[4] + '" target="_blank">' + e.content + '</a>';
                    })
            },
            setup: function (editor) {
                editor.on('input',
                    function () {
                        editor.save();
                    });
                editor.on('paste',
                    function (e) {
                        if (!e.clipboardData.files || !e.clipboardData.files.length) { return; }
                        e.preventDefault();
                        e.stopPropagation();
                        emlog_tinymce_recv(e.clipboardData.files);
                    });
                editor.on('change',
                    function () {
                        editor.save();
                    });
                editor.on('drop',
                    function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    });
                editor.on('keydown',
                    function (e) {
                        if (!e.ctrlKey || e.keyCode != 13) {
                            return;
                        };
                        e.preventDefault();
                        e.stopPropagation();
                        if (document.getElementById('savedf')) {
                            document.getElementById('savedf').click();
                        } else if (document.querySelector('input[type="submit"]')) {
                            document.querySelector('input[type="submit"]').click();
                        } else if (document.querySelector('button[type="submit"]')) {
                            document.querySelector('button[type="submit"]').click();
                        }
                    });
                editor.on('load',
                    function () {
                        document.querySelectorAll('.tox-editor-header').forEach(dom => dom.style.padding = 0);
                        if (!document.querySelector('#emlog_tinymce_info')) {
                            document.querySelector('.tox-statusbar__text-container').style.cssText = 'position:relative;top:-2px;overflow:visible;'
                            document.querySelector('.tox-statusbar__text-container').insertAdjacentHTML('afterbegin', '<span id="emlog_tinymce_info" style="display:flex;flex:1 1 auto;"><a href="javascript:;" onclick="emlog_tinymce_list();"><span id="emlog_tinymce_info_rest" style="color:blue;">0</span>&nbsp;/&nbsp;<span id="emlog_tinymce_info_done" style="color:green;">0</span>&nbsp;/&nbsp;<span id="emlog_tinymce_info_fail" style="color:red;">0</span></a>&nbsp;&nbsp;<a id="emlog_tinymce_proc" href="javascript:;" style="color:darkorange;"></a></span><span style="display:flex;flex:0 0 auto;"><a href="javascript:;" onclick="emlog_tinymce_umod(this);" ' + (localStorage.getItem('emlog_tinymce_umod') ? 'style="text-decoration:underline;font-weight:bold;"' : '') + '>原图</a></span>')
                        };
                        if (!document.querySelector('#emlog_tinymce_list')) {
                            document.querySelector('.tox-tinymce').insertAdjacentHTML('afterend', '<div id="emlog_tinymce_list" style="margin-top:-1px;padding:2px 8px;border:1px solid #ccc;background:#FFF;color:rgba(34,47,62,.7);font-size:12px;max-height:112px;overflow-y:scroll;display:none;"></div>')
                        };
                        let stail = document.styleSheets[document.styleSheets.length - 1];
                        stail.insertRule('body img[style*="visibility: hidden"]:last-child {max-width:none !important;}', stail.cssRules.length - 1);
                    });
                editor.on('ExecCommand', (e) => {
                    if (e.command === 'mceMedia') {
                        document.querySelector('.tox-dialog__body-nav').style.display = 'none';
                    };
                });
            }
        }, emlog_tinymce_conf));
    };
    document.body.appendChild(item);
};
let emlog_tinymce_image = ['.gif', '.jpg', '.jpeg', '.jpe', '.jif', '.jfif', '.pjp', '.pjpeg', '.png', '.apng', '.bmp', '.dib', '.ico', '.cur', '.webp', '.heif', '.heic', '.avif', '.tiff', '.svg', '.eps', '.psd', '.jxl', '.jxr', '.wdp', '.hdp'];
let emlog_tinymce_video = ['.mp4', '.m4v', '.m4p', '.mp4v', '.wmv', '.mov', '.qtm', '.qt', '.ogv', '.ogg', '.webm', '.mpg', '.mpeg', '.3gp', '.hevc', '.av1', '.ts', '.mts', '.m2ts'];
let emlog_tinymce_audio = ['.m4a', '.mp4a', '.wma', '.aac', '.adts', '.oga', '.weba', '.wav', '.mp3', '.flac'];
let emlog_tinymce_image_use = emlog_tinymce_image.filter(function (val) {
    return emlog_tinymce_type.indexOf(val) >= 0;
});
let emlog_tinymce_media_use = emlog_tinymce_video.concat(emlog_tinymce_audio).filter(function (val) {
    return emlog_tinymce_type.indexOf(val) >= 0;
});
let emlog_tinymce_butt = document.createElement('input');
let emlog_tinymce_pool = [];
let emlog_tinymce_into = '';
let emlog_tinymce_load = false;