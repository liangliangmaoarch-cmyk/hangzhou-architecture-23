(function () {
  'use strict';
  const album = window.ALBUM;
  const notes = window.PROJECT_NOTES || {};
  const context = window.PROJECT_CONTEXT || {};
  const main = document.getElementById('content');
  const viewer = document.getElementById('viewer');
  const allPhotos = [...album.photos, ...window.FIELDWORK.photos, ...window.CARD_PHOTOS];
  const photos = new Map(allPhotos.map(photo => [photo.id, photo]));
  const films = window.CARD_FILMS;
  const days = ['11-02','11-03','11-04','11-05','11-06','11-07'];
  const projects = new Map(album.projects.map(project => [project.id, project]));
  const categories = new Map(album.categories.map(category => [category.id, category.name]));
  const corporate = ['ZY', 'GOA'];
  const architecture = album.projects.filter(project => !corporate.includes(project.id));
  const projectPhotos = new Map(album.projects.map(project => [project.id, []]));
  allPhotos.forEach(photo => projectPhotos.get(photo.project).push(photo));
  const exchangeOrder = {
    ZY: ['P475','P473','P481','D0688','D0690','D0692','P477','P474'],
    GOA: ['P511','D0754','D0757','P509','P515','P513','P510','D0764','D0770','P516']
  };
  for (const [code, ids] of Object.entries(exchangeOrder)) {
    const position = new Map(ids.map((id, n) => [id, n]));
    projectPhotos.get(code).sort((a, b) => (position.get(a.id) ?? ids.length) - (position.get(b.id) ?? ids.length));
  }
  const covers = { LJM:'P437', VER:'P404', DESIGN:'P487', GRAN:'P499', WATER:'P490', STEEL:'P352', GOA:'P511', ZY:'P475' };
  const chapters = {
    '01':'从门厅进入展厅，再沿檐廊走向水院，观察展陈与参观路线如何衔接。',
    '02':'沿校园的连廊、楼梯和庭院，观察教学空间之间的步行联系。',
    '03':'从入口广场到会议空间，观察大屋盖、柱列与集会人流的关系。',
    '04':'从场地与看台的相对位置，观察体育建筑的尺度和进出路径。',
    '05':'沿街的书店、商业街区与办公园区，呈现了三种不同的日常使用方式。',
    '06':'从台阶走到山墙下，再靠近屋面，观察入口、材料与光线。',
    '07':'沿着水边和坡道进入木屋盖下，观察停留空间与院落的关系。',
    '08':'沿旧铁轨、输送廊和滨水步道，辨认原有工业设施与新游线。',
    '09':'从水巷、街市到开敞湖岸，观察沿水而行时不断变化的视线。',
    '10':'这组资料保留了红砖立面、庭院、模型与人物活动等现场线索。'
  };
  const rolls = [
    {day:'11-02', title:'良渚', subtitle:'校园、水院与山墙', accent:'#a9c5dc', frames:['D0535','D0552','D0558','D0560','P501','P504','P499','D0540']},
    {day:'11-03', title:'版本馆与象山', subtitle:'青瓷屏扇与木屋盖', accent:'#d1bda0', frames:['P437','D0619','P404','D0633','P487','P491','D0662','D0669']},
    {day:'11-04', title:'建筑学长', subtitle:'设计演示与湿地展厅', accent:'#d09aa6', frames:['D0688','D0690','D0692','P448','D0698','P482','D0705','D0716']},
    {day:'11-05', title:'宁波', subtitle:'瓦爿墙、会展与江岸', accent:'#d7bc7e', frames:['P415','P418','D0727','D0730','D0739','D0740','P036','P421']},
    {day:'11-06', title:'西湖与 goa', subtitle:'湖岸步行与圆桌问答', accent:'#a5bb91', frames:['D0743','D0747','P335','P462','D0754','D0757','D0764','D0770']},
    {day:'11-07', title:'杭钢与紫金港', subtitle:'旧厂区与校园步道', accent:'#d39781', frames:['D0779','D0782','D0784','P463','P337','P430','P465','P467']}
  ];
  const archiveTitle = '建筑23级杭州认识实习';
  const localKey = 'hz-architecture-23-photo-picks-v1';
  let picks = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(localKey) || '[]');
    if (Array.isArray(saved)) picks = new Set(saved.filter(id => photos.has(id)));
  } catch (_) {}
  let readerPhotos = [];
  let readerIndex = 0;
  let atlasCategory = '';
  let searchText = '';
  let galleryIds = [];
  let viewerIds = [];
  let viewerIndex = 0;
  let activePage = 'home';
  let focusAfterClose = null;
  let storageAvailable = true;
  let pageTransition = null;

  const $ = id => document.getElementById(id);
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, char =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
  const asset = (id, small) => 'media/' + (small ? 't/' : '') + id + '.webp';
  const coverAsset = id => 'media/covers/' + id + '.webp';
  const reduceMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  const annotation = photo => notes[photo.project]?.frames?.[photo.id] || '';
  const projectUrl = code => '#/project/' + encodeURIComponent(code);
  const projectTitle = project => ({ZY:'建筑学长 · 智元空间',GOA:'goa 大象设计'})[project.id] || project.name;
  const cover = project => photos.get(covers[project.id]) || projectPhotos.get(project.id)[0];
  const chapterLabel = project => corporate.includes(project.id) ? '企业交流' : categories.get(project.category);
  const countText = number => number + ' 张';
  const pad = number => String(number).padStart(2,'0');
  const dayLabel = day => Number(day.slice(0,2)) + '月' + Number(day.slice(3)) + '日';
  const arrow = '<b aria-hidden="true">↗</b>';
  const link = (url,label) => '<a class="link" href="' + escape(url) + '">' + escape(label) + ' ' + arrow + '</a>';
  const titleOf = name => { document.title = name ? name + ' · ' + archiveTitle : archiveTitle; };

  function responsiveSources(photo, sizes, largeCard = false) {
    const full = asset(photo.id);
    const preview = largeCard && photo.coverWidth ? coverAsset(photo.id) : asset(photo.id, true);
    const previewWidth = largeCard && photo.coverWidth ? photo.coverWidth : photo.thumbWidth;
    if (!previewWidth || previewWidth >= photo.width) return ' src="' + full + '"';
    return ' src="' + (largeCard ? full : preview) + '" srcset="' + preview + ' ' + previewWidth + 'w, ' +
      full + ' ' + photo.width + 'w" sizes="' + sizes + '"';
  }

  function setFrameImage(image, photo, direction, label) {
    image.alt = label;
    if (image.dataset.frame === photo.id) return;
    image.dataset.frame = photo.id;
    image.onload = null;
    image.getAnimations?.().forEach(animation => animation.cancel());
    if (direction && !reduceMotion() && image.animate) {
      const enter = () => {
        if (image.dataset.frame !== photo.id) return;
        image.onload = null;
        image.animate([{opacity:0.55, transform:'translateX(' + 18 * Math.sign(direction) + 'px)'},
          {opacity:1, transform:'translateX(0)'}], {duration:240,easing:'cubic-bezier(.22,.68,.18,1)'});
      };
      image.onload = enter;
    }
    image.src = asset(photo.id);
    if (image.complete && image.naturalWidth && image.onload) image.onload();
  }

  function showAnnotation(element, photo) {
    const comment = annotation(photo);
    element.textContent = comment;
    element.hidden = !comment;
  }

  function crumb(section, url) {
    return '<div class="crumb"><a href="#/">首页</a><span class="slash" aria-hidden="true">/</span>' +
      (url ? '<a href="' + escape(url) + '">' + escape(section) + '</a>' : '<span>' + escape(section) + '</span>') + '</div>';
  }

  function projectCard(project, options) {
    const opts = options || {};
    const photo = cover(project);
    const name = projectTitle(project);
    const group = projectPhotos.get(project.id);
    const tag = opts.corporate ? (project.id === 'ZY' ? '建筑学长企业交流' : '设计机构参访') : chapterLabel(project);
    const sizes = opts.corporate ? '(max-width: 600px) 94vw, (max-width: 1650px) 48vw, 755px' :
      (opts.wide ? '(max-width: 900px) 95vw, ' : '(max-width: 600px) 95vw, (max-width: 900px) 48vw, ') +
      '(max-width: 1650px) 32vw, 505px';
    const comment = annotation(photo) || notes[project.id].focus;
    return '<a class="project-card" href="' + projectUrl(project.id) + '">' +
      '<div class="card-image"><img loading="lazy" decoding="async"' + responsiveSources(photo,sizes,true) + ' alt="' +
        escape(name + '，' + photo.caption) + '" width="' + photo.width + '" height="' + photo.height + '"></div>' +
      '<div class="card-kicker"><span>' + escape(tag) + '</span><span class="card-n">' + countText(group.length) + '</span></div>' +
      '<h3><span>' + escape(name) + '</span><span class="card-arrow" aria-hidden="true">↗</span></h3>' +
      (opts.focus ? '<p class="card-focus">' + escape(comment) + '</p>' : '') + '</a>';
  }

  function corporateCards() {
    return '<div class="card-grid pair">' + corporate.map(id => projectCard(projects.get(id), {focus:true, corporate:true})).join('') + '</div>';
  }

  function rollIndex() {
    const strips = rolls.map((roll, n) => {
      const url = '#/days/' + roll.day;
      const stills = roll.frames.map(id => {
        const photo = photos.get(id);
        return '<a class="film-frame" href="' + url + '/' + id + '" aria-label="' + escape(dayLabel(roll.day) + '，' + photo.caption) +
          '"><img src="' + asset(id,true) + '" loading="' + (n < 3 ? 'eager' : 'lazy') + '" decoding="async" alt=""></a>';
      }).join('');
      return '<div class="roll-row" style="--roll-accent:' + roll.accent + '"><a class="roll-heading" href="' + url + '">' +
        '<span class="roll-no">' + pad(n+1) + '</span><strong>' + escape(roll.title) + '</strong><span class="roll-day">' + dayLabel(roll.day) +
        '</span></a><div class="film-strip">' + stills + '</div></div>';
    }).join('');
    return '<section class="roll-cover" aria-label="六天实习胶卷"><div class="wrap roll-layout">' +
      '<header class="roll-intro"><div class="roll-edition">建筑23级 <span>2026.11.02 — 11.07</span></div>' +
      '<h1 class="roll-title"><span class="roll-en" lang="en">HANGZHOU</span><span class="roll-en outline" lang="en">ROLLS</span><span class="roll-zh">杭州认识实习</span></h1>' +
      '<p class="roll-summary">沿六天的胶卷，穿过良渚的水院、象山的檐廊，走进建筑师的会议室。</p>' +
      '<div class="roll-links"><a href="#/atlas">建筑参观 <span>' + architecture.length + ' 组</span></a><a href="#/exchange">企业交流 <span>2 场</span></a></div>' +
      '<p class="roll-stats">' + photos.size + ' 张照片　/　' + films.length + ' 段短片</p></header>' +
      '<div class="roll-board"><div class="roll-instruction"><span>六日胶卷</span><span>选一天，或点一帧进入</span></div>' + strips + '</div></div></section>';
  }

  function home() {
    titleOf('');
    main.innerHTML = rollIndex() +
      '<section class="section"><div class="wrap"><div class="section-head"><div><h2>建筑参观</h2>' +
      '<p class="section-sub">在良渚博物院看水院，在水岸山居看木屋架，在杭钢公园沿旧输送廊步行。</p></div>' +
      link('#/atlas','全部项目') + '</div><div class="card-grid home-grid">' +
      ['LJM','WATER','STEEL'].map((id,i) => projectCard(projects.get(id),{focus:true,wide:i===2})).join('') +
      '</div></div></section><section class="section exchange-home"><div class="wrap"><div class="section-head"><div><h2>企业交流</h2>' +
      '<p class="section-sub">走进建筑学长的 AI 讲座，围坐在 goa 大象设计的会议桌旁。</p></div>' +
      link('#/exchange','查看两场交流') + '</div>' + corporateCards() + '</div></section>';
  }

  function atlas() {
    titleOf('建筑参观');
    main.innerHTML = '<div class="wrap"><header class="page-top">' + crumb('建筑参观') +
      '<h1 class="page-title">建筑参观</h1><p class="page-lead">按建筑类型浏览实习照片。每个项目都附有现场介绍、观察重点和完整的精选相册。</p></header>' +
      '<div class="atlas-tools"><label class="search-label"><span>搜索项目</span><input id="atlas-search" type="search" autocomplete="off" placeholder="建筑名称、现场细节或照片编号" value="' + escape(searchText) + '"></label>' +
      '<div class="filters" id="filters" aria-label="建筑类型"></div></div><section class="catalogue" aria-label="项目索引">' +
      '<p class="results-note" id="atlas-count" role="status"></p><div class="card-grid" id="atlas-cards"></div></section></div>';
    $('filters').innerHTML = [['','全部类型'],...categories.entries()].map(pair =>
      '<button type="button" data-category="' + pair[0] + '" aria-pressed="' + (pair[0] === atlasCategory) + '">' + escape(pair[1]) + '</button>').join('');
    updateAtlas();
    $('atlas-search').addEventListener('input', event => { searchText = event.target.value; updateAtlas(); });
  }

  function updateAtlas() {
    const words = searchText.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const results = architecture.filter(project => {
      if (atlasCategory && project.category !== atlasCategory) return false;
      const searchable = [project.name, categories.get(project.category), notes[project.id].focus, notes[project.id].intro,
        ...projectPhotos.get(project.id).map(p => p.id + ' ' + p.caption)].join(' ').toLowerCase();
      return words.every(word => searchable.includes(word));
    });
    $('atlas-count').textContent = results.length + ' 组相册 · ' + countText(results.reduce((n,p) => n + projectPhotos.get(p.id).length, 0)) +
      '照片' + (atlasCategory ? '　' + chapters[atlasCategory] : '');
    $('atlas-cards').innerHTML = results.length ? results.map(p => projectCard(p)).join('') :
      '<div class="empty"><strong>没有找到匹配的项目</strong><p>可更换关键词，或恢复全部类型。</p><button type="button" class="btn" data-reset>清除筛选</button></div>';
  }

  function exchange() {
    titleOf('企业交流');
    main.innerHTML = '<div class="wrap exchange-list"><header class="page-top">' + crumb('企业交流') +
      '<h1 class="page-title">企业交流</h1><p class="page-lead">建筑23级同学走进两家企业。智元空间的参访记录了“建筑学长”的讲座和办公现场，goa 大象设计的相册沿着圆桌，记录分享、倾听和讨论。</p></header>' +
      corporateCards() + '</div>';
  }

  function photoGrid(list, showPlace = false) {
    galleryIds = list.map(photo => photo.id);
    return '<div class="photo-grid">' + list.map((photo,index) => {
      const picked = picks.has(photo.id);
      return '<figure class="photo-tile"><button class="photo-open" type="button" data-photo="' + photo.id +
        '" aria-label="查看大图，' + escape(photo.caption) + '"><img' +
        responsiveSources(photo,'(max-width: 600px) 47vw, (max-width: 900px) 48vw, (max-width: 1650px) 32vw, 505px') + ' alt="' + escape(photo.caption) +
        '" width="' + photo.width + '" height="' + photo.height + '" loading="' + (index < 3 ? 'eager' : 'lazy') + '" decoding="async"></button>' +
        '<figcaption class="photo-text"><span>' + (showPlace ? '<span class="photo-place">' + escape(photo.time + ' · ' + projectTitle(projects.get(photo.project))) + '</span>' : '') +
        '<span class="photo-index">' + photo.id + '</span>' + escape(photo.caption) + '</span>' +
        '<button class="save" type="button" data-pick="' + photo.id + '" aria-pressed="' + picked + '" aria-label="' +
        (picked ? '移出选片' : '加入选片') + '，' + escape(photo.caption) + '">' + (picked ? '★' : '☆') + '</button></figcaption></figure>';
    }).join('') + '</div>';
  }

  function chapterReader(list, title, theme, firstId, accent) {
    if (!list.length) return '';
    readerPhotos = list;
    readerIndex = Math.max(0,list.findIndex(p => p.id === firstId));
    const buttons = list.map((p,n) => '<button type="button" data-read-index="' + n + '" aria-label="第 ' +
      (n+1) + ' 张，' + escape(p.caption) + '">' + pad(n+1) + '</button>').join('');
    return '<section id="roll-reader" class="roll-reader" style="--roll-accent:' + accent + '" tabindex="0" aria-label="' + escape(title + '胶卷') + '">' +
      '<aside class="reader-spine"><p class="reader-label">现场胶卷</p><h3>' + escape(title) + '</h3><p class="reader-theme">' + escape(theme) +
      '</p><div class="frame-jumps" aria-label="按编号选择照片">' + buttons + '</div></aside>' +
      '<div class="reader-main"><div class="reader-stage"><button type="button" class="read-arrow" data-read-step="-1" aria-label="胶卷上一张">‹</button>' +
      '<button id="reader-open" class="reader-open" type="button"><img id="reader-image" alt=""></button>' +
      '<button type="button" class="read-arrow" data-read-step="1" aria-label="胶卷下一张">›</button></div>' +
      '<div class="reader-caption" aria-live="polite"><span id="reader-count"></span><span id="reader-caption"></span></div>' +
      '<div class="reader-track"><span id="reader-progress"></span></div><p class="frame-note" id="reader-note" aria-label="现场批注" hidden></p></div></section>';
  }

  function showReader(index, direction = 0) {
    if (!readerPhotos.length || !$('reader-image')) return;
    readerIndex = (index + readerPhotos.length) % readerPhotos.length;
    const p = readerPhotos[readerIndex];
    setFrameImage($('reader-image'),p,direction,p.caption);
    showAnnotation($('reader-note'),p);
    $('reader-open').dataset.photo = p.id;
    $('reader-open').setAttribute('aria-label','查看大图，' + p.caption);
    $('reader-caption').textContent = p.caption;
    $('reader-count').textContent = pad(readerIndex+1) + ' / ' + pad(readerPhotos.length);
    $('reader-progress').style.width = ((readerIndex+1) / readerPhotos.length * 100) + '%';
    $('roll-reader').querySelectorAll('[data-read-index]').forEach((button,n) => button.setAttribute('aria-pressed',String(n === readerIndex)));
    $('roll-reader').querySelectorAll('[data-read-step]').forEach(button => { button.hidden = readerPhotos.length === 1; });
  }

  function filmGallery(list) {
    if (!list.length) return '';
    return '<section class="film-block" aria-label="现场短片"><div class="gallery-heading"><h2>现场短片</h2><span>' + list.length + ' 段</span></div>' +
      '<div class="film-grid">' + list.map(film => {
        const path = 'media/films/' + film.id;
        return '<figure><video controls playsinline preload="none" poster="' + path + '.webp" aria-label="' + escape(film.title) +
          '"><source src="' + path + '.mp4" type="video/mp4"></video><figcaption><strong>' + escape(film.title) + '</strong>' +
          '<p>' + escape(dayLabel(film.day) + ' ' + film.time + ' · ' + film.duration) + '　<a download href="' + path + '.mp4">下载短片</a></p></figcaption></figure>';
      }).join('') + '</div></section>';
  }

  function diary(requestedDay, requestedPhoto) {
    const day = days.includes(requestedDay) ? requestedDay : days[0];
    const list = allPhotos.filter(p => p.day === day).sort((a,b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
    const roll = rolls.find(r => r.day === day);
    const clips = films.filter(f => f.day === day).sort((a,b) => a.time.localeCompare(b.time));
    const ids = [...new Set([...list,...clips].map(item => item.project))];
    titleOf(dayLabel(day) + '实习日记');
    main.innerHTML = '<div class="wrap diary"><header class="page-top">' + crumb('实习日记') +
      '<h1 class="page-title">实习日记</h1><p class="page-lead">从 11 月 2 日到 7 日，按原片记录的时间回看现场。每个项目的全部精选都在建筑参观和企业交流相册里。</p></header>' +
      '<nav class="day-nav" aria-label="选择拍摄日期">' + days.map(d => '<a href="#/days/' + d + '"' +
        (d === day ? ' aria-current="date"' : '') + '>' + dayLabel(d) + '</a>').join('') + '</nav>' +
      '<section class="diary-photos"><div class="gallery-heading"><h2>' + dayLabel(day) + '</h2><span>' +
      countText(list.length) + '照片 · ' + clips.length + ' 段短片</span></div>' +
      chapterReader(list, roll.title, roll.subtitle, requestedPhoto || roll.frames[0], roll.accent) +
      '<div class="day-places">' + ids.map(code => '<a href="' + projectUrl(code) + '">' + escape(projectTitle(projects.get(code))) + '</a>').join('') +
      '</div>' + photoGrid(list,true) + '</section>' + filmGallery(clips) + '</div>';
  }

  function projectPage(project) {
    const business = corporate.includes(project.id);
    const parent = business ? '企业交流' : '建筑参观';
    const parentUrl = business ? '#/exchange' : '#/atlas';
    const name = projectTitle(project);
    const note = notes[project.id];
    const detail = context[project.id];
    const gallery = projectPhotos.get(project.id);
    const list = business ? corporate.map(id => projects.get(id)) : architecture;
    const next = list[(list.findIndex(p => p.id === project.id) + 1) % list.length];
    titleOf(name);
    main.innerHTML = '<div class="wrap"><header class="project-header">' + crumb(parent,parentUrl) +
      '<div class="project-intro"><div><p class="project-type">' + escape(business ?
        (project.id === 'ZY' ? '建筑学长企业交流' : 'goa 大象设计企业交流') : chapterLabel(project)) +
      '</p><h1 class="detail-title">' + escape(name) + '</h1></div><div>' +
      (detail && detail.about ? '<p class="intro-text project-about">' + escape(detail.about) + '</p>' : '') +
      '<p class="intro-text">' + escape(note.intro) + '</p><p class="focus"><b>观察重点</b>' + escape(note.focus) + '</p>' +
      (detail && detail.url && /^https?:\/\//.test(detail.url) ? '<p class="source"><a href="' + escape(detail.url) +
       '" target="_blank" rel="noopener noreferrer">' + escape(detail.source || '项目资料') + ' ↗</a></p>' : '') +
      '</div></div></header><section class="gallery-section" aria-label="全部精选照片"><div class="gallery-heading"><h2>现场相册</h2>' +
      '<span>共 ' + gallery.length + ' 张 · 点图放大</span></div>' + chapterReader(gallery,name,note.focus,cover(project).id,'#d1bda0') + photoGrid(gallery) + filmGallery(films.filter(f => f.project === project.id)) +
      '<div class="after-album">' + link(parentUrl,'返回' + parent) + link(projectUrl(next.id),'下一组 · ' + projectTitle(next)) +
      '</div></section></div>';
  }

  function picksPage() {
    titleOf('我的选片');
    const list = [...picks].map(id => photos.get(id)).filter(Boolean);
    const help = storageAvailable ? '点照片旁的星标，把准备放入汇报的画面留在这里。选片记录保存在当前浏览器。' :
      '点照片旁的星标可以选片。当前浏览器仅支持本次打开期间保存。';
    main.innerHTML = '<div class="wrap picks"><header class="page-top">' + crumb('我的选片') +
      '<h1 class="page-title">我的选片</h1><p class="page-lead">' + help + '</p></header>' +
      (list.length ? '<div class="gallery-heading"><h2>已选照片</h2><span>' + countText(list.length) + '</span></div>' + photoGrid(list) :
        '<div class="empty"><strong>还没有选中的照片</strong><a class="btn" href="#/atlas">浏览建筑参观 →</a></div>') + '</div>';
  }

  function readRoute() {
    const parts = window.location.hash.replace(/^#\/?/,'').split('/');
    const page = parts[0];
    if (viewer.open) viewer.close();
    galleryIds = [];
    readerPhotos = [];
    if (!page) { activePage='home'; home(); }
    else if (page === 'atlas') { activePage='atlas'; if (parts.length>1 && categories.has(parts[1])) atlasCategory=parts[1]; atlas(); }
    else if (page === 'exchange') { activePage='exchange'; exchange(); }
    else if (page === 'days') { activePage='days'; diary(parts[1],parts[2]); }
    else if (page === 'picks') { activePage='picks'; picksPage(); }
    else if (page === 'project' && projects.has(parts[1])) {
      activePage = corporate.includes(parts[1]) ? 'exchange' : 'atlas';
      projectPage(projects.get(parts[1]));
    } else { activePage='home'; titleOf('未找到页面'); main.innerHTML='<div class="wrap page-top"><h1 class="page-title">未找到此相册</h1><div class="actions"><a class="btn" href="#/atlas">返回项目索引</a></div></div>'; }
    document.querySelectorAll('[data-tab]').forEach(el => {
      if (el.dataset.tab === activePage) el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
    document.body.classList.toggle('cover-page',activePage === 'home');
    if (readerPhotos.length) showReader(readerIndex);
    updatePickCount();
  }

  function updatePickCount() { $('pick-count').textContent = picks.size ? String(picks.size) : ''; }

  function togglePick(id) {
    if (picks.has(id)) picks.delete(id); else picks.add(id);
    try { localStorage.setItem(localKey, JSON.stringify([...picks])); } catch (_) { storageAvailable = false; }
    updatePickCount();
    const photo = photos.get(id);
    if (activePage === 'picks') { picksPage(); }
    else {
      document.querySelectorAll('[data-pick="' + id + '"]').forEach(btn => {
        btn.textContent = picks.has(id) ? '★' : '☆';
        btn.setAttribute('aria-pressed', String(picks.has(id)));
        btn.setAttribute('aria-label', (picks.has(id) ? '移出选片' : '加入选片') + '，' + photo.caption);
      });
    }
    if (viewer.open) renderViewer();
  }

  function openPhoto(id, trigger) {
    if (!galleryIds.includes(id)) return;
    viewerIds = galleryIds.slice(); viewerIndex = viewerIds.indexOf(id);
    focusAfterClose = trigger;
    renderViewer();
    viewer.showModal();
    document.body.classList.add('locked');
  }

  function renderViewer(direction = 0) {
    const photo = photos.get(viewerIds[viewerIndex]);
    const project = projects.get(photo.project);
    setFrameImage($('view-image'),photo,direction,projectTitle(project) + '，' + photo.caption);
    showAnnotation($('view-note'),photo);
    $('view-count').textContent = pad(viewerIndex+1) + ' / ' + pad(viewerIds.length);
    $('view-title').textContent = photo.caption;
    $('view-project').textContent = projectTitle(project) + ' ↗';
    $('view-project').href = projectUrl(project.id);
    const detail = [];
    if (photo.day) detail.push(dayLabel(photo.day) + ' ' + photo.time);
    if (photo.aperture) detail.push(photo.aperture);
    if (photo.shutter) detail.push(photo.shutter + ' s');
    if (photo.iso) detail.push('ISO ' + photo.iso);
    $('view-exif').textContent = photo.id + (detail.length ? '　' + detail.join(' · ') : '');
    $('view-download').href = asset(photo.id);
    $('view-download').download = projectTitle(project) + '_' + photo.id + '.webp';
    $('view-pick').textContent = picks.has(photo.id) ? '★ 已选' : '☆ 选片';
    $('view-pick').setAttribute('aria-pressed', String(picks.has(photo.id)));
    $('view-prev').hidden = $('view-next').hidden = viewerIds.length < 2;
    if (viewerIds.length > 1) {
      const adjacent = new Image();
      adjacent.src = asset(viewerIds[(viewerIndex+1) % viewerIds.length]);
    }
  }

  function shiftPhoto(direction) {
    if (viewerIds.length < 2) return;
    viewerIndex = (viewerIndex + direction + viewerIds.length) % viewerIds.length;
    renderViewer(direction);
  }

  main.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-read-step')) { const step=Number(button.dataset.readStep); showReader(readerIndex + step,step); return; }
    if (button.hasAttribute('data-read-index')) { const index=Number(button.dataset.readIndex); showReader(index,index-readerIndex); return; }
    if (button.hasAttribute('data-photo')) { openPhoto(button.dataset.photo,button); return; }
    if (button.hasAttribute('data-pick')) { togglePick(button.dataset.pick); return; }
    if (button.hasAttribute('data-reset')) { atlasCategory=''; searchText=''; atlas(); $('atlas-search').focus(); return; }
    if (button.hasAttribute('data-category')) {
      atlasCategory = button.dataset.category;
      $('filters').querySelectorAll('button').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      updateAtlas();
    }
  });
  main.addEventListener('keydown', event => {
    if (event.target.closest('#roll-reader') && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      showReader(readerIndex + direction,direction);
    }
  });
  let readerTouch = null;
  main.addEventListener('touchstart', event => {
    if (!event.target.closest('.reader-stage') || event.touches.length !== 1) { readerTouch = null; return; }
    readerTouch = [event.touches[0].clientX,event.touches[0].clientY];
  }, {passive:true});
  main.addEventListener('touchend', event => {
    if (!readerTouch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - readerTouch[0];
    const dy = event.changedTouches[0].clientY - readerTouch[1];
    readerTouch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      const step = dx < 0 ? 1 : -1;
      showReader(readerIndex + step,step);
    }
  }, {passive:true});
  main.addEventListener('touchcancel', () => { readerTouch = null; }, {passive:true});
  document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); main.focus(); });
  $('view-close').addEventListener('click', () => viewer.close());
  $('view-project').addEventListener('click', () => viewer.close());
  $('view-prev').addEventListener('click', () => shiftPhoto(-1));
  $('view-next').addEventListener('click', () => shiftPhoto(1));
  $('view-pick').addEventListener('click', () => togglePick(viewerIds[viewerIndex]));
  viewer.addEventListener('close', () => {
    document.body.classList.remove('locked');
    if (focusAfterClose && focusAfterClose.isConnected) focusAfterClose.focus({preventScroll:true});
    else main.focus({preventScroll:true});
    focusAfterClose = null;
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); shiftPhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  let touch = null;
  $('view-stage').addEventListener('touchstart', event => {
    touch = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null;
  }, {passive:true});
  $('view-stage').addEventListener('touchcancel', () => { touch=null; }, {passive:true});
  $('view-stage').addEventListener('touchend', event => {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch[0];
    const dy = event.changedTouches[0].clientY - touch[1];
    touch = null;
    if (Math.abs(dx) > 47 && Math.abs(dx) > Math.abs(dy)*1.35) shiftPhoto(dx < 0 ? 1 : -1);
  }, {passive:true});
  function navigate() {
    const requestedHash = window.location.hash;
    pageTransition?.skipTransition();
    const draw = () => {
      if (window.location.hash !== requestedHash) return;
      readRoute();
      window.scrollTo({top:0,behavior:'instant'});
      main.focus({preventScroll:true});
    };
    if (!reduceMotion() && document.startViewTransition) {
      const transition = document.startViewTransition(draw);
      pageTransition = transition;
      transition.ready?.catch(() => {});
      transition.finished.catch(() => {}).then(() => { if (pageTransition === transition) pageTransition = null; });
    } else {
      draw();
      if (!reduceMotion()) main.animate?.([{opacity:0.55,transform:'translateY(6px)'},{opacity:1,transform:'none'}],
        {duration:220,easing:'ease-out'});
    }
  }
  window.addEventListener('hashchange',navigate);
  readRoute();
})();
