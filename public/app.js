let state={user:null,token:localStorage.token||'',meta:{services:[],packages:[],paymentMethods:[],cities:[]},tab:'dash',gps:null};
let chatTimer=null, activeChatId=null;
let socket=null;
function setupSocket(){
  if(typeof io==='undefined' || socket) return;
  socket=io();
  socket.on('messages-updated', data=>{ if(activeChatId && data.requestId==activeChatId) renderMessages(data.messages); });
  socket.on('request-status-updated', data=>{ if(activeChatId && data.request && data.request.id==activeChatId) toast('تم تحديث حالة الطلب'); });
  socket.on('requests-updated', ()=>{ if(state.user && !activeChatId) dashboard(); });
  socket.on('rated', ()=>toast('تم استلام التقييم'));
}
let recorder=null,audioChunks=[],recordingId=null;
const $=s=>document.querySelector(s), app=$('#app');
async function api(url,opt={}){opt.headers={...(opt.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(state.token?{Authorization:'Bearer '+state.token}:{})};let r=await fetch(url,opt),j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'حدث خطأ');return j}
function toast(t){let d=document.createElement('div');d.className='toast';d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3500)}
function stars(n=0){let x=Math.round(Number(n)||0);return `<span class="stars">${'★'.repeat(x)}${'☆'.repeat(5-x)}</span>`}
async function init(){setupSocket();state.meta=await api('/api/meta');try{let m=await api('/api/me');state.user=m.user;return dashboard()}catch{};go('home')}
function go(p){document.body.classList.remove('open'); if(p==='home') return home(); if(p==='services')return servicesPage(); if(p==='how')return howPage(); if(p==='tech')return techPage(); if(p==='contact')return contact(); if(p==='login')return login(); if(p==='register')return register(); if(p==='dashboard')return dashboard();}
function home(){app.innerHTML=`<section class="hero pro-hero"><div class="hero-copy"><span class="badge glow-badge"><span class="live-dot"></span> منصة صيانة ذكية في الأردن • فنيين موثوقين • دفع كاش</span><h1>صلّحلي — وصّل العميل بالفني الأقرب بشكل أسرع وأرتب</h1><p class="hero-lead">واجهة احترافية تعرض الخدمات، الفنيين، الطلبات، التقييمات، الرصيد، والدردشة بمظهر حديث يناسب إطلاق مشروع حقيقي.</p><div class="hero-actions"><button class="btn big" onclick="go('${state.user?'dashboard':'register'}')">اطلب خدمة الآن</button><button class="btn ghost big" onclick="register('technician')">انضم كفني</button></div><div class="trust-strip"><div><b>+12</b><span>خدمة صيانة</span></div><div><b>GPS</b><span>تحديد موقع</span></div><div><b>⭐ 4.8</b><span>تقييمات فنيين</span></div></div></div><div class="phone pro-phone"><div class="phone-top"><span></span><b>فنيين مقترحين</b><em>Live</em></div><div class="screen pro-screen">${['فني تكييف','كهربائي','سباك'].map((x,i)=>`<div class="screen-row pro-row"><div style="display:flex;gap:10px;align-items:center"><div class="avatar">${['❄️','⚡','🚰'][i]}</div><div><b>${x}</b><div>${stars(5-i/2)} <small>${20-i*4} عمل مكتمل</small></div></div></div><button class="btn ghost mini">اختيار</button></div>`).join('')}<div class="mini-map"><span>📍</span><div><b>الأقرب لموقعك</b><small>ترتيب حسب المنطقة والتقييم</small></div></div></div></div></section><section class="section services-section" id="services"><div class="section-head"><span class="eyebrow">خدمات جاهزة</span><h2>كل ما يحتاجه البيت بمكان واحد</h2><p class="muted">اختر الخدمة، انشر الطلب، وشاهد الفنيين المناسبين حسب منطقتك.</p></div><div class="grid feature-grid">${state.meta.services.slice(0,12).map(s=>`<div class="card service-card"><div class="icon">${s.icon}</div><h3>${s.name}</h3><p class="muted">طلب سريع، فنيين قريبين، وتقييم واضح قبل الاختيار.</p></div>`).join('')}</div></section><section class="section"><div class="section-head"><span class="eyebrow">كيف يعمل؟</span><h2>خطوات بسيطة من الطلب إلى الإنجاز</h2></div><div class="grid steps-grid"><div class="card step-card"><span>01</span><h3>أنشئ طلب</h3><p class="muted">اختر الخدمة، اكتب وصف المشكلة، وحدد المحافظة والمنطقة.</p></div><div class="card step-card"><span>02</span><h3>اختر الفني</h3><p class="muted">يعرض النظام الفنيين المناسبين مع التقييم وعدد الأعمال.</p></div><div class="card step-card"><span>03</span><h3>ادفع وقيّم</h3><p class="muted">بعد الإنجاز يتم الدفع كاش وتقييم الفني بالنجوم.</p></div></div></section><section class="section cta-section"><div class="cta-card"><div><span class="eyebrow">جاهز للإطلاق</span><h2>ابدأ بتحويل طلبات الصيانة إلى تجربة مرتبة وموثوقة</h2><p>تصميم حديث، أزرار واضحة، كروت احترافية، وتجربة مناسبة للموبايل والكمبيوتر.</p></div><button class="btn light big" onclick="go('${state.user?'dashboard':'register'}')">ابدأ الآن</button></div></section>`}
function servicesPage(){app.innerHTML=`<div class="page"><h1>كل خدمات صلّحلي</h1><div class="grid">${state.meta.services.map(s=>`<div class="card"><div class="icon">${s.icon}</div><h3>${s.name}</h3><button class="btn" onclick="go('${state.user?'dashboard':'register'}')">اطلب الآن</button></div>`).join('')}</div></div>`}
function howPage(){app.innerHTML=`<div class="page"><h1>آلية العمل</h1><div class="grid"><div class="card"><h3>للعميل</h3><p class="muted">طلب خدمة، مشاهدة الفنيين، اختيار الفني، محادثة داخلية، تأكيد الدفع كاش، تقييم.</p></div><div class="card"><h3>للفني</h3><p class="muted">أول طلبين مجاناً، ثم يحتاج رصيد. يختار باقة، يدفع للبنك، يرفع صورة التحويل، والأدمن يوافق.</p></div><div class="card"><h3>للإدارة</h3><p class="muted">إدارة المستخدمين، الفنيين، الطلبات، الشحن، الشكاوى، والتقارير.</p></div></div></div>`}
function techPage(){app.innerHTML=`<div class="page"><h1>نظام الفنيين</h1><div class="cards2">${state.meta.packages.map(p=>`<div class="card package"><h3>${p.name}</h3><strong>${p.amount} د.أ</strong><p>رصيد إضافي: ${p.bonus} د.أ</p><p>خصم كل طلب مكتمل: ${p.commission_per_order} د.أ</p></div>`).join('')}</div><br><button class="btn" onclick="register('technician')">سجل كفني الآن</button></div>`}
function contact(){app.innerHTML=`<div class="page"><div class="card"><h1>تواصل معنا</h1><p class="muted">للاستفسار أو شحن رصيد الفنيين: 0790000000</p></div></div>`}
function login(){app.innerHTML=`<div class="page"><div class="card" style="max-width:520px;margin:auto"><h1>تسجيل الدخول</h1><form class="form" onsubmit="doLogin(event)"><div class="field"><label>البريد الإلكتروني</label><input id="email" type="email" required></div><div class="field"><label>كلمة السر</label><input id="password" type="password" required></div><button class="btn">دخول</button><p class="muted">حساب الإدارة لا يظهر للعامة. اطلب بيانات الدخول من مالك المنصة.</p></form></div></div>`}
async function doLogin(e){e.preventDefault();try{let j=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:email.value,password:password.value})});state.user=j.user;state.token=j.token;localStorage.token=j.token;toast('تم تسجيل الدخول');dashboard()}catch(err){toast(err.message)}}
function register(role='customer'){app.innerHTML=`<div class="page"><div class="card" style="max-width:760px;margin:auto"><h1>إنشاء حساب</h1><form class="form two" onsubmit="doRegister(event)"><div class="field"><label>نوع الحساب</label><select id="role" onchange="toggleTech()"><option value="customer">عميل</option><option value="technician">فني</option></select></div><div class="field"><label>الاسم الكامل</label><input id="name" placeholder="مثال: أحمد محمد" required minlength="2"></div><div class="field techOnly"><label>الصورة الشخصية للفني</label><input id="avatar" type="file" accept="image/png,image/jpeg,image/webp"><small class="muted">مطلوبة للفني فقط حتى يظهر للعميل بشكل موثوق.</small></div><div class="field"><label>البريد الإلكتروني</label><input id="remail" type="email" required></div><div class="field"><label>رقم الهاتف</label><input id="phone" placeholder="0791234567" required></div><div class="field"><label>كلمة السر</label><input id="rpassword" type="password" required minlength="8"></div><div class="field"><label>المحافظة</label><select id="city">${state.meta.cities.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="field techOnly"><label>الرقم الوطني</label><input id="national" placeholder="10 أرقام"></div><div class="field techOnly"><label>الخدمات</label><select id="srv" multiple size="5">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field techOnly"><label>مناطق العمل</label><select id="areas" multiple size="5">${state.meta.cities.map(c=>`<option>${c}</option>`).join('')}</select></div><div></div><button class="btn">إنشاء الحساب</button></form></div></div>`;$('#role').value=role;toggleTech()}
function toggleTech(){document.querySelectorAll('.techOnly').forEach(x=>x.style.display=$('#role').value==='technician'?'block':'none')}
function vals(sel){return Array.from($(sel).selectedOptions||[]).map(o=>o.value)}
async function doRegister(e){e.preventDefault();try{const role=$('#role').value;const fd=new FormData();fd.append('role',role);fd.append('name',$('#name').value.trim());fd.append('email',$('#remail').value.trim());fd.append('phone',$('#phone').value.trim());fd.append('password',$('#rpassword').value);fd.append('city',$('#city').value);fd.append('national_number',$('#national')?$('#national').value.trim():'');fd.append('services',vals('#srv').join(','));fd.append('areas',vals('#areas').join(','));if(role==='technician'&&!$('#avatar').files[0]) throw new Error('الرجاء اختيار صورة شخصية للفني');if($('#avatar')&&$('#avatar').files[0])fd.append('avatar',$('#avatar').files[0]);let j=await api('/api/auth/register',{method:'POST',body:fd});state.user=j.user;state.token=j.token;localStorage.token=j.token;toast('تم إنشاء الحساب');dashboard(); if(localStorage.pendingService){ const ps=localStorage.pendingService; localStorage.removeItem('pendingService'); setTimeout(()=>{ if(state.user?.role==='customer'){ state.tab='near'; dashboard(); setTimeout(()=>{ if($('#searchTechQ')) $('#searchTechQ').value=ps; if($('#searchService')) $('#searchService').value=ps; searchTechnicians(); },180); } },250); }}catch(err){toast(err.message)}}
async function logout(){await api('/api/auth/logout',{method:'POST'}).catch(()=>{});localStorage.removeItem('token');state.user=null;state.token='';home()}
function dashboard(){if(!state.user)return login(); if(state.user.role==='admin')return admin(); if(state.user.role==='technician')return techDash(); return custDash()}
function layout(title,menu,content){app.innerHTML=`<div class="page"><div class="topbar"><h1>${title}</h1><button class="btn ghost" onclick="logout()">تسجيل خروج</button></div><div class="panel"><aside class="sidebar">${menu.map(m=>`<button class="sidebtn ${state.tab===m[0]?'active':''}" onclick="state.tab='${m[0]}';dashboard()">${m[1]}</button>`).join('')}</aside><section>${content}</section></div></div>`}
async function custDash(){let menu=[['dash','طلب جديد'],['near','الفنيين الأقرب'],['orders','طلباتي']];let c=''; if(state.tab==='orders'){let j=await api('/api/requests');c=`<div class="card"><h2>طلباتي</h2>${reqTable(j.requests)}</div>`}else if(state.tab==='near'){c=nearbyPage()}else c=requestForm();layout('لوحة العميل',menu,c); if(state.tab==='near') loadNearby();}
function mapBox(lat,lng){if(!lat||!lng)return `<div class="mapbox empty">لم يتم تحديد الموقع بعد</div>`;return `<iframe class="mapbox" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng)-0.01}%2C${Number(lat)-0.01}%2C${Number(lng)+0.01}%2C${Number(lat)+0.01}&layer=mapnik&marker=${lat}%2C${lng}"></iframe><a class="maplink" target="_blank" href="https://www.google.com/maps?q=${lat},${lng}">فتح الموقع على خرائط Google</a>`}
function requestForm(){return `<div class="card bluehint offer-request"><h2>طلب خدمة جديد</h2><p class="muted">انشر المشكلة وسيقوم الفنيون بإرسال عروض سعر ومدة تنفيذ. قبول العرض يكون بقرار العميل فقط.</p><form class="form two" onsubmit="createReq(event)"><div class="field"><label>الخدمة</label><select id="qservice">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="qcity">${state.meta.cities.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="field"><label>المنطقة / الحي</label><input id="qarea" placeholder="مثال: الجبيهة، القويسمة، ماركا"></div><div class="field"><label>الوقت المناسب</label><input id="qtime" placeholder="اليوم مساءً / بكرا صباحاً"></div><div class="field" style="grid-column:1/-1"><label>صورة المشكلة اختياري</label><input id="problemImage" type="file" accept="image/png,image/jpeg,image/webp" onchange="previewProblemImage()"><small class="muted">PNG / JPG / WEBP فقط، حجم آمن حتى 3MB.</small><div id="problemPreview"></div></div><div class="field" style="grid-column:1/-1"><label>وصف المشكلة</label><textarea id="qdesc" required minlength="10" placeholder="مثال: المكيف لا يبرد، نوعه سبليت، أحتاج فني اليوم إذا أمكن"></textarea></div><div class="field" style="grid-column:1/-1"><button type="button" class="btn ghost" onclick="useGPS('request')">📍 حدد موقعي الآن</button><small class="muted">الموقع يساعد الفنيين على تقدير السعر والوقت بدقة.</small><div id="requestMap">${mapBox(state.gps?.lat,state.gps?.lng)}</div></div><button class="btn">نشر الطلب واستقبال عروض</button></form></div><br><div id="techs"></div>`}
function previewProblemImage(){let f=$('#problemImage')?.files?.[0], box=$('#problemPreview'); if(!box)return; if(!f){box.innerHTML='';return} if(!['image/png','image/jpeg','image/webp'].includes(f.type)) return toast('نوع الصورة غير مسموح'); box.innerHTML=`<img class="problem-preview" src="${URL.createObjectURL(f)}" alt="معاينة المشكلة">`;}
async function createReq(e){e.preventDefault();try{let fd=new FormData();fd.append('service',qservice.value);fd.append('city',qcity.value);fd.append('area',qarea.value);fd.append('preferred_time',qtime.value);fd.append('description',qdesc.value);fd.append('lat',state.gps?.lat||'');fd.append('lng',state.gps?.lng||'');if(problemImage.files[0])fd.append('problem_image',problemImage.files[0]);await api('/api/requests',{method:'POST',body:fd});toast('تم نشر الطلب، بانتظار عروض الفنيين');state.tab='orders';dashboard()}catch(err){toast(err.message)}}

function nearbyPage(){return `<div class="card bluehint"><h2>الفنيين الأقرب لك</h2><p class="muted">استخدم GPS لتحديد موقعك، ثم اختر الخدمة. تظهر الخريطة الصغيرة لمنطقتك ويتم ترتيب الفنيين حسب المحافظة ومناطق العمل والتقييم.</p><div class="form two"><div class="field"><label>الخدمة</label><select id="nservice" onchange="loadNearby()">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="ncity" onchange="loadNearby()">${state.meta.cities.map(c=>`<option>${c}</option>`).join('')}</select></div><button class="btn ghost" onclick="useGPS('near')">📍 تحديد موقعي GPS</button></div><div id="nearMap">${mapBox(state.gps?.lat,state.gps?.lng)}</div></div><br><div id="nearList" class="grid"></div>`}
function cityFromGPS(lat,lng){ if(lat>=31.72&&lat<=32.15&&lng>=35.65&&lng<=36.15)return 'عمان'; if(lat>=32.0&&lat<=32.25&&lng>=35.8&&lng<=36.2)return 'الزرقاء'; if(lat>=32.45&&lat<=32.7)return 'إربد'; if(lat<29.8)return 'العقبة'; if(lat<30.4)return 'معان'; if(lat<30.95)return 'الطفيلة'; if(lat<31.35)return 'الكرك'; return 'عمان';}
function useGPS(mode='near'){ if(!navigator.geolocation)return toast('المتصفح لا يدعم GPS'); navigator.geolocation.getCurrentPosition(pos=>{state.gps={lat:pos.coords.latitude.toFixed(6),lng:pos.coords.longitude.toFixed(6)};let c=cityFromGPS(pos.coords.latitude,pos.coords.longitude); if($('#ncity'))$('#ncity').value=c; if($('#qcity'))$('#qcity').value=c; if($('#nearMap'))$('#nearMap').innerHTML=mapBox(state.gps.lat,state.gps.lng); if($('#requestMap'))$('#requestMap').innerHTML=mapBox(state.gps.lat,state.gps.lng); toast('تم تحديد موقعك: '+c); if(mode==='near')loadNearby();},()=>toast('لم يتم السماح بالوصول للموقع'),{enableHighAccuracy:true,timeout:10000});}
async function loadNearby(){try{let service=$('#nservice')?.value||state.meta.services[0]?.name, city=$('#ncity')?.value||state.user.city||'عمان';let j=await api(`/api/technicians?service=${encodeURIComponent(service)}&city=${encodeURIComponent(city)}&lat=${state.gps?.lat||''}&lng=${state.gps?.lng||''}`);let box=$('#nearList'); if(!box)return; box.innerHTML=j.technicians.length?j.technicians.map(t=>`<div class="card techcard"><div class="techhead">${t.avatar_url?`<img class="techAvatar" src="${t.avatar_url}">`:`<div class="techAvatar fallback">ف</div>`}<div><h3>${t.name}</h3><div>${stars(t.rating_avg)} <small class="muted">(${t.rating_count||0} تقييم)</small></div></div></div><p><b>الخدمات:</b> ${t.services||'-'}</p><p><b>المناطق:</b> ${t.areas||t.city||'-'}</p><p><b>أعمال مكتملة:</b> ${t.completed_jobs||0}</p><span class="status">قريب منك في ${city}</span></div>`).join(''):`<div class="card empty">لا يوجد فنيين مناسبين حالياً لهذه الخدمة والمنطقة.</div>`}catch(e){toast(e.message)}}

function reqTable(rows){if(!rows.length)return '<div class="empty">لا توجد طلبات</div>';return `<div class="request-list">${rows.map(r=>`<div class="request-card"><div class="request-head"><div><b>#${r.id} - ${r.service}</b><p class="muted">${r.city}${r.area?' - '+r.area:''} • ${r.preferred_time||'بدون وقت محدد'}</p></div><span class="status">${r.status}</span></div>${r.problem_image_url?`<img class="problem-img" src="${r.problem_image_url}" alt="صورة المشكلة">`:''}<p>${r.description||''}</p>${r.lat&&r.lng?`<details><summary>📍 عرض موقع العميل على الخريطة</summary>${mapBox(r.lat,r.lng)}</details>`:''}<div class="request-meta"><span>الفني: ${r.technician_name||'-'}</span><span>العميل: ${r.customer_name||'-'}</span><span>السعر المقبول: ${r.offer_price? r.offer_price+' د.أ':'-'}</span><span>المدة: ${r.arrival_time||'-'}</span></div><div class="actions">${actions(r)}</div><div id="offers-${r.id}" class="offers-box"></div></div>`).join('')}</div>`}
function actions(r){let a=''; if(state.user.role==='customer')a+=`<button class="btn ghost" onclick="loadOffers(${r.id})">عروض الفنيين</button> `; if(r.technician_id||state.user.role==='admin')a+=`<button class="btn ghost" onclick="chat(${r.id})">محادثة</button> `; if(state.user.role==='technician'&&['بانتظار العروض','وصلت عروض'].includes(r.status))a+=`<button class="btn" onclick="offerForm(${r.id},'${(r.service||'').replaceAll("'",'')}')">تقديم عرض سعر</button>`; if(state.user.role==='customer'&&['تم اختيار عرض','قيد التنفيذ','بانتظار تأكيد الدفع'].includes(r.status))a+=`<button class="btn green" onclick="setStatus(${r.id},'مكتمل')">تم إنجاز الطلب</button>`; if(state.user.role==='customer'&&r.status==='مكتمل')a+=`<button class="btn" onclick="rate(${r.id})">تقييم الفني</button>`; return a}
function offerForm(id,service=''){app.innerHTML=`<div class="page"><button class="btn ghost" onclick="dashboard()">رجوع</button><div class="card offer-panel" style="max-width:760px;margin:auto"><h2>تقديم عرض سعر</h2><p class="muted">الفني يرسل السعر والمدة فقط. الطلب لا يصبح قيد التنفيذ إلا بعد موافقة العميل.</p><form class="form two" onsubmit="sendOffer(event,${id})"><div class="field"><label>السعر بالدينار</label><input id="offerPrice" type="number" min="1" step="0.5" placeholder="مثال: 15" required></div><div class="field"><label>مدة التنفيذ / الوصول</label><input id="arrivalTime" placeholder="مثال: خلال 45 دقيقة / خلال ساعتين" required></div><div class="field" style="grid-column:1/-1"><label>ملاحظة اختيارية للعميل</label><textarea id="offerNote" placeholder="مثال: السعر يشمل الكشف والصيانة البسيطة ولا يشمل قطع الغيار"></textarea></div><button class="btn">إرسال العرض للعميل</button></form></div></div>`}
async function sendOffer(e,id){e.preventDefault();try{await api(`/api/requests/${id}/offer`,{method:'POST',body:JSON.stringify({offer_price:offerPrice.value,duration:arrivalTime.value,note:offerNote.value||''})});toast('تم إرسال العرض، بانتظار موافقة العميل');state.tab='orders';dashboard()}catch(e){toast(e.message)}}
async function loadOffers(id){try{let j=await api(`/api/requests/${id}/offers`);let box=$(`#offers-${id}`); if(!box)return; box.innerHTML=offerCards(j.offers,j.request)}catch(e){toast(e.message)}}
function offerCards(offers,req){if(!offers.length)return '<div class="empty small">لا توجد عروض بعد</div>';return `<div class="offers-list"><h3>العروض المستلمة</h3>${offers.map(o=>`<div class="offer-card ${o.status}">${o.avatar_url?`<img class="miniAvatar" src="${o.avatar_url}">`:'<div class="miniAvatar fallback">ف</div>'}<div class="offer-info"><b>${o.technician_name}</b><small>${o.technician_city||''} • ${o.technician_areas||''}</small><span>${stars(o.rating_avg)} (${o.rating_count||0}) • ${o.completed_jobs||0} عمل</span><p>${o.note||'لا توجد ملاحظة'}</p></div><div class="offer-price"><b>${o.price} د.أ</b><span>${o.duration}</span><em>${o.status==='accepted'?'مقبول':o.status==='rejected'?'مرفوض':'بانتظار قرارك'}</em>${state.user.role==='customer'&&o.status==='pending'&&req.customer_id===state.user.id?`<button class="btn green mini" onclick="decideOffer(${o.id},'accepted',${req.id})">موافق</button><button class="btn red mini" onclick="decideOffer(${o.id},'rejected',${req.id})">رفض</button>`:''}</div></div>`).join('')}</div>`}
async function decideOffer(id,decision,requestId){try{await api(`/api/offers/${id}/decision`,{method:'POST',body:JSON.stringify({decision})});toast(decision==='accepted'?'تم قبول العرض وفتح الشات':'تم رفض العرض والطلب ما زال مطروحاً');state.tab='orders';dashboard()}catch(e){toast(e.message)}}
async function setStatus(id,s){try{await api(`/api/requests/${id}/status`,{method:'POST',body:JSON.stringify({status:s})});toast(s==='مكتمل'?'تم إكمال الطلب وخصم عمولة الفني حسب النظام':'تم تحديث الحالة');dashboard()}catch(e){toast(e.message)}}
function rate(id){
  app.innerHTML=`<div class="page"><button class="btn ghost" onclick="dashboard()">رجوع</button><div class="card rating-card" style="max-width:620px;margin:auto;text-align:center">
    <h2>قيّم الفني</h2>
    <p class="muted">اختر عدد النجوم ثم اكتب تعليقك. التقييم يظهر للفنيين والعملاء بشكل احترافي.</p>
    <div id="ratingStars" class="rating-picker" data-value="0">
      ${[1,2,3,4,5].map(n=>`<button type="button" class="rating-star" onclick="selectRating(${n})">☆</button>`).join('')}
    </div>
    <textarea id="ratingComment" placeholder="اكتب تعليقك عن الخدمة..." style="width:100%;min-height:110px;margin-top:14px"></textarea>
    <button class="btn" style="margin-top:14px" onclick="submitRating(${id})">إرسال التقييم</button>
  </div></div>`;
}
function selectRating(n){
  const box=$('#ratingStars'); if(!box)return; box.dataset.value=n;
  box.querySelectorAll('.rating-star').forEach((b,i)=>{b.textContent=i<n?'★':'☆'; b.classList.toggle('active',i<n)});
}
async function submitRating(id){
  const st=Number($('#ratingStars')?.dataset.value||0);
  if(!st)return toast('اختر عدد النجوم أولاً');
  try{await api(`/api/requests/${id}/rate`,{method:'POST',body:JSON.stringify({stars:st,comment:$('#ratingComment').value||''})});toast('تم إرسال التقييم');dashboard()}catch(e){toast(e.message)}
}
function messageBody(body){body=String(body||'');if(body.startsWith('[audio]')){let u=body.replace('[audio]','');return `<audio controls src="${u}"></audio>`}if(body.startsWith('[location]')){let p=body.replace('[location]','').split(',');let lat=p[0],lng=p[1];return `📍 <a target="_blank" href="https://www.google.com/maps?q=${lat},${lng}">فتح الموقع على الخريطة</a><div>${mapBox(lat,lng)}</div>`}return body.replace(/(https?:\/\/\S+)/g,'<a target="_blank" href="$1">$1</a>')}
function renderMessages(messages){let box=$('#chatbox'); if(!box)return; box.innerHTML=messages.map(m=>`<div class="msg ${m.sender_id===state.user.id?'me':''}"><b>${m.sender_name}</b><br>${messageBody(m.body)}<br><small>${m.created_at}</small></div>`).join(''); box.scrollTop=box.scrollHeight;}
async function refreshChat(){if(!activeChatId)return; try{let j=await api(`/api/requests/${activeChatId}/messages`);renderMessages(j.messages)}catch(e){}}
async function chat(id){activeChatId=id; setupSocket(); if(socket) socket.emit('join-request', id); if(chatTimer)clearInterval(chatTimer);let j=await api(`/api/requests/${id}/messages`);app.innerHTML=`<div class="page chat-page"><button class="btn ghost" onclick="if(socket&&activeChatId)socket.emit('leave-request',activeChatId);activeChatId=null;if(chatTimer)clearInterval(chatTimer);dashboard()">رجوع</button><div class="card chat-card"><h2>المحادثة للطلب #${id}</h2><div class="chat" id="chatbox"></div><form class="chat-input-row" onsubmit="sendMsg(event,${id})"><input id="msg" autocomplete="off" placeholder="اكتب رسالة"><button class="btn send-text-btn">إرسال</button></form><div class="chat-icon-tools"><button class="round-action location-action" onclick="sendLocation(${id})" title="إرسال الموقع">📍</button><button id="micBtn" class="round-action mic-action" onclick="toggleRec(${id})" title="تسجيل صوت">🎙️</button><button id="sendVoiceBtn" class="round-action send-voice-action hide" onclick="stopRec(${id})" title="إرسال الصوت">➤</button><span id="recordingLabel" class="recording-label hide">● جاري التسجيل...</span></div><small class="muted">المحادثة تتحدث تلقائياً، ويمكنك إرسال صوت أو موقعك بضغطة زر.</small></div></div>`;renderMessages(j.messages);chatTimer=setInterval(refreshChat,5000)}
async function sendMsg(e,id){e.preventDefault();try{let text=msg.value.trim();if(!text)return;msg.value='';let j=await api(`/api/requests/${id}/messages`,{method:'POST',body:JSON.stringify({body:text})});renderMessages(j.messages)}catch(err){toast(err.message)}}

async function toggleRec(id){
  if(recorder && recorder.state==='recording') return stopRec(id);
  return startRec(id);
}
async function startRec(id){try{let stream=await navigator.mediaDevices.getUserMedia({audio:true});audioChunks=[];recordingId=id;recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>audioChunks.push(e.data);recorder.start();$('#micBtn')?.classList.add('recording');$('#sendVoiceBtn')?.classList.remove('hide');$('#recordingLabel')?.classList.remove('hide');toast('بدأ التسجيل الصوتي')}catch(e){toast('لم يتم السماح باستخدام الميكروفون')}}
async function stopRec(id){try{if(!recorder||recorder.state!=='recording')return toast('لا يوجد تسجيل يعمل');recorder.onstop=async()=>{let blob=new Blob(audioChunks,{type:'audio/webm'});let fd=new FormData();fd.append('audio',blob,'voice.webm');let j=await api(`/api/requests/${id}/audio`,{method:'POST',body:fd});renderMessages(j.messages);$('#micBtn')?.classList.remove('recording');$('#sendVoiceBtn')?.classList.add('hide');$('#recordingLabel')?.classList.add('hide');toast('تم إرسال التسجيل الصوتي')};recorder.stop()}catch(e){toast(e.message)}}
async function sendLocation(id){if(!navigator.geolocation)return toast('المتصفح لا يدعم تحديد الموقع');navigator.geolocation.getCurrentPosition(async pos=>{let lat=pos.coords.latitude.toFixed(6),lng=pos.coords.longitude.toFixed(6);try{let j=await api(`/api/requests/${id}/messages`,{method:'POST',body:JSON.stringify({body:`[location]${lat},${lng}`})});renderMessages(j.messages);toast('تم إرسال الموقع')}catch(e){toast(e.message)}},()=>toast('لم يتم السماح بالوصول للموقع'),{enableHighAccuracy:true,timeout:10000})}

async function techDash(){let me=(await api('/api/me')).user;state.user=me;let menu=[['dash','الرئيسية'],['orders','الطلبات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']];let c='';if(state.tab==='orders'){let j=await api('/api/requests');c=`<div class="card"><h2>الطلبات المناسبة</h2>${reqTable(j.requests)}</div>`}else if(state.tab==='balance'){c=balancePage(me)}else if(state.tab==='topups'){let j=await api('/api/topups');c=topupTable(j.topups)}else if(state.tab==='ledger'){let j=await api('/api/ledger');c=ledgerTable(j.ledger)}else c=`<div class="cards4"><div class="stat"><span>الرصيد</span><br><b>${me.balance} د.أ</b></div><div class="stat"><span>طلبات مجانية مستخدمة</span><br><b>${me.free_orders_used}/2</b></div><div class="stat"><span>التقييم</span><br><b>${stars(me.rating_avg)}</b></div><div class="stat"><span>الأعمال</span><br><b>${me.completed_jobs}</b></div></div>`;layout('لوحة الفني',menu,c)}
function balancePage(me){let pm=state.meta.paymentMethods[0];return `<div class="card"><h2>رصيدك: ${me.balance} د.أ</h2><p class="muted">اختر باقة، حول المبلغ على الحساب البنكي، ثم ارفع صورة الدفع. الإدارة تراجع الطلب وتضيف الرصيد فقط إذا كان المبلغ صحيح.</p></div><br><div class="cards2">${state.meta.packages.map(p=>`<div class="card package"><h3>${p.name}</h3><strong>${p.amount} د.أ</strong><p>بونص: ${p.bonus} د.أ</p><button class="btn" onclick="topupForm(${p.id})">اختيار الباقة</button></div>`).join('')}</div><br><div class="card"><h3>بيانات الدفع</h3><p><b>البنك:</b> ${pm.bank_name}</p><p><b>اسم الحساب:</b> ${pm.account_name}</p><p><b>رقم الحساب / IBAN:</b> ${pm.account_number}</p><p><b>رقم التواصل:</b> ${pm.phone}</p><p class="muted">${pm.instructions}</p></div>`}
function topupForm(pid){let p=state.meta.packages.find(x=>x.id==pid),pm=state.meta.paymentMethods[0];app.innerHTML=`<div class="page"><button class="btn ghost" onclick="dashboard()">رجوع</button><div class="card"><h2>شحن ${p.name} - ${p.amount} د.أ</h2><p><b>البنك:</b> ${pm.bank_name}</p><p><b>اسم الحساب:</b> ${pm.account_name}</p><p><b>رقم الحساب:</b> ${pm.account_number}</p><form class="form" onsubmit="sendTopup(event,${p.id})"><div class="field"><label>صورة إثبات الدفع</label><input id="receipt" type="file" accept="image/png,image/jpeg,image/webp" required></div><button class="btn">إرسال للمراجعة</button></form></div></div>`}
async function sendTopup(e,pid){e.preventDefault();let fd=new FormData();fd.append('package_id',pid);fd.append('receipt',receipt.files[0]);try{await api('/api/topups',{method:'POST',body:fd});toast('تم إرسال طلب الشحن للإدارة');state.tab='topups';dashboard()}catch(err){toast(err.message)}}
function topupTable(rows){return `<div class="card"><h2>طلبات الشحن</h2>${!rows.length?'<div class="empty">لا يوجد</div>':`<table class="table"><tr><th>#</th><th>الفني</th><th>الباقة</th><th>المبلغ</th><th>الصورة</th><th>الحالة</th><th>إجراء</th></tr>${rows.map(t=>`<tr><td>${t.id}</td><td>${t.technician_name||'-'}</td><td>${t.package_name}</td><td>${t.amount}</td><td><a target="_blank" href="${t.receipt_url}">فتح</a></td><td><span class="status ${t.status}">${t.status}</span></td><td>${state.user.role==='admin'&&t.status==='pending'?`<button class="btn green" onclick="reviewTopup(${t.id},'approved')">موافقة</button> <button class="btn red" onclick="reviewTopup(${t.id},'rejected')">رفض</button>`:''}</td></tr>`).join('')}</table>`}</div>`}
async function reviewTopup(id,status){let note=prompt('ملاحظة الإدارة','تمت المراجعة');try{await api(`/api/admin/topups/${id}/review`,{method:'POST',body:JSON.stringify({status,admin_note:note})});toast('تمت المراجعة');admin()}catch(e){toast(e.message)}}
function ledgerTable(rows){return `<div class="card"><h2>سجل الرصيد</h2>${!rows.length?'<div class="empty">لا يوجد</div>':`<table class="table"><tr><th>النوع</th><th>المبلغ</th><th>الرصيد بعد العملية</th><th>ملاحظة</th><th>التاريخ</th></tr>${rows.map(l=>`<tr><td>${l.type}</td><td>${l.amount}</td><td>${l.balance_after}</td><td>${l.note||''}</td><td>${l.created_at}</td></tr>`).join('')}</table>`}</div>`}
async function admin(){let menu=[['dash','الإحصائيات'],['users','المستخدمين'],['orders','الطلبات'],['topups','شحن الفنيين'],['services','المهن والخدمات'],['packages','الباقات']];let c='';if(state.tab==='users'){let j=await api('/api/admin/users');c=usersTable(j.users)}else if(state.tab==='orders'){let j=await api('/api/requests');c=`<div class="card"><h2>كل الطلبات</h2>${reqTable(j.requests)}</div>`}else if(state.tab==='topups'){let j=await api('/api/topups');c=topupTable(j.topups)}else if(state.tab==='services')c=servicesAdmin();else if(state.tab==='packages')c=packagesAdmin();else{let j=await api('/api/admin/stats');let s=j.stats;c=`<div class="cards4"><div class="stat"><span>العملاء</span><br><b>${s.customers}</b></div><div class="stat"><span>الفنيين</span><br><b>${s.technicians}</b></div><div class="stat"><span>الطلبات</span><br><b>${s.requests}</b></div><div class="stat"><span>شحن بانتظار</span><br><b>${s.pendingTopups}</b></div></div>`}layout('لوحة الإدارة',menu,c)}
function usersTable(rows){return `<div class="card"><h2>المستخدمين</h2><table class="table"><tr><th>#</th><th>الصورة</th><th>الدور</th><th>الاسم</th><th>الهاتف</th><th>الرقم الوطني</th><th>الرصيد</th><th>التقييم</th><th>حالة</th><th></th></tr>${rows.map(u=>`<tr><td>${u.id}</td><td>${u.avatar_url?`<img src="${u.avatar_url}" class="miniAvatar">`:'-'}</td><td>${u.role}</td><td>${u.name}</td><td>${u.phone}</td><td>${u.national_number||'-'}</td><td>${u.balance}</td><td>${u.role==='technician'?stars(u.rating_avg):'-'}</td><td>${u.is_active?'فعال':'موقوف'}</td><td>${u.role!=='admin'?`<button class="btn ghost" onclick="toggleUser(${u.id})">تفعيل/إيقاف</button>`:''}</td></tr>`).join('')}</table></div>`}
async function toggleUser(id){await api(`/api/admin/users/${id}/toggle`,{method:'POST'});admin()}

function servicesAdmin(){return `<div class="card"><h2>إضافة مهنة / خدمة جديدة</h2><form class="form two" onsubmit="addService(event)"><div class="field"><label>اسم المهنة</label><input id="sname" placeholder="مثال: فني طاقة شمسية" required></div><div class="field"><label>أيقونة اختيارية</label><input id="sicon" placeholder="🔧"></div><button class="btn">إضافة</button></form></div><br><div class="grid">${state.meta.services.map(s=>`<div class="card"><div class="icon">${s.icon||'🔧'}</div><h3>${s.name}</h3></div>`).join('')}</div>`}
async function addService(e){e.preventDefault();try{await api('/api/admin/services',{method:'POST',body:JSON.stringify({name:sname.value,icon:sicon.value||'🔧'})});state.meta=await api('/api/meta');toast('تمت إضافة المهنة بنجاح');state.tab='services';admin()}catch(err){toast(err.message)}}

function packagesAdmin(){return `<div class="card"><h2>إضافة باقة</h2><form class="form two" onsubmit="addPkg(event)"><input id="pname" placeholder="اسم الباقة"><input id="pamount" type="number" placeholder="المبلغ"><input id="pbonus" type="number" placeholder="بونص"><input id="pcomm" type="number" value="2" placeholder="خصم الطلب"><button class="btn">إضافة</button></form></div><br><div class="cards2">${state.meta.packages.map(p=>`<div class="card"><h3>${p.name}</h3><b>${p.amount} د.أ</b><p>بونص ${p.bonus} - خصم ${p.commission_per_order}</p></div>`).join('')}</div>`}
async function addPkg(e){e.preventDefault();try{await api('/api/admin/packages',{method:'POST',body:JSON.stringify({name:pname.value,amount:pamount.value,bonus:pbonus.value,commission_per_order:pcomm.value})});state.meta=await api('/api/meta');toast('تمت إضافة الباقة');admin()}catch(err){toast(err.message)}}
init();

/* =========================
   Sallehly V6 Ultra Dashboard JS overrides
   ========================= */
function menuIcon(key){return ({dash:'🏠',users:'👥',orders:'🛒',topups:'🚚',services:'💼',packages:'⚙️',near:'📍',balance:'💳',ledger:'📘'}[key]||'•')}
function roleName(){return state.user?.role==='admin'?'مدير النظام':state.user?.role==='technician'?'فني معتمد':'عميل'}
function heroMetrics(items){return `<div class="hero-metrics">${items.map(x=>`<div class="metric-card"><div><div class="metric-label">${x.label}</div><div class="metric-value">${x.value}</div><div class="metric-up">↟ ${x.up||'نشط'}</div></div><div class="metric-icon">${x.icon}</div></div>`).join('')}</div>`}
function dashboardHero(title,sub,items){return `<div class="dashboard-hero"><div class="hero-inner"><div class="hero-title-row"><div><h1>👋 ${title}</h1><p>${sub}</p></div><button class="export-btn" onclick="toast('ميزة تصدير التقرير جاهزة للتطوير')">⇩ تصدير التقرير</button></div>${heroMetrics(items)}</div></div>`}
function activityBox(){return `<div class="dash-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h2>الأنشطة الأخيرة</h2><button class="btn ghost mini">عرض الكل</button></div><div class="activity-list"><div class="activity-item"><div><b>تم تسجيل مستخدم جديد</b><br><small class="muted">منذ 5 دقائق</small></div><span class="activity-icon">👤</span></div><div class="activity-item"><div><b>طلب خدمة كهرباء جديد</b><br><small class="muted">منذ 15 دقيقة</small></div><span class="activity-icon">⚡</span></div><div class="activity-item"><div><b>تم إكمال طلب صيانة</b><br><small class="muted">منذ 30 دقيقة</small></div><span class="activity-icon">✅</span></div><div class="activity-item"><div><b>إضافة خدمة جديدة</b><br><small class="muted">منذ ساعة</small></div><span class="activity-icon">➕</span></div></div></div>`}
function promoBox(title='طور خدماتك', text='قدم أفضل تجربة لعملائك وزد من أرباحك'){return `<div class="dash-card promo-card"><div class="promo-illustration">👨‍🔧</div><h2>${title}</h2><p class="muted">${text}</p><button class="btn ghost">← استكشف المزيد</button></div>`}
function categoriesBox(){let cats=[['أعمال البناء','🏗️','12 خدمة'],['الصيانة والإصلاح','🔧','18 خدمة'],['التنظيف','🧽','16 خدمة'],['نقل وتوصيل','🚚','10 خدمة'],['أخرى','•••','8 خدمات']];return `<div class="dash-card" style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h2>الفئات الرئيسية</h2><button class="btn ghost mini">عرض الكل</button></div><div class="category-row">${cats.map(c=>`<div class="category-card"><div><h3>${c[0]}</h3><small>${c[2]}</small></div><div class="cat-icon">${c[1]}</div></div>`).join('')}</div></div>`}
function chartsBox(){return `<div class="dash-grid"><div class="dash-card"><h2>أداء الشهر</h2><div class="chart-fake"></div></div><div class="dash-card"><h2>توزيع الطلبات</h2><div class="donut-fake"></div><div class="mini-list" style="margin-top:18px"><div class="mini-list-row"><span>مكتملة</span><b>65%</b></div><div class="mini-list-row"><span>قيد التنفيذ</span><b>25%</b></div><div class="mini-list-row"><span>ملغاة</span><b>10%</b></div></div></div><div class="dash-card"><h2>أعلى الخدمات طلباً</h2><div class="mini-list"><div class="mini-list-row"><span>كهرباء</span><b>342 طلب ⚡</b></div><div class="mini-list-row"><span>سباكة</span><b>298 طلب 💧</b></div><div class="mini-list-row"><span>تكييف</span><b>221 طلب ❄️</b></div></div></div></div>`}
function layout(title,menu,content){document.body.classList.add('dashboard-mode');let user=state.user||{};app.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>ص</span>صلّحلي</div><div class="admin-section-label">الرئيسية</div><div class="admin-menu">${menu.map(m=>`<button class="sidebtn ${state.tab===m[0]?'active':''}" onclick="state.tab='${m[0]}';dashboard()"><b>${m[1]}</b><span class="mi">${menuIcon(m[0])}</span></button>`).join('')}</div><div class="admin-section-label">النظام</div><div class="admin-menu"><button class="sidebtn" onclick="toast('الإعدادات لاحقاً')"><b>الإعدادات</b><span class="mi">⚙️</span></button><button class="sidebtn" onclick="logout()"><b>تسجيل الخروج</b><span class="mi">🚪</span></button></div><div class="admin-profile"><div class="avatar-sm">${(user.name||'ص').slice(0,1)}</div><div><b>${user.name||roleName()}</b><small>${user.email||roleName()}</small></div></div></aside><main class="admin-main"><div class="admin-top"><div class="admin-search">🔎 <input placeholder="ابحث هنا..." onkeydown="if(event.key==='Enter')toast('البحث التجريبي: '+this.value)"></div><div class="admin-actions"><button class="admin-icon-btn" onclick="toast('لا توجد إشعارات جديدة')">🔔</button><button class="admin-icon-btn" onclick="document.body.classList.toggle('dark-dash')">🌙</button><button class="admin-icon-btn logout" onclick="logout()">⏻</button></div></div>${content}</main></div>`}
async function custDash(){let menu=[['dash','طلب جديد'],['near','الفنيين الأقرب'],['orders','طلباتي']];let c=''; if(state.tab==='orders'){let j=await api('/api/requests');c=dashboardHero('لوحة العميل','تابع طلباتك واختر الفنيين المناسبين بسهولة',[{label:'طلباتي',value:j.requests.length,up:'طلبات نشطة',icon:'🛒'},{label:'فنيين قريبين',value:'24',up:'حسب منطقتك',icon:'👥'},{label:'خدمات متاحة',value:state.meta.services.length,up:'خدمة',icon:'📦'},{label:'التقييم',value:'4.8',up:'موثوق',icon:'⭐'}])+`<div class="dash-card"><h2>طلباتي</h2>${reqTable(j.requests)}</div>`}else if(state.tab==='near'){c=dashboardHero('الفنيين الأقرب لك','حدد موقعك وشاهد الفنيين حسب الخدمة والمنطقة',[{label:'فنيين متاحين',value:'24',up:'متصلين',icon:'👨‍🔧'},{label:'الخدمات',value:state.meta.services.length,up:'جاهزة',icon:'💼'},{label:'المدن',value:state.meta.cities.length,up:'مغطاة',icon:'📍'},{label:'سرعة الرد',value:'15د',up:'متوسط',icon:'⚡'}])+nearbyPage()}else c=dashboardHero('لوحة العميل','اطلب خدمة خلال دقيقة وتابعها من مكان واحد',[{label:'طلباتك',value:'0',up:'ابدأ الآن',icon:'🛠️'},{label:'فنيين',value:'856',up:'نشط',icon:'👥'},{label:'خدمات',value:state.meta.services.length,up:'متوفرة',icon:'📦'},{label:'دفع',value:'كاش',up:'سهل',icon:'💵'}])+`<div class="dash-grid"><div>${activityBox()}</div><div class="dash-card v6-form">${requestForm()}</div>${promoBox('اختر الفني الأنسب','قارن التقييمات ومناطق العمل قبل إرسال الطلب')}</div>${categoriesBox()}`;layout('لوحة العميل',menu,c); if(state.tab==='near') loadNearby();}
async function techDash(){let me=(await api('/api/me')).user;state.user=me;let menu=[['dash','الرئيسية'],['orders','الطلبات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']];let c='';if(state.tab==='orders'){let j=await api('/api/requests');c=dashboardHero('لوحة الفني','تابع الطلبات القريبة وقدم عروضك بسرعة',[{label:'طلبات مناسبة',value:j.requests.length,up:'جديدة',icon:'🛒'},{label:'رصيدك',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'تقييمك',value:stars(me.rating_avg),up:'ثقة',icon:'⭐'},{label:'الأعمال',value:me.completed_jobs||0,up:'مكتملة',icon:'✅'}])+`<div class="dash-card"><h2>الطلبات المناسبة</h2>${reqTable(j.requests)}</div>`}else if(state.tab==='balance'){c=dashboardHero('الرصيد والباقات','اشحن رصيدك وتابع خصم عمولة الطلبات',[{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'مجاني مستخدم',value:(me.free_orders_used||0)+'/2',up:'طلبات',icon:'🎁'},{label:'الباقات',value:state.meta.packages.length,up:'متاحة',icon:'📦'},{label:'الأعمال',value:me.completed_jobs||0,up:'منجزة',icon:'✅'}])+balancePage(me)}else if(state.tab==='topups'){let j=await api('/api/topups');c=dashboardHero('طلبات الشحن','تابع حالة دفعاتك وموافقات الإدارة',[{label:'طلبات الشحن',value:j.topups.length,up:'إجمالي',icon:'🚚'},{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'باقات',value:state.meta.packages.length,up:'متوفرة',icon:'📦'},{label:'حالة الحساب',value:'فعال',up:'نشط',icon:'✅'}])+topupTable(j.topups)}else if(state.tab==='ledger'){let j=await api('/api/ledger');c=dashboardHero('سجل الرصيد','كل عمليات الخصم والشحن في مكان واحد',[{label:'عمليات',value:j.ledger.length,up:'مسجلة',icon:'📘'},{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'حالي',icon:'💳'},{label:'طلبات',value:me.completed_jobs||0,up:'مكتملة',icon:'✅'},{label:'تقييم',value:stars(me.rating_avg),up:'فني',icon:'⭐'}])+ledgerTable(j.ledger)}else c=dashboardHero('لوحة الفني','إدارة احترافية لطلباتك ورصيدك وتقييمك',[{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'طلبات مجانية',value:(me.free_orders_used||0)+'/2',up:'مستخدمة',icon:'🎁'},{label:'التقييم',value:stars(me.rating_avg),up:'ثقة',icon:'⭐'},{label:'الأعمال',value:me.completed_jobs||0,up:'مكتملة',icon:'✅'}])+`<div class="dash-grid"><div>${activityBox()}</div>${promoBox('زِد فرص قبولك','حدّث صورتك وخدماتك ومناطق عملك لتحصل على طلبات أكثر')}<div class="dash-card"><h2>ملخص سريع</h2><div class="mini-list"><div class="mini-list-row"><span>حالة الحساب</span><b>فعال</b></div><div class="mini-list-row"><span>العمولة لكل طلب</span><b>2 د.أ</b></div><div class="mini-list-row"><span>الأعمال المكتملة</span><b>${me.completed_jobs||0}</b></div></div></div></div>${chartsBox()}`;layout('لوحة الفني',menu,c)}
async function admin(){let menu=[['dash','لوحة الإدارة'],['users','المستخدمين'],['orders','الطلبات'],['topups','شحن الفنيين'],['services','المهن والخدمات'],['packages','الباقات']];let c='';if(state.tab==='users'){let j=await api('/api/admin/users');c=dashboardHero('إدارة المستخدمين','تحكم بحسابات العملاء والفنيين وحالات التفعيل',[{label:'المستخدمين',value:j.users.length,up:'إجمالي',icon:'👥'},{label:'الفنيين',value:j.users.filter(u=>u.role==='technician').length,up:'معتمدين',icon:'👨‍🔧'},{label:'العملاء',value:j.users.filter(u=>u.role==='customer').length,up:'عملاء',icon:'🙂'},{label:'نشط',value:j.users.filter(u=>u.is_active).length,up:'حساب',icon:'✅'}])+usersTable(j.users)}else if(state.tab==='orders'){let j=await api('/api/requests');c=dashboardHero('إدارة الطلبات','راقب جميع طلبات المنصة وحالات التنفيذ',[{label:'كل الطلبات',value:j.requests.length,up:'إجمالي',icon:'🛒'},{label:'مفتوحة',value:j.requests.filter(r=>r.status==='open').length,up:'طلب',icon:'⚡'},{label:'مكتملة',value:j.requests.filter(r=>r.status==='completed').length,up:'طلب',icon:'✅'},{label:'قيد العمل',value:j.requests.filter(r=>r.status==='accepted').length,up:'طلب',icon:'🔧'}])+`<div class="dash-card"><h2>كل الطلبات</h2>${reqTable(j.requests)}</div>`}else if(state.tab==='topups'){let j=await api('/api/topups');c=dashboardHero('شحن الفنيين','راجع إثباتات الدفع وفعّل أرصدة الفنيين',[{label:'طلبات الشحن',value:j.topups.length,up:'إجمالي',icon:'🚚'},{label:'بانتظار',value:j.topups.filter(t=>t.status==='pending').length,up:'مراجعة',icon:'⏳'},{label:'موافق عليها',value:j.topups.filter(t=>t.status==='approved').length,up:'عملية',icon:'✅'},{label:'مرفوضة',value:j.topups.filter(t=>t.status==='rejected').length,up:'عملية',icon:'❌'}])+topupTable(j.topups)}else if(state.tab==='services')c=dashboardHero('المهن والخدمات','أضف خدمات جديدة ورتّبها بشكل جذاب داخل المنصة',[{label:'الخدمات',value:state.meta.services.length,up:'متاحة',icon:'💼'},{label:'الأيقونات',value:'جاهزة',up:'UI',icon:'🎨'},{label:'الفئات',value:'5',up:'رئيسية',icon:'📦'},{label:'النظام',value:'فعال',up:'مباشر',icon:'✅'}])+`<div class="dash-grid two"><div class="dash-card v6-form">${servicesAdmin()}</div>${promoBox('وسّع الخدمات','أضف مهن جديدة مثل الطاقة الشمسية، الزجاج، الأثاث وغيرها')}</div>${categoriesBox()}`;else if(state.tab==='packages')c=dashboardHero('إدارة الباقات','أنشئ باقات شحن للفنيين وحدد العمولة',[{label:'الباقات',value:state.meta.packages.length,up:'متاحة',icon:'📦'},{label:'الدفع',value:'بنكي',up:'تحويل',icon:'🏦'},{label:'العمولة',value:'2 د.أ',up:'افتراضي',icon:'💳'},{label:'حالة',value:'فعال',up:'جاهز',icon:'✅'}])+packagesAdmin();else{let j=await api('/api/admin/stats');let s=j.stats;c=dashboardHero('مرحباً بك في لوحة الإدارة','تحكم كامل في خدماتك وإحصائياتك من مكان واحد',[{label:'إجمالي الإيرادات',value:'25,680 د.ج',up:'24%',icon:'💲'},{label:'الطلبات الكلية',value:s.requests||0,up:'18%',icon:'🛍️'},{label:'المستخدمين',value:(s.customers||0)+(s.technicians||0),up:'12%',icon:'👥'},{label:'الخدمات النشطة',value:state.meta.services.length,up:'7%',icon:'📦'}])+`<div class="dash-grid"><div>${activityBox()}</div><div class="dash-card v6-form">${servicesAdmin()}</div>${promoBox('طور خدماتك','قدم أفضل الخدمات لعملائك وزد من أرباحك')}</div>${categoriesBox()}${chartsBox()}`}layout('لوحة الإدارة',menu,c)}


/* ===== Sallehly V7 Ultra Motion Logic ===== */
function showWelcomeModal(){
  if(sessionStorage.sallehlyWelcomeSeen) return;
  sessionStorage.sallehlyWelcomeSeen='1';
  const el=document.createElement('div'); el.className='welcome-overlay'; el.id='welcomeOverlay';
  el.innerHTML=`<div class="welcome-card"><button class="welcome-close" onclick="closeWelcome()">×</button><div class="welcome-logo">ص</div><h2>صلّحلي</h2><p>منصتك الذكية لطلب خدمات الصيانة بسرعة وثقة. اختر الخدمة، انشر الطلب، وتابع الفني من لوحة مرتبة وآمنة.</p><div class="welcome-actions"><button class="btn" onclick="closeWelcome();go('register')">ابدأ الآن</button><button class="btn ghost" onclick="closeWelcome();go('services')">استعرض الخدمات</button></div></div>`;
  document.body.appendChild(el);
}
function closeWelcome(){const el=document.getElementById('welcomeOverlay'); if(el){el.style.opacity='0';setTimeout(()=>el.remove(),220)}}
const __oldInit=init; init=async function(){await __oldInit(); setTimeout(showWelcomeModal,450)}
function serviceMarquee(){
 const list=(state.meta.services||[]).slice(0,16); const data=[...list,...list];
 return `<section class="service-marquee-wrap"><div class="service-marquee-head"><div><h2>الخدمات الأكثر طلباً</h2><span>تتحرك تلقائياً — اختر الخدمة المناسبة بسرعة</span></div><button class="btn ghost mini" onclick="go('services')">كل الخدمات</button></div><div class="service-marquee">${data.map(s=>`<div class="service-pill" onclick="go('${state.user?'dashboard':'register'}')"><div class="icon">${s.icon||'🔧'}</div><div><h3>${s.name}</h3><p>طلب سريع، فنيين قريبين، وتقييم واضح قبل الاختيار.</p></div></div>`).join('')}</div></section>`
}
function securityIdeas(){return `<div class="security-strip"><div class="security-item"><b>🔒 منع تداخل الطلبات</b><small>الفني لا يستطيع قبول طلب جديد قبل إنهاء الطلب النشط.</small></div><div class="security-item"><b>🧾 سجل عمليات</b><small>كل طلب، شحن رصيد، وخصم عمولة محفوظ داخل النظام.</small></div><div class="security-item"><b>🛡️ حماية رفع الملفات</b><small>قبول صور محددة فقط وحجم محدود لإثبات الدفع وصورة الفني.</small></div><div class="security-item"><b>⭐ تقييم بعد الإنجاز</b><small>العميل يقيّم الفني بعد اكتمال الطلب لرفع الثقة.</small></div></div>`}
const __oldHome=home; home=function(){__oldHome(); const sec=document.querySelector('.services-section'); if(sec) sec.insertAdjacentHTML('beforebegin',serviceMarquee()+securityIdeas());}
const __oldCustDash=custDash; custDash=async function(){await __oldCustDash(); const main=document.querySelector('.admin-main'); if(main && state.tab==='dash'){const hero=main.querySelector('.dashboard-hero'); if(hero) hero.insertAdjacentHTML('afterend',serviceMarquee()+securityIdeas());}}
const __oldTechDash=techDash; techDash=async function(){await __oldTechDash(); const main=document.querySelector('.admin-main'); if(main && state.tab==='dash'){const hero=main.querySelector('.dashboard-hero'); if(hero) hero.insertAdjacentHTML('afterend',`<div class="lock-note">⚠️ نظام صلّحلي: لا يمكنك قبول طلب جديد أثناء وجود طلب قيد التنفيذ أو تم اختيارك له. أنهي الطلب الحالي أولاً.</div>`+securityIdeas());}}
const __oldAdmin=admin; admin=async function(){await __oldAdmin(); const main=document.querySelector('.admin-main'); if(main && state.tab==='dash'){const hero=main.querySelector('.dashboard-hero'); if(hero) hero.insertAdjacentHTML('afterend',securityIdeas());}}

/* =========================
   Sallehly V8 Governorates + Welcome Fix
   ========================= */
const JORDAN_AREAS = {
  'عمان':['القويسمة','الجبيهة','طبربور','صويلح','خلدا','تلاع العلي','مرج الحمام','ضاحية الياسمين','البيادر','الدوار السابع','الدوار الثامن','أبو نصير','شفا بدران','النصر','ماركا','الهاشمي الشمالي','جبل الحسين','جبل عمان','عبدون','دابوق','الرابية','أم أذينة','وادي السير','ناعور','المقابلين','سحاب','اليادودة','خريبة السوق'],
  'الزرقاء':['الزرقاء الجديدة','الجبل الأبيض','الرصيفة','ياجوز','الغويرية','الهاشمية','بيرين','الضليل','حي معصوم','حي الأمير محمد','الزواهرة'],
  'إربد':['وسط البلد','الحي الشرقي','الحي الجنوبي','الحي الشمالي','الصريح','الحصن','الرمثا','بني كنانة','كفر يوبا','بيت راس','أيدون','كفر أسد','الطيبة'],
  'البلقاء':['السلط','الصبيحي','الفحيص','ماحص','عين الباشا','دير علا','الشونة الجنوبية','زي','يرقا','علان'],
  'الكرك':['الكرك','المزار الجنوبي','مؤتة','المرج','الثنية','القصر','غور الصافي','عي','الربة','فقوع'],
  'معان':['معان','الشوبك','وادي موسى','البتراء','الحسينية','الجفر','أذرح','إيل'],
  'الطفيلة':['الطفيلة','بصيرا','القادسية','الحسا','العين البيضاء','غرندل','الرشادية'],
  'العقبة':['العقبة','القويرة','وادي عربة','الديسة','رحمة','الشامية','المحدود'],
  'جرش':['جرش','سوف','ساكب','برما','كفر خل','المعراض','المصطبة'],
  'عجلون':['عجلون','كفرنجة','عنجره','عبين','صخرة','اشتفينا','رأس منيف'],
  'مادبا':['مادبا','ذيبان','ماعين','الفيصلية','جرينة','مليح','لب'],
  'المفرق':['المفرق','البادية الشمالية','رحاب','الخالدية','أم الجمال','بلعما','سما السرحان','منشية بني حسن']
};
function governorateOptions(selected='عمان'){
  return Object.keys(JORDAN_AREAS).map(c=>`<option ${c===selected?'selected':''}>${c}</option>`).join('');
}
function areaOptions(city='عمان', selected=''){
  return (JORDAN_AREAS[city]||[]).map(a=>`<option ${a===selected?'selected':''}>${a}</option>`).join('') + `<option value="أخرى">أخرى</option>`;
}
function bindAreaSelect(cityId, areaId, otherId){
  const city=document.getElementById(cityId), area=document.getElementById(areaId), other=otherId?document.getElementById(otherId):null;
  if(!city||!area) return;
  const refresh=()=>{ area.innerHTML=areaOptions(city.value); if(other) other.classList.toggle('hide', area.value!=='أخرى'); };
  city.addEventListener('change', refresh);
  area.addEventListener('change', ()=>{ if(other) other.classList.toggle('hide', area.value!=='أخرى'); });
  refresh();
}
function selectedArea(areaId, otherId){
  const a=document.getElementById(areaId)?.value||'';
  const o=document.getElementById(otherId)?.value?.trim()||'';
  return a==='أخرى'?o:a;
}
function showWelcomeModalForce(){
  const old=document.getElementById('welcomeOverlay'); if(old) old.remove();
  const el=document.createElement('div'); el.className='welcome-overlay v8-welcome'; el.id='welcomeOverlay';
  el.innerHTML=`<div class="welcome-card v8-welcome-card">
    <button class="welcome-close" onclick="closeWelcome()">×</button>
    <div class="welcome-logo big-logo">ص</div>
    <h2>صلّحلي</h2>
    <p>مرحباً بك في منصة صلّحلي. اختر الخدمة، حدد المحافظة والمنطقة، واترك النظام يرشح لك الفنيين الأقرب والأنسب.</p>
    <div class="welcome-features">
      <div><b>ملف وليد</b><small>اعمل إجراءاتك بأمان</small></div>
      <div><b>فني واحد</b><small>لا يقبل طلب ثاني قبل إنهاء الحالي</small></div>
      <div><b>مناطق دقيقة</b><small>كل محافظات الأردن ومناطقها</small></div>
    </div>
    <div class="welcome-actions"><button class="btn" onclick="closeWelcome();go('${state.user?'dashboard':'register'}')">متابعة إلى المنصة</button><button class="btn ghost" onclick="closeWelcome()">إغلاق</button></div>
  </div>`;
  document.body.appendChild(el);
}
setTimeout(()=>{ if(!state.user) showWelcomeModalForce(); }, 900);

requestForm=function(){return `<div class="card bluehint"><h2>طلب خدمة جديد</h2><p class="muted">حدد المحافظة ثم اختر المنطقة من القائمة حتى تظهر لك نتائج أدق للفنيين القريبين.</p><form class="form two" onsubmit="createReq(event)"><div class="field"><label>الخدمة</label><select id="qservice">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="qcity">${governorateOptions(state.user?.city||'عمان')}</select></div><div class="field"><label>منطقة السكن</label><select id="qarea"></select></div><div class="field hide" id="qareaOtherWrap"><label>اكتب المنطقة</label><input id="qareaOther" placeholder="اكتب اسم المنطقة"></div><div class="field"><label>الوقت المطلوب</label><input id="qtime" placeholder="اليوم مساءً"></div><div class="field" style="grid-column:1/-1"><label>وصف المشكلة</label><textarea id="qdesc" required placeholder="مثال: المكيف لا يبرد وأحتاج فني اليوم"></textarea></div><div class="field" style="grid-column:1/-1"><button type="button" class="btn ghost" onclick="useGPS('request')">📍 حدد موقعي الآن</button><small class="muted">الموقع يساعد الفنيين على معرفة قربك قبل قبول الطلب.</small><div id="requestMap">${mapBox(state.gps?.lat,state.gps?.lng)}</div></div><button class="btn">نشر الطلب</button></form></div><br><div id="techs"></div>`}
createReq=async function(e){e.preventDefault();try{await api('/api/requests',{method:'POST',body:JSON.stringify({service:qservice.value,city:qcity.value,area:selectedArea('qarea','qareaOther'),preferred_time:qtime.value,description:qdesc.value,lat:state.gps?.lat||'',lng:state.gps?.lng||''})});toast('تم نشر الطلب');state.tab='orders';dashboard()}catch(err){toast(err.message)}}
nearbyPage=function(){return `<div class="card bluehint"><h2>الفنيين الأقرب لك</h2><p class="muted">اختر المحافظة والمنطقة، ثم الخدمة المطلوبة. النظام يطابق الفنيين حسب مناطق عملهم وتقييمهم.</p><div class="form three"><div class="field"><label>الخدمة</label><select id="nservice" onchange="loadNearby()">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="ncity" onchange="bindAreaSelect('ncity','narea');loadNearby()">${governorateOptions(state.user?.city||'عمان')}</select></div><div class="field"><label>المنطقة</label><select id="narea" onchange="loadNearby()"></select></div><button class="btn ghost" onclick="useGPS('near')">📍 تحديد موقعي GPS</button></div><div id="nearMap">${mapBox(state.gps?.lat,state.gps?.lng)}</div></div><br><div id="nearList" class="grid"></div>`}
loadNearby=async function(){try{let service=$('#nservice')?.value||state.meta.services[0]?.name, city=$('#ncity')?.value||state.user.city||'عمان', area=$('#narea')?.value||'';let j=await api(`/api/technicians?service=${encodeURIComponent(service)}&city=${encodeURIComponent(city)}&lat=${state.gps?.lat||''}&lng=${state.gps?.lng||''}`);let techs=(j.technicians||[]).filter(t=>!area||area==='أخرى'||String(t.areas||'').includes(area)||String(t.city||'').includes(city));let box=$('#nearList'); if(!box)return; box.innerHTML=techs.length?techs.map(t=>`<div class="card techcard"><div class="techhead">${t.avatar_url?`<img class="techAvatar" src="${t.avatar_url}">`:`<div class="techAvatar fallback">ف</div>`}<div><h3>${t.name}</h3><div>${stars(t.rating_avg)} <small class="muted">(${t.rating_count||0} تقييم)</small></div></div></div><p><b>الخدمات:</b> ${t.services||'-'}</p><p><b>المحافظة:</b> ${t.city||'-'}</p><p><b>المناطق:</b> ${t.areas||'-'}</p><p><b>أعمال مكتملة:</b> ${t.completed_jobs||0}</p><span class="status">مناسب لـ ${city}${area?' - '+area:''}</span></div>`).join(''):`<div class="card empty">لا يوجد فنيين مناسبين حالياً لهذه الخدمة والمنطقة.</div>`}catch(e){toast(e.message)}}
register=function(role='customer'){app.innerHTML=`<div class="page"><div class="card" style="max-width:860px;margin:auto"><h1>إنشاء حساب</h1><form class="form two" onsubmit="doRegister(event)"><div class="field"><label>نوع الحساب</label><select id="role" onchange="toggleTech()"><option value="customer">عميل</option><option value="technician">فني</option></select></div><div class="field"><label>الاسم الكامل</label><input id="name" placeholder="مثال: أحمد محمد" required minlength="2"></div><div class="field techOnly"><label>الصورة الشخصية للفني</label><input id="avatar" type="file" accept="image/png,image/jpeg,image/webp"><small class="muted">مطلوبة للفني فقط حتى يظهر للعميل بشكل موثوق.</small></div><div class="field"><label>البريد الإلكتروني</label><input id="remail" type="email" required></div><div class="field"><label>رقم الهاتف</label><input id="phone" placeholder="0791234567" required></div><div class="field"><label>كلمة السر</label><input id="rpassword" type="password" required minlength="8"></div><div class="field"><label>المحافظة</label><select id="city">${governorateOptions('عمان')}</select></div><div class="field"><label>منطقة السكن</label><select id="customerArea"></select></div><div class="field techOnly"><label>الرقم الوطني</label><input id="national" placeholder="10 أرقام"></div><div class="field techOnly"><label>الخدمات</label><select id="srv" multiple size="5">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field techOnly"><label>مناطق العمل</label><select id="areas" multiple size="7"></select><small class="muted">اختر أكثر من منطقة بزر Ctrl. تتغير حسب المحافظة.</small></div><button class="btn">إنشاء الحساب</button></form></div></div>`;$('#role').value=role;toggleTech();bindAreaSelect('city','customerArea');const city=$('#city'), areas=$('#areas');function refreshWorkAreas(){areas.innerHTML=areaOptions(city.value).replace('<option value="أخرى">أخرى</option>','')}city.addEventListener('change',refreshWorkAreas);refreshWorkAreas();}
doRegister=async function(e){e.preventDefault();try{const role=$('#role').value;const fd=new FormData();fd.append('role',role);fd.append('name',$('#name').value.trim());fd.append('email',$('#remail').value.trim());fd.append('phone',$('#phone').value.trim());fd.append('password',$('#rpassword').value);fd.append('city',$('#city').value);fd.append('national_number',$('#national')?$('#national').value.trim():'');fd.append('services',vals('#srv').join(','));fd.append('areas', role==='technician' ? vals('#areas').join(',') : (selectedArea('regArea','regAreaOther') || $('#regArea')?.value || ''));if(role==='technician'&&!$('#avatar').files[0]) throw new Error('الرجاء اختيار صورة شخصية للفني');if($('#avatar')&&$('#avatar').files[0])fd.append('avatar',$('#avatar').files[0]);let j=await api('/api/auth/register',{method:'POST',body:fd});state.user=j.user;state.token=j.token;localStorage.token=j.token;toast('تم إنشاء الحساب');dashboard(); if(localStorage.pendingService){ const ps=localStorage.pendingService; localStorage.removeItem('pendingService'); setTimeout(()=>{ if(state.user?.role==='customer'){ state.tab='near'; dashboard(); setTimeout(()=>{ if($('#searchTechQ')) $('#searchTechQ').value=ps; if($('#searchService')) $('#searchService').value=ps; searchTechnicians(); },180); } },250); }}catch(err){toast(err.message)}}
const __v8OldCustDash=custDash; custDash=async function(){await __v8OldCustDash(); if(state.tab==='dash') bindAreaSelect('qcity','qarea','qareaOtherWrap'); if(state.tab==='near'){bindAreaSelect('ncity','narea'); loadNearby();}}
const __v8OldUseGPS=useGPS; useGPS=function(mode='near'){ if(!navigator.geolocation)return toast('المتصفح لا يدعم GPS'); navigator.geolocation.getCurrentPosition(pos=>{state.gps={lat:pos.coords.latitude.toFixed(6),lng:pos.coords.longitude.toFixed(6)};let c=cityFromGPS(pos.coords.latitude,pos.coords.longitude); if($('#ncity')){$('#ncity').value=c; bindAreaSelect('ncity','narea');} if($('#qcity')){$('#qcity').value=c; bindAreaSelect('qcity','qarea','qareaOtherWrap');} if($('#nearMap'))$('#nearMap').innerHTML=mapBox(state.gps.lat,state.gps.lng); if($('#requestMap'))$('#requestMap').innerHTML=mapBox(state.gps.lat,state.gps.lng); toast('تم تحديد موقعك: '+c); if(mode==='near')loadNearby();},()=>toast('لم يتم السماح بالوصول للموقع'),{enableHighAccuracy:true,timeout:10000});}

/* =========================
   Sallehly V9 Real UX Fixes
   - customer has no reports / recent admin activity / 4 stats boxes
   - working settings for name + password
   - technician search + profile details + direct request + chat
   - services appear in top moving strip and after admin adds them
   ========================= */
function simpleHero(title, sub){
  return `<div class="dashboard-hero simple-hero"><div class="hero-inner"><div class="hero-title-row"><div><h1>👋 ${title}</h1><p>${sub}</p></div></div></div></div>`;
}
function techSearchBox(){
  return `<div class="dash-card tech-search-card">
    <div class="section-title-row"><div><h2>ابحث عن فني</h2><p class="muted">اكتب مثل: تكييف، كهرباء، سباكة — ثم اختر المحافظة والمنطقة.</p></div></div>
    <div class="form four compact-form">
      <div class="field"><label>كلمة البحث</label><input id="searchTechQ" placeholder="مثال: تكييف" onkeydown="if(event.key==='Enter')searchTechnicians()"></div>
      <div class="field"><label>الخدمة</label><select id="searchService">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div>
      <div class="field"><label>المحافظة</label><select id="searchCity">${governorateOptions(state.user?.city||'عمان')}</select></div>
      <div class="field"><label>المنطقة</label><select id="searchArea"></select></div>
    </div>
    <div class="search-actions"><button class="btn" onclick="searchTechnicians()">🔎 بحث عن فني</button><button class="btn ghost" onclick="useGPS('search')">📍 حسب موقعي</button></div>
  </div><div id="techSearchResults" class="tech-result-grid"></div>`;
}
async function searchTechnicians(){
  try{
    const q=$('#searchTechQ')?.value?.trim()||'';
    const service=$('#searchService')?.value||q||state.meta.services[0]?.name||'';
    const city=$('#searchCity')?.value||state.user?.city||'عمان';
    const area=$('#searchArea')?.value||'';
    const url=`/api/technicians?q=${encodeURIComponent(q)}&service=${encodeURIComponent(service)}&city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`;
    const j=await api(url); const box=$('#techSearchResults'); if(!box)return;
    const techs=j.technicians||[];
    box.innerHTML=techs.length?techs.map(t=>techCard(t, service, city, area)).join(''):`<div class="dash-card empty">لا يوجد فنيين مناسبين الآن. جرّب خدمة أو منطقة ثانية.</div>`;
  }catch(e){toast(e.message)}
}
function techCard(t, service, city, area){
  const av=t.avatar_url?`<img class="techAvatar" src="${t.avatar_url}" onerror="this.outerHTML='<div class=\'techAvatar fallback\'>ف</div>'">`:`<div class="techAvatar fallback">ف</div>`;
  return `<div class="dash-card tech-card-pro">
    <div class="tech-card-top">${av}<div><h3>${t.name}</h3><div>${stars(t.rating_avg)} <small class="muted">${t.rating_count||0} تقييم</small></div></div></div>
    <div class="tech-tags"><span>${t.city||city}</span><span>${area||'كل المناطق'}</span><span>${t.completed_jobs||0} عمل</span></div>
    <p><b>الخدمات:</b> ${t.services||'-'}</p><p><b>مناطق العمل:</b> ${t.areas||'-'}</p>
    <div class="actions"><button class="btn ghost" onclick='openTechDetails(${JSON.stringify(t).replace(/'/g,"&#39;")}, ${JSON.stringify(service)}, ${JSON.stringify(city)}, ${JSON.stringify(area)})'>عرض التفاصيل</button><button class="btn" onclick="directRequest(${t.id},'${String(service).replaceAll("'",'')}','${String(city).replaceAll("'",'')}','${String(area).replaceAll("'",'')}')">إنشاء طلب</button></div>
  </div>`;
}
function openTechDetails(t, service, city, area){
  const old=document.getElementById('techDetailsOverlay'); if(old)old.remove();
  const av=t.avatar_url?`<img class="tech-modal-avatar" src="${t.avatar_url}" onerror="this.outerHTML='<div class=\'tech-modal-avatar fallback\'>ف</div>'">`:`<div class="tech-modal-avatar fallback">ف</div>`;
  const el=document.createElement('div'); el.className='welcome-overlay'; el.id='techDetailsOverlay';
  el.innerHTML=`<div class="welcome-card tech-details-modal"><button class="welcome-close" onclick="document.getElementById('techDetailsOverlay').remove()">×</button>${av}<h2>${t.name}</h2><p class="muted">${stars(t.rating_avg)} — ${t.rating_count||0} تقييم — ${t.completed_jobs||0} عمل مكتمل</p><div class="mini-list"><div class="mini-list-row"><span>المحافظة</span><b>${t.city||'-'}</b></div><div class="mini-list-row"><span>الخدمات</span><b>${t.services||'-'}</b></div><div class="mini-list-row"><span>المناطق</span><b>${t.areas||'-'}</b></div></div><div class="welcome-actions"><button class="btn" onclick="document.getElementById('techDetailsOverlay').remove();directRequest(${t.id},'${String(service).replaceAll("'",'')}','${String(city).replaceAll("'",'')}','${String(area).replaceAll("'",'')}')">إنشاء طلب مع هذا الفني</button><button class="btn ghost" onclick="document.getElementById('techDetailsOverlay').remove()">إغلاق</button></div></div>`;
  document.body.appendChild(el);
}
async function directRequest(techId, service, city, area){
  const desc=prompt('اكتب وصف المشكلة حتى يقدر الفني يفهم الطلب:', `أحتاج خدمة ${service} في ${city}${area?' - '+area:''}`);
  if(!desc || desc.trim().length<10) return toast('الوصف لازم يكون 10 أحرف على الأقل');
  try{
    const j=await api('/api/requests',{method:'POST',body:JSON.stringify({technician_id:techId,service,city,area,description:desc,preferred_time:'أقرب وقت',lat:state.gps?.lat||'',lng:state.gps?.lng||''})});
    toast('تم إنشاء الطلب وفتح المحادثة');
    chat(j.request.id);
  }catch(e){toast(e.message)}
}
function settingsPage(){
  const u=state.user||{};
  return `<div class="settings-grid"><div class="dash-card"><h2>تعديل الحساب</h2><form class="form two" onsubmit="saveProfile(event)"><div class="field"><label>الاسم</label><input id="setName" value="${u.name||''}" required></div><div class="field"><label>الهاتف</label><input id="setPhone" value="${u.phone||''}" required></div><div class="field"><label>المحافظة</label><select id="setCity">${governorateOptions(u.city||'عمان')}</select></div><div class="field"><label>المنطقة</label><select id="setArea"></select></div><button class="btn">حفظ التعديلات</button></form></div><div class="dash-card"><h2>تغيير كلمة السر</h2><form class="form" onsubmit="changePassword(event)"><div class="field"><label>كلمة السر الحالية</label><input id="oldPass" type="password" required></div><div class="field"><label>كلمة السر الجديدة</label><input id="newPass" type="password" minlength="8" required></div><button class="btn">تحديث كلمة السر</button></form><p class="muted">نصيحة: استخدم 8 أحرف على الأقل مع أرقام ورموز.</p></div></div>`;
}
async function saveProfile(e){e.preventDefault();try{const j=await api('/api/me/profile',{method:'POST',body:JSON.stringify({name:setName.value,phone:setPhone.value,city:setCity.value,area:setArea.value,areas:setArea.value})});state.user=j.user;toast('تم تحديث الحساب');dashboard()}catch(err){toast(err.message)}}
async function changePassword(e){e.preventDefault();try{await api('/api/me/password',{method:'POST',body:JSON.stringify({current_password:oldPass.value,new_password:newPass.value})});oldPass.value='';newPass.value='';toast('تم تغيير كلمة السر')}catch(err){toast(err.message)}}
// Override layout: settings button is real now
layout=function(title,menu,content){document.body.classList.add('dashboard-mode');let user=state.user||{};app.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>ص</span>صلّحلي</div><div class="admin-section-label">الرئيسية</div><div class="admin-menu">${menu.map(m=>`<button class="sidebtn ${state.tab===m[0]?'active':''}" onclick="state.tab='${m[0]}';dashboard()"><b>${m[1]}</b><span class="mi">${menuIcon(m[0])}</span></button>`).join('')}</div><div class="admin-section-label">النظام</div><div class="admin-menu"><button class="sidebtn ${state.tab==='settings'?'active':''}" onclick="state.tab='settings';dashboard()"><b>الإعدادات</b><span class="mi">⚙️</span></button><button class="sidebtn" onclick="logout()"><b>تسجيل الخروج</b><span class="mi">🚪</span></button></div><div class="admin-profile"><div class="avatar-sm">${(user.name||'ص').slice(0,1)}</div><div><b>${user.name||roleName()}</b><small>${user.email||roleName()}</small></div></div></aside><main class="admin-main"><div class="admin-top"><div class="admin-search">🔎 <input placeholder="ابحث هنا..." onkeydown="if(event.key==='Enter')toast('ابحث من صفحة الفنيين الأقرب أو من إدارة الطلبات')"></div><div class="admin-actions"><button class="admin-icon-btn" onclick="toast('لا توجد إشعارات جديدة')">🔔</button><button class="admin-icon-btn" onclick="document.body.classList.toggle('dark-dash')">🌙</button><button class="admin-icon-btn logout" onclick="logout()">⏻</button></div></div>${content}</main></div>`}
// Customer dashboard rebuilt cleanly
custDash=async function(){
  let menu=[['dash','طلب جديد'],['near','البحث عن فني'],['orders','طلباتي']];
  let c='';
  if(state.tab==='settings') c=simpleHero('الإعدادات','غيّر اسمك، منطقتك، أو كلمة السر')+settingsPage();
  else if(state.tab==='orders'){let j=await api('/api/requests');c=simpleHero('طلباتي','تابع الطلبات والمحادثات مع الفنيين')+`<div class="dash-card"><h2>طلباتي</h2>${reqTable(j.requests)}</div>`}
  else if(state.tab==='near'){c=simpleHero('البحث عن فني','ابحث حسب الخدمة والمنطقة وافتح ملف الفني قبل إنشاء الطلب')+techSearchBox();}
  else c=simpleHero('لوحة العميل','اطلب خدمة أو ابحث عن الفني المناسب حسب منطقتك')+serviceMarquee()+`<div class="customer-main-grid"><div class="dash-card v6-form">${requestForm()}</div><div>${techSearchBox()}</div></div>`;
  layout('لوحة العميل',menu,c);
  if(state.tab==='dash'){bindAreaSelect('qcity','qarea','qareaOtherWrap'); bindAreaSelect('searchCity','searchArea');}
  if(state.tab==='near'){bindAreaSelect('searchCity','searchArea'); setTimeout(searchTechnicians,100)}
  if(state.tab==='settings') bindAreaSelect('setCity','setArea');
}
// Technician/Admin settings support and keep admin activity only for admin
const __v9TechDashBase=techDash;
techDash=async function(){ if(state.tab==='settings'){layout('لوحة الفني',[['dash','الرئيسية'],['orders','الطلبات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']], simpleHero('الإعدادات','عدّل حسابك وكلمة السر')+settingsPage()); bindAreaSelect('setCity','setArea'); return;} await __v9TechDashBase();}
const __v9AdminBase=admin;
admin=async function(){ if(state.tab==='settings'){layout('لوحة الإدارة',[['dash','لوحة الإدارة'],['users','المستخدمين'],['orders','الطلبات'],['topups','شحن الفنيين'],['services','المهن والخدمات'],['packages','الباقات']], simpleHero('الإعدادات','إدارة بيانات حساب المدير')+settingsPage()); bindAreaSelect('setCity','setArea'); return;} await __v9AdminBase();}
// Better request form: no report/admin widgets, and show search results after selecting service
requestForm=function(){return `<div class="bluehint"><h2>طلب خدمة جديد</h2><p class="muted">حدد الخدمة والمحافظة والمنطقة، ثم اكتب وصف المشكلة.</p><form class="form two" onsubmit="createReq(event)"><div class="field"><label>الخدمة</label><select id="qservice" onchange="syncSearchFromRequest()">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="qcity" onchange="bindAreaSelect('qcity','qarea','qareaOtherWrap');syncSearchFromRequest()">${governorateOptions(state.user?.city||'عمان')}</select></div><div class="field"><label>منطقة السكن</label><select id="qarea" onchange="syncSearchFromRequest()"></select></div><div class="field hide" id="qareaOtherWrap"><label>اكتب المنطقة</label><input id="qareaOther" placeholder="اكتب اسم المنطقة"></div><div class="field"><label>الوقت المطلوب</label><input id="qtime" placeholder="اليوم مساءً"></div><div class="field" style="grid-column:1/-1"><label>وصف المشكلة</label><textarea id="qdesc" required placeholder="مثال: المكيف لا يبرد وأحتاج فني اليوم"></textarea></div><div class="field" style="grid-column:1/-1"><button type="button" class="btn ghost" onclick="useGPS('request')">📍 حدد موقعي الآن</button><small class="muted">الموقع يساعد الفنيين على معرفة قربك قبل قبول الطلب.</small><div id="requestMap">${mapBox(state.gps?.lat,state.gps?.lng)}</div></div><button class="btn">نشر الطلب العام</button></form></div>`}
function syncSearchFromRequest(){ if($('#searchService')&&$('#qservice')) $('#searchService').value=$('#qservice').value; if($('#searchCity')&&$('#qcity')) {$('#searchCity').value=$('#qcity').value; bindAreaSelect('searchCity','searchArea');} if($('#searchArea')&&$('#qarea')) $('#searchArea').value=$('#qarea').value; }
// Override nearbyPage to use same search component
nearbyPage=function(){return techSearchBox()}
loadNearby=searchTechnicians;
// Force welcome every browser session once and show for logged-in too if not seen
setTimeout(()=>{ if(!sessionStorage.sallehlyV9Welcome){sessionStorage.sallehlyV9Welcome='1'; showWelcomeModalForce();}},700);


/* ===== Sallehly V10 Professional Functional Layer ===== */
function v10ApplyTheme(){ if(localStorage.sallehlyTheme==='dark') document.body.classList.add('dark-dash'); else document.body.classList.remove('dark-dash'); }
function v10ToggleTheme(){ localStorage.sallehlyTheme = document.body.classList.contains('dark-dash') ? 'light' : 'dark'; v10ApplyTheme(); toast(localStorage.sallehlyTheme==='dark'?'تم تفعيل الدارك مود':'تم تفعيل الوضع الفاتح'); }
function v10Sound(type='notify'){
  try{ const AudioCtx=window.AudioContext||window.webkitAudioContext; const ctx=new AudioCtx(); const o=ctx.createOscillator(); const g=ctx.createGain(); const map={notify:[660,.08],request:[880,.12],message:[520,.09],done:[740,.16],logout:[330,.1]}; const [f,d]=map[type]||map.notify; o.frequency.value=f; o.type='sine'; g.gain.setValueAtTime(.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.16,ctx.currentTime+.01); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+d+.02); }catch(e){}
}
function v10Notify(text='تنبيه جديد',type='notify'){ v10Sound(type); const b=document.querySelector('.bell-btn'); if(b){b.classList.add('sound-on'); setTimeout(()=>b.classList.remove('sound-on'),700)} toast(text); }
const __v10OldToast=toast; toast=function(t){ __v10OldToast(t); };
function v10Hero(title,desc){return `<section class="v10-clean-hero"><h1>${title}</h1><p>${desc}</p></section>`}
function v10TopStrip(){return serviceMarquee().replace('service-marquee-wrap','service-marquee-wrap v10-service-strip')}
function v10PublicActions(){return `<div class="hero-actions"><button class="btn big" onclick="go('register')">إنشاء حساب</button><button class="btn ghost big" onclick="go('login')">تسجيل دخول</button></div>`}
login=function(){app.innerHTML=`<div class="page"><div class="card v10-auth-card"><div class="v10-auth-wrap"><div class="v10-auth-side"><div class="welcome-logo">ص</div><h1>تسجيل دخول صلّحلي</h1><p>ادخل إلى حسابك كعميل أو فني أو أدمن، وتابع الطلبات والشات والخدمات من لوحة واحدة.</p><div class="welcome-features"><div><b>آمن</b><small>صلاحيات حسب الدور</small></div><div><b>سريع</b><small>طلبات مباشرة</small></div><div><b>مرتب</b><small>واجهة احترافية</small></div></div></div><div class="v10-auth-form"><h1>تسجيل الدخول</h1><form class="form" onsubmit="doLogin(event)"><div class="field"><label>البريد الإلكتروني</label><input id="email" type="email" required></div><div class="field"><label>كلمة السر</label><input id="password" type="password" required></div><button class="btn">تسجيل دخول</button><p class="muted">حساب الإدارة لا يظهر للعامة. اطلب بيانات الدخول من مالك المنصة.</p></form><button class="btn ghost" onclick="go('register')">إنشاء حساب جديد</button></div></div></div></div>`}
register=function(role='customer'){app.innerHTML=`<div class="page"><div class="card v10-auth-card"><div class="v10-auth-wrap"><div class="v10-auth-side"><div class="welcome-logo">ص</div><h1>انضم إلى صلّحلي</h1><p>أنشئ حساب عميل لطلب الخدمات، أو حساب فني لاستقبال الطلبات حسب منطقتك ومهنتك.</p></div><div class="v10-auth-form"><h1>إنشاء حساب</h1><form class="form two" onsubmit="doRegister(event)"><div class="field"><label>نوع الحساب</label><select id="role" onchange="toggleTech()"><option value="customer">عميل</option><option value="technician">فني</option></select></div><div class="field"><label>الاسم الكامل</label><input id="name" placeholder="مثال: أحمد محمد" required minlength="2"></div><div class="field techOnly"><label>الصورة الشخصية للفني</label><input id="avatar" type="file" accept="image/png,image/jpeg,image/webp"><small class="muted">مطلوبة للفني حتى يظهر للعميل.</small></div><div class="field"><label>البريد الإلكتروني</label><input id="remail" type="email" required></div><div class="field"><label>رقم الهاتف</label><input id="phone" placeholder="0791234567" required></div><div class="field"><label>كلمة السر</label><input id="rpassword" type="password" required minlength="8"></div><div class="field"><label>المحافظة</label><select id="city">${governorateOptions('عمان')}</select></div><div class="field"><label>المنطقة</label><select id="regArea"></select></div><div class="field hide" id="regAreaOtherWrap"><label>اكتب المنطقة</label><input id="regAreaOther" placeholder="اكتب اسم المنطقة"></div><div class="field techOnly"><label>الرقم الوطني</label><input id="national" placeholder="10 أرقام"></div><div class="field techOnly"><label>الخدمات</label><select id="srv" multiple size="5">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field techOnly"><label>مناطق العمل</label><select id="areas" multiple size="5">${Object.keys(JORDAN_AREAS).map(c=>`<option>${c}</option>`).join('')}</select></div><button class="btn">إنشاء حساب</button></form><button class="btn ghost" onclick="go('login')">عندي حساب</button></div></div></div></div>`;$('#role').value=role;toggleTech();bindAreaSelect('city','regArea','regAreaOtherWrap')}
function techSearchBox(){
  return `<div class="dash-card tech-search-card v10-search-card"><div class="v10-search-head"><div><h2 class="v10-search-title">ابحث عن فني</h2><p class="muted">اكتب الخدمة داخل خانة البحث، ثم اختر المحافظة والمنطقة.</p></div></div><div class="v10-search-line"><div class="field"><label>خانة البحث</label><input id="searchTechQ" placeholder="مثال: تكييف، كهرباء، سباكة" oninput="v10AutoService()" onkeydown="if(event.key==='Enter')searchTechnicians()"></div><div class="field"><label>الخدمة</label><select id="searchService">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="searchCity" onchange="bindAreaSelect('searchCity','searchArea')">${governorateOptions(state.user?.city||'عمان')}</select></div><div class="field"><label>المنطقة</label><select id="searchArea"></select></div><button class="btn" onclick="searchTechnicians()">🔎 بحث</button></div><button class="btn ghost v10-gps-btn" onclick="useGPS('search')">📍 حسب موقعي</button></div><div id="techSearchResults" class="tech-result-grid"></div>`;
}
function v10AutoService(){const q=($('#searchTechQ')?.value||'').trim(); if(!q||!$('#searchService'))return; const found=(state.meta.services||[]).find(s=>s.name.includes(q)||q.includes(s.name)||String(s.name).includes(q)); if(found) $('#searchService').value=found.name;}
requestForm=function(){return `<div class="bluehint"><h2>طلب خدمة جديد</h2><p class="muted">حدد الخدمة والمحافظة والمنطقة، ثم اكتب وصف المشكلة.</p><form class="form two" onsubmit="createReq(event)"><div class="field"><label>الخدمة</label><select id="qservice" onchange="syncSearchFromRequest()">${state.meta.services.map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="qcity" onchange="bindAreaSelect('qcity','qarea','qareaOtherWrap');syncSearchFromRequest()">${governorateOptions(state.user?.city||'عمان')}</select></div><div class="field"><label>منطقة السكن</label><select id="qarea" onchange="syncSearchFromRequest()"></select></div><div class="field hide" id="qareaOtherWrap"><label>اكتب المنطقة</label><input id="qareaOther" placeholder="اكتب اسم المنطقة"></div><div class="field"><label>الوقت المطلوب</label><input id="qtime" placeholder="اليوم مساءً"></div><div class="field" style="grid-column:1/-1"><label>وصف المشكلة</label><textarea id="qdesc" required placeholder="مثال: المكيف لا يبرد وأحتاج فني اليوم"></textarea></div><div class="field" style="grid-column:1/-1"><button type="button" class="btn ghost" onclick="useGPS('request')">📍 حدد موقعي الآن</button><small class="muted">الموقع يساعد الفنيين على معرفة قربك قبل قبول الطلب.</small><div id="requestMap">${mapBox(state.gps?.lat,state.gps?.lng)}</div></div><button class="btn">نشر الطلب العام</button></form></div>`}
const __v10CreateReqBase=createReq; createReq=async function(e){await __v10CreateReqBase(e); v10Sound('request')}
const __v10SendMsgBase=sendMsg; sendMsg=async function(e,id){await __v10SendMsgBase(e,id); v10Sound('message')}
const __v10LogoutBase=logout; logout=async function(){v10Sound('logout'); await __v10LogoutBase();}
layout=function(title,menu,content){document.body.classList.add('dashboard-mode');v10ApplyTheme();let user=state.user||{};app.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>ص</span>صلّحلي</div><div class="admin-section-label">الرئيسية</div><div class="admin-menu">${menu.map(m=>`<button class="sidebtn ${state.tab===m[0]?'active':''}" onclick="state.tab='${m[0]}';dashboard()"><b>${m[1]}</b><span class="mi">${menuIcon(m[0])}</span></button>`).join('')}</div><div class="admin-section-label">النظام</div><div class="admin-menu"><button class="sidebtn ${state.tab==='settings'?'active':''}" onclick="state.tab='settings';dashboard()"><b>الإعدادات</b><span class="mi">⚙️</span></button><button class="sidebtn" onclick="logout()"><b>تسجيل خروج</b><span class="mi">🚪</span></button></div><div class="admin-profile"><div class="avatar-sm">${(user.name||'ص').slice(0,1)}</div><div><b>${user.name||roleName()}</b><small>${user.email||roleName()}</small></div></div></aside><main class="admin-main"><div class="admin-top"><div class="admin-search">🔎 <input placeholder="بحث عن فني أو خدمة أو طلب..." onkeydown="if(event.key==='Enter'){state.tab=state.user.role==='customer'?'near':'orders';dashboard();setTimeout(()=>{if(document.getElementById('searchTechQ')){document.getElementById('searchTechQ').value=this.value;searchTechnicians()}},100)}"></div><div class="admin-actions"><button class="admin-icon-btn bell-btn" title="التنبيهات" onclick="v10Notify('صوت التنبيه يعمل', 'notify')">🔔</button><button class="admin-icon-btn" title="دارك مود" onclick="v10ToggleTheme()">🌙</button><button class="admin-icon-btn logout" onclick="logout()">⏻</button></div></div>${content}</main></div>`;v10ApplyTheme();}
custDash=async function(){let menu=[['dash','طلب جديد'],['near','البحث عن فني'],['orders','طلباتي']];let c=''; if(state.tab==='settings') c=v10Hero('الإعدادات','تغيير الاسم، المنطقة، الهاتف، وكلمة السر')+settingsPage(); else if(state.tab==='orders'){let j=await api('/api/requests');c=v10Hero('طلباتي','تابع الطلبات وافتح الشات بعد قبول الفني')+`<div class="dash-card"><h2>طلباتي</h2>${reqTable(j.requests)}</div>`} else if(state.tab==='near'){c=v10Hero('البحث عن فني','ابحث من خانة واحدة حسب الخدمة والموقع')+techSearchBox();} else c=v10Hero('لوحة العميل','اطلب خدمة أو ابحث عن الفني المناسب حسب منطقتك')+v10TopStrip()+`<div class="customer-main-grid v10"><div class="dash-card v6-form">${requestForm()}</div>${techSearchBox()}</div>`; layout('لوحة العميل',menu,c); if(state.tab==='dash'){bindAreaSelect('qcity','qarea','qareaOtherWrap');bindAreaSelect('searchCity','searchArea');} if(state.tab==='near'){bindAreaSelect('searchCity','searchArea');setTimeout(searchTechnicians,150)} if(state.tab==='settings') bindAreaSelect('setCity','setArea');}
const __v10AdminBase=admin; admin=async function(){ if(state.tab==='settings'){layout('لوحة الإدارة',[['dash','لوحة الإدارة'],['users','المستخدمين'],['orders','الطلبات'],['topups','شحن الفنيين'],['services','المهن والخدمات'],['packages','الباقات']], v10Hero('الإعدادات','إدارة حساب المدير')+settingsPage()); bindAreaSelect('setCity','setArea'); return;} await __v10AdminBase(); }
const __v10TechBase=techDash; techDash=async function(){ if(state.tab==='settings'){layout('لوحة الفني',[['dash','الرئيسية'],['orders','الطلبات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']], v10Hero('الإعدادات','عدّل حسابك وكلمة السر')+settingsPage()); bindAreaSelect('setCity','setArea'); return;} await __v10TechBase(); }
function showWelcomeModalForce(){ const old=document.getElementById('welcomeOverlay'); if(old) old.remove(); const el=document.createElement('div'); el.className='welcome-overlay v8-welcome'; el.id='welcomeOverlay'; el.innerHTML=`<div class="welcome-card v8-welcome-card"><button class="welcome-close" onclick="closeWelcome()">×</button><div class="welcome-logo big-logo">ص</div><h2>صلّحلي</h2><p>مرحباً بك في منصة صلّحلي — ملف وليد فيه: اعمل إجراءاتك، اطلب الخدمة، وتابع الشات والفني من مكان واحد.</p><div class="welcome-features"><div><b>ملف وليد</b><small>اعمل إجراءاتك بسهولة</small></div><div><b>منع التداخل</b><small>الفني لا يأخذ طلب ثاني قبل إنهاء الحالي</small></div><div><b>بحث ذكي</b><small>خدمة + محافظة + منطقة</small></div></div><div class="welcome-actions"><button class="btn" onclick="closeWelcome();go('${state.user?'dashboard':'register'}')">متابعة</button><button class="btn ghost" onclick="closeWelcome()">إغلاق</button></div></div>`; document.body.appendChild(el);}
const __v10Init=init; init=async function(){v10ApplyTheme(); await __v10Init(); setTimeout(()=>{showWelcomeModalForce()},500)}

/* ===== Sallehly V11 Slider + Marketplace Layer ===== */
let v11ServiceIndex=0, v11SliderTimer=null;
function v11ServiceSlider(){
  const services=(state.meta.services||[]);
  if(!services.length) return '';
  const cards=services.map((s,i)=>`<button class="v11-slide-card" data-service="${String(s.name).replace(/"/g,'&quot;')}" onclick="v11SelectService('${String(s.name).replace(/'/g,"\\'")}')"><span class="v11-slide-icon">${s.icon||'🧰'}</span><span class="v11-slide-text"><b>${s.name}</b><small>طلب سريع • فنيين قريبين • تقييم واضح</small></span></button>`).join('');
  return `<section class="v11-slider-shell"><div class="v11-slider-head"><div><h2>الخدمات الأكثر طلباً</h2><p>شريط عرض متحرك — اختر الخدمة المناسبة بسرعة</p></div><button class="btn ghost" onclick="go('services')">كل الخدمات</button></div><div class="v11-slider"><button class="v11-arrow" onclick="v11MoveSlider(-1)">‹</button><div class="v11-slider-window"><div id="v11SliderTrack" class="v11-slider-track">${cards}</div></div><button class="v11-arrow" onclick="v11MoveSlider(1)">›</button></div><div id="v11SliderDots" class="v11-dots"></div></section>`;
}
function v11VisibleCount(){return window.innerWidth<650?1:window.innerWidth<1050?2:4;}
function v11UpdateSlider(){
  const track=document.getElementById('v11SliderTrack'); if(!track) return;
  const cards=[...track.children]; if(!cards.length) return;
  const visible=v11VisibleCount(); const max=Math.max(0,cards.length-visible);
  if(v11ServiceIndex>max) v11ServiceIndex=0; if(v11ServiceIndex<0) v11ServiceIndex=max;
  const cardW=cards[0].getBoundingClientRect().width+16;
  track.style.transform=`translateX(${-v11ServiceIndex*cardW}px)`; cards.forEach((c,i)=>c.classList.toggle('is-active', i>=v11ServiceIndex && i<v11ServiceIndex+visible));
  const pages=max+1; const dots=document.getElementById('v11SliderDots');
  if(dots) dots.innerHTML=Array.from({length:pages}).map((_,i)=>`<button class="${i===v11ServiceIndex?'active':''}" onclick="v11ServiceIndex=${i};v11UpdateSlider()"></button>`).join('');
}
function v11MoveSlider(dir){ v11ServiceIndex+=dir; v11UpdateSlider(); v11RestartSlider(); }
function v11RestartSlider(){ clearInterval(v11SliderTimer); v11SliderTimer=setInterval(()=>{v11ServiceIndex++;v11UpdateSlider()},3000); }
function v11InitSlider(){ setTimeout(()=>{v11UpdateSlider(); v11RestartSlider(); const shell=document.querySelector('.v11-slider-shell'); if(shell){shell.onmouseenter=()=>clearInterval(v11SliderTimer); shell.onmouseleave=v11RestartSlider;}},80); }
function v11SelectService(service){
  if(!state.user){ localStorage.pendingService=service; go('register'); return; }
  if(state.user.role==='customer'){
    state.tab='near'; dashboard();
    setTimeout(()=>{ if($('#searchTechQ')) $('#searchTechQ').value=service; if($('#searchService')) $('#searchService').value=service; searchTechnicians(); },180);
  }else{ toast('هذه الخدمة للعميل. يمكنك إدارة الطلبات من لوحتك.'); }
}
function v11Hero(title, sub){return `<div class="v11-hero"><div><span>صلّحلي PRO V11</span><h1>${title}</h1><p>${sub}</p></div><div class="v11-hero-badges"><b>🔒 صلاحيات</b><b>💬 شات</b><b>📍 مناطق</b><b>⭐ تقييم</b></div></div>`;}
function v11Improvements(){return `<div class="v11-improve-grid"><div><b>📌 طلبات بدون تداخل</b><small>الفني لا يقبل طلب جديد قبل إنهاء الطلب النشط.</small></div><div><b>🧾 سجل عمليات</b><small>كل طلب وشحن ورصيد محفوظ للنظام.</small></div><div><b>💬 شات بعد القبول</b><small>المحادثة بين العميل والفني مرتبطة بالطلب.</small></div><div><b>📍 محافظة ومنطقة</b><small>بحث حسب عمان، الزرقاء، إربد وباقي المحافظات.</small></div></div>`;}

const __v11CustDashBase = custDash;
custDash=async function(){
  let menu=[['dash','طلب جديد'],['near','البحث عن فني'],['orders','طلباتي']];
  let c='';
  if(state.tab==='settings') c=v11Hero('الإعدادات','تغيير الاسم، المنطقة، الهاتف، وكلمة السر')+settingsPage();
  else if(state.tab==='orders'){let j=await api('/api/requests');c=v11Hero('طلباتي','تابع الطلبات وافتح الشات بعد قبول الفني')+`<div class="dash-card"><h2>طلباتي</h2>${reqTable(j.requests)}</div>`}
  else if(state.tab==='near'){c=v11Hero('البحث عن فني','ابحث من خانة واحدة حسب الخدمة والموقع')+v11ServiceSlider()+techSearchBox();}
  else c=v11Hero('لوحة العميل','اطلب خدمة أو اختر خدمة من الشريط المتحرك وابحث عن الفني المناسب')+v11ServiceSlider()+`<div class="customer-main-grid v10"><div class="dash-card v6-form">${requestForm()}</div>${techSearchBox()}</div>`+v11Improvements();
  layout('لوحة العميل',menu,c);
  if(state.tab==='dash'){bindAreaSelect('qcity','qarea','qareaOtherWrap');bindAreaSelect('searchCity','searchArea');}
  if(state.tab==='near'){bindAreaSelect('searchCity','searchArea');setTimeout(searchTechnicians,150)}
  if(state.tab==='settings') bindAreaSelect('setCity','setArea');
  v11InitSlider();
}
const __v11HomeBase = home;
home=function(){
  __v11HomeBase();
  const services=document.querySelector('.services-section');
  if(services){ services.insertAdjacentHTML('beforebegin', v11ServiceSlider()); v11InitSlider(); }
}
servicesPage=function(){app.innerHTML=`<div class="page"><div class="v11-page-title"><h1>كل خدمات صلّحلي</h1><p class="muted">عدد الخدمات مفتوح، وأي مهنة تضيفها من لوحة الإدارة تظهر هنا وفي الشريط المتحرك تلقائياً.</p></div>${v11ServiceSlider()}<div class="grid">${state.meta.services.map(s=>`<div class="card service-card"><div class="icon">${s.icon}</div><h3>${s.name}</h3><p class="muted">اضغط للبحث عن الفنيين المتاحين لهذه الخدمة.</p><button class="btn" onclick="v11SelectService('${String(s.name).replace(/'/g,"\\'")}')">ابحث عن فني</button></div>`).join('')}</div></div>`;v11InitSlider();}
window.addEventListener('resize',()=>v11UpdateSlider());


/* ===== Sallehly V13 Final: Chats Badge + Live Professions Ticker + Strong Support ===== */
state.chatCount = 0;
function v13Badge(n){ n=Number(n||0); return n>0?`<em class="chat-badge">${n>99?'99+':n}</em>`:''; }
async function v13LoadChatCount(){
  try{ if(!state.user || state.user.role==='admin') return 0; const j=await api('/api/chats'); state.chatCount=j.total_unread||0; return state.chatCount; }catch(e){ return state.chatCount||0; }
}
function v13Ticker(){
  const sv=(state.meta.services||[]); if(!sv.length) return '';
  const one=sv.map(s=>`<button class="v13-tick" onclick="v11SelectService('${String(s.name).replace(/'/g,"\\'")}')"><span>${s.icon||'🧰'}</span><b>${s.name}</b><small>متوفر الآن</small></button>`).join('');
  return `<section class="v13-ticker-wrap"><div class="v13-ticker-title"><b>⚡ شريط المهن المباشر</b><small>كل مهنة تضيفها من الإدارة تظهر هنا تلقائياً</small></div><div class="v13-ticker-window"><div class="v13-ticker-track">${one}${one}</div></div></section>`;
}
function v13LogoutConfirm(){
  const old=document.getElementById('logoutConfirm'); if(old) old.remove();
  const el=document.createElement('div'); el.id='logoutConfirm'; el.className='logout-modal';
  el.innerHTML=`<div class="logout-box"><button class="welcome-close" onclick="document.getElementById('logoutConfirm').remove()">×</button><div class="logout-icon">🚪</div><h2>تسجيل خروج</h2><p>هل أنت متأكد أنك تريد الخروج من حسابك؟</p><div class="logout-actions"><button class="btn ghost" onclick="document.getElementById('logoutConfirm').remove()">إلغاء</button><button class="btn red" onclick="document.getElementById('logoutConfirm').remove();logout()">نعم، تسجيل خروج</button></div></div>`;
  document.body.appendChild(el);
}
function menuIconV13(k){ if(k==='chats') return '💬'; if(k==='support') return '🎧'; return menuIcon(k); }
const __v13LayoutBase = layout;
layout=function(title,menu,content){
  document.body.classList.add('dashboard-mode');v10ApplyTheme();let user=state.user||{};
  const contentWithTicker = (state.user && state.user.role!=='admin' ? v13Ticker() : '') + content;
  app.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>ص</span>صلّحلي</div><div class="admin-section-label">الرئيسية</div><div class="admin-menu">${menu.map(m=>`<button class="sidebtn ${state.tab===m[0]?'active':''}" onclick="state.tab='${m[0]}';dashboard()"><b>${m[1]} ${m[0]==='chats'?v13Badge(state.chatCount):''}</b><span class="mi">${menuIconV13(m[0])}</span></button>`).join('')}</div><div class="admin-section-label">النظام</div><div class="admin-menu"><button class="sidebtn ${state.tab==='settings'?'active':''}" onclick="state.tab='settings';dashboard()"><b>الإعدادات</b><span class="mi">⚙️</span></button><button class="sidebtn ${state.tab==='support'?'active':''}" onclick="state.tab='support';dashboard()"><b>الدعم الفني</b><span class="mi">🎧</span></button><button class="sidebtn logout-side" onclick="v13LogoutConfirm()"><b>تسجيل خروج</b><span class="mi">🚪</span></button></div><div class="admin-profile"><div class="avatar-sm">${(user.name||'ص').slice(0,1)}</div><div><b>${user.name||roleName()}</b><small>${user.email||roleName()}</small></div></div></aside><main class="admin-main"><div class="admin-top"><div class="admin-search">🔎 <input placeholder="بحث عن فني أو خدمة أو طلب..." onkeydown="if(event.key==='Enter'){state.tab=state.user.role==='customer'?'near':'orders';dashboard();setTimeout(()=>{if(document.getElementById('searchTechQ')){document.getElementById('searchTechQ').value=this.value;searchTechnicians()}},100)}"></div><div class="admin-actions"><button class="admin-icon-btn bell-btn" title="التنبيهات" onclick="v10Notify('صوت التنبيه يعمل', 'notify')">🔔 ${v13Badge(state.chatCount)}</button><button class="admin-icon-btn" title="دارك مود" onclick="v10ToggleTheme()">🌙</button><button class="admin-icon-btn logout clean-logout" onclick="v13LogoutConfirm()">تسجيل خروج</button></div></div>${contentWithTicker}</main></div>`;v10ApplyTheme();
}
async function chatsPage(){
  let j=await api('/api/chats'); state.chatCount=j.total_unread||0;
  const rows=j.chats||[];
  return v11Hero('الدردشات','كل محادثاتك مع العملاء والفنيين في مكان واحد')+`<div class="dash-card"><div class="v13-card-head"><h2>كل الدردشات ${v13Badge(state.chatCount)}</h2><p class="muted">الرقم الأحمر يعني رسائل جديدة لم تفتحها بعد.</p></div>${rows.length?`<div class="v13-chat-list">${rows.map(c=>`<button class="v13-chat-item" onclick="chat(${c.request_id})"><div class="v13-chat-avatar">${(c.other_name||'ص').slice(0,1)}</div><div><b>${c.other_name||'محادثة طلب'} ${Number(c.unread_count||0)>0?`<em class="chat-badge inline">${c.unread_count}</em>`:''}</b><small>#${c.request_id} • ${c.service||'-'} • ${c.status||''}</small><p>${c.last_body||'لا توجد رسائل بعد'}</p></div><span>فتح المحادثة ←</span></button>`).join('')}</div>`:'<div class="empty">لا توجد دردشات حالياً. تظهر الدردشة بعد قبول عرض الفني أو بدء محادثة على طلب.</div>'}</div>`;
}
function supportPage(){
  return v11Hero('الدعم الفني','مركز مساعدة قوي للعميل والفني')+`<div class="support-grid"><div class="dash-card support-card"><h2>تواصل مع الدعم</h2><p class="muted">اكتب المشكلة وسيتم حفظها داخل النظام ليراجعها الأدمن.</p><form class="form" onsubmit="sendSupport(event)"><div class="field"><label>نوع المشكلة</label><select id="supportType"><option>مشكلة طلب</option><option>مشكلة دفع أو رصيد</option><option>مشكلة حساب</option><option>اقتراح تحسين</option></select></div><div class="field"><label>عنوان مختصر</label><input id="supportTitle" required placeholder="مثال: لم يصلني رد من الفني"></div><div class="field"><label>التفاصيل</label><textarea id="supportBody" required minlength="10" placeholder="اكتب التفاصيل هنا..."></textarea></div><button class="btn">إرسال للدعم</button></form></div><div class="dash-card"><h2>مساعدة سريعة</h2><div class="faq-list"><details open><summary>متى يفتح الشات؟</summary><p>بعد قبول العميل لعرض الفني يظهر الشات للطرفين.</p></details><details><summary>هل يستطيع الفني أخذ أكثر من طلب؟</summary><p>لا، إذا عنده طلب قيد التنفيذ يجب إنهاؤه أولاً.</p></details><details><summary>ماذا لو رفض العميل السعر؟</summary><p>يبقى الطلب مطروحاً، ويمكن لفنيين آخرين إرسال عروض.</p></details><details><summary>كيف تظهر المهنة بالشريط؟</summary><p>أي مهنة يضيفها الأدمن تظهر تلقائياً في شريط المهن المباشر.</p></details></div></div></div>`;
}
async function sendSupport(e){e.preventDefault();try{await api('/api/support',{method:'POST',body:JSON.stringify({type:supportType.value,title:supportTitle.value,body:supportBody.value})});toast('تم إرسال طلب الدعم بنجاح');supportTitle.value='';supportBody.value='';}catch(err){toast(err.message)}}
// override dashboards to include chats and support
custDash=async function(){await v13LoadChatCount();let menu=[['dash','طلب جديد'],['near','البحث عن فني'],['orders','طلباتي'],['chats','الدردشات']];let c=''; if(state.tab==='support') c=supportPage(); else if(state.tab==='chats') c=await chatsPage(); else if(state.tab==='settings') c=v11Hero('الإعدادات','تغيير الاسم، المنطقة، الهاتف، وكلمة السر')+settingsPage(); else if(state.tab==='orders'){let j=await api('/api/requests');c=v11Hero('طلباتي','تابع الطلبات وافتح الشات بعد قبول الفني')+`<div class="dash-card"><h2>طلباتي</h2>${reqTable(j.requests)}</div>`} else if(state.tab==='near'){c=v11Hero('البحث عن فني','ابحث من خانة واحدة حسب الخدمة والموقع')+v11ServiceSlider()+techSearchBox();} else c=v11Hero('لوحة العميل','اطلب خدمة أو اختر خدمة من الشريط المتحرك وابحث عن الفني المناسب')+v11ServiceSlider()+`<div class="customer-main-grid v10"><div class="dash-card v6-form">${requestForm()}</div>${techSearchBox()}</div>`+v11Improvements(); layout('لوحة العميل',menu,c); if(state.tab==='dash'){bindAreaSelect('qcity','qarea','qareaOtherWrap');bindAreaSelect('searchCity','searchArea');} if(state.tab==='near'){bindAreaSelect('searchCity','searchArea');setTimeout(searchTechnicians,150)} if(state.tab==='settings') bindAreaSelect('setCity','setArea'); v11InitSlider();}
techDash=async function(){await v13LoadChatCount(); let menu=[['dash','الرئيسية'],['orders','الطلبات'],['chats','الدردشات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']]; if(state.tab==='support'){layout('لوحة الفني',menu,supportPage());return;} if(state.tab==='chats'){layout('لوحة الفني',menu,await chatsPage());return;} if(state.tab==='settings'){layout('لوحة الفني',menu,v10Hero('الإعدادات','عدّل حسابك وكلمة السر')+settingsPage()); bindAreaSelect('setCity','setArea'); return;} await __v10TechBase();}
// after opening chat, count becomes clean on refresh
const __v13ChatBase=chat; chat=async function(id){await __v13ChatBase(id); v13LoadChatCount();}


/* ===== Sallehly V14: Professional Chat Protection + Infinite Professions + Logout Polish ===== */
function v14ChatBlockReason(text){
  const raw=String(text||'');
  const ar='٠١٢٣٤٥٦٧٨٩', fa='۰۱۲۳۴۵۶۷۸۹';
  const lower=raw.toLowerCase().replace(/[٠-٩]/g,ch=>String(ar.indexOf(ch))).replace(/[۰-۹]/g,ch=>String(fa.indexOf(ch)));
  const compact=lower.replace(/[\u064B-\u065F\u0670ـ\s\-_.()\[\]{}|\\/]+/g,'');
  const words=['واتس','واتساب','whatsapp','watsapp','wa.me','تيليجرام','تليجرام','تلجرام','telegram','t.me','facebook','fb.com','messenger','instagram','insta','snapchat','gmail.com','hotmail.com','outlook.com','yahoo.com'];
  if(words.some(w=>lower.includes(w)||compact.includes(w.replace(/\W/g,'')))) return 'وسيلة تواصل خارجية';
  if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)) return 'بريد إلكتروني';
  const digits=compact.replace(/[^0-9+]/g,'');
  const onlyNums=lower.replace(/[^0-9]/g,'');
  if(/(\+?962|00962)?0?7[789]\d{7}/.test(digits) || /(962|00962)?0?7[789]\d{7}/.test(onlyNums) || onlyNums.length>=9) return 'رقم هاتف';
  return '';
}
function v14BlockedNotice(reason){
  v10Sound?.('notify');
  toast('⚠️ ممنوع إرسال '+reason+' داخل الشات. استخدم دردشة صلّحلي فقط.');
}
const __v14SendMsgBase = sendMsg;
sendMsg = async function(e,id){
  e.preventDefault();
  const input=document.getElementById('msg');
  const text=(input?.value||'').trim();
  if(!text) return;
  const reason=v14ChatBlockReason(text);
  if(reason){ v14BlockedNotice(reason); input.classList.add('blocked-input'); setTimeout(()=>input.classList.remove('blocked-input'),900); return; }
  return __v14SendMsgBase(e,id);
};
const __v14ChatBase = chat;
chat = async function(id){
  await __v14ChatBase(id);
  const card=document.querySelector('.chat-card');
  if(card && !document.querySelector('.chat-protection-note')){
    const note=document.createElement('div');
    note.className='chat-protection-note';
    note.innerHTML='🛡️ حماية المنصة فعّالة: ممنوع مشاركة رقم الهاتف أو واتساب أو تيليجرام أو روابط التواصل الخارجية. أي محاولة يتم تسجيلها للإدارة.';
    const form=document.querySelector('.chat-input-row');
    card.insertBefore(note, form);
  }
  const input=document.getElementById('msg');
  if(input){ input.placeholder='اكتب رسالتك هنا — بدون أرقام هاتف أو واتساب'; }
};
// Infinite ticker: duplicates enough items to keep the strip alive on wide screens
v13Ticker = function(){
  const sv=(state.meta.services||[]); if(!sv.length) return '';
  const items=sv.map(s=>`<button class="v13-tick" onclick="v11SelectService('${String(s.name).replace(/'/g,"\\'")}')"><span>${s.icon||'🧰'}</span><b>${s.name}</b><small>متوفر الآن</small></button>`).join('');
  const repeated = Array(8).fill(items).join('');
  return `<section class="v13-ticker-wrap v14-live-ticker"><div class="v13-ticker-title"><b>⚡ شريط المهن المباشر</b><small>كل مهنة تضيفها من الإدارة تظهر هنا تلقائياً وتستمر بالدوران</small></div><div class="v13-ticker-window"><div class="v13-ticker-track v14-infinite-track">${repeated}</div></div></section>`;
};
function v14LogoutConfirm(){ v13LogoutConfirm(); const box=document.querySelector('.logout-box'); if(box){ box.classList.add('logout-box-pro'); const h=box.querySelector('h2'); if(h)h.textContent='تأكيد تسجيل الخروج'; const p=box.querySelector('p'); if(p)p.textContent='سيتم إنهاء الجلسة والرجوع إلى الصفحة الرئيسية.'; }}
v13LogoutConfirm = v14LogoutConfirm;

/* ===== Sallehly V15 FINAL FIX: Reliable Logout + Strong Chat Protection + Live Ticker ===== */
function v15EscapeHtml(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}

// Fully replace the broken recursive logout popup from V14
function v15LogoutConfirm(){
  const old=document.getElementById('logoutConfirm'); if(old) old.remove();
  const el=document.createElement('div');
  el.id='logoutConfirm';
  el.className='logout-modal v15-logout-modal';
  el.innerHTML=`<div class="logout-box logout-box-pro v15-logout-box">
    <button class="welcome-close v15-close" type="button" onclick="document.getElementById('logoutConfirm')?.remove()">×</button>
    <div class="logout-icon v15-logout-icon">🚪</div>
    <h2>تأكيد تسجيل الخروج</h2>
    <p>سيتم إنهاء الجلسة والرجوع إلى الصفحة الرئيسية.</p>
    <div class="logout-actions">
      <button class="btn ghost" type="button" onclick="document.getElementById('logoutConfirm')?.remove()">إلغاء</button>
      <button class="btn red" type="button" id="v15LogoutNow">نعم، تسجيل خروج</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  document.getElementById('v15LogoutNow')?.addEventListener('click', v15DoLogout, {once:true});
}
async function v15DoLogout(){
  try{ v10Sound?.('logout'); }catch(e){}
  try{ await api('/api/auth/logout',{method:'POST'}); }catch(e){}
  try{ if(socket) socket.disconnect(); }catch(e){}
  try{ if(chatTimer) clearInterval(chatTimer); }catch(e){}
  localStorage.removeItem('token');
  state.user=null; state.token=''; state.tab='dash'; state.chatCount=0;
  document.getElementById('logoutConfirm')?.remove();
  document.body.classList.remove('dashboard-mode','open');
  toast('تم تسجيل الخروج بنجاح');
  setTimeout(()=>{ try{home()}catch(e){location.reload()} },180);
}
window.v13LogoutConfirm = v15LogoutConfirm;
window.v14LogoutConfirm = v15LogoutConfirm;
window.logout = async function(){ await v15DoLogout(); };

// Stronger visual layout override so every logout button uses the fixed popup and looks professional
layout=function(title,menu,content){
  document.body.classList.add('dashboard-mode'); v10ApplyTheme?.(); let user=state.user||{};
  const contentWithTicker = (state.user && state.user.role!=='admin' ? v13Ticker() : '') + content;
  app.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>ص</span>صلّحلي</div><div class="admin-section-label">الرئيسية</div><div class="admin-menu">${menu.map(m=>`<button class="sidebtn ${state.tab===m[0]?'active':''}" onclick="state.tab='${m[0]}';dashboard()"><b>${m[1]} ${m[0]==='chats'?v13Badge(state.chatCount):''}</b><span class="mi">${menuIconV13(m[0])}</span></button>`).join('')}</div><div class="admin-section-label">النظام</div><div class="admin-menu"><button class="sidebtn ${state.tab==='settings'?'active':''}" onclick="state.tab='settings';dashboard()"><b>الإعدادات</b><span class="mi">⚙️</span></button><button class="sidebtn ${state.tab==='support'?'active':''}" onclick="state.tab='support';dashboard()"><b>الدعم الفني</b><span class="mi">🎧</span></button><button type="button" class="sidebtn logout-side v15-logout-side" onclick="v15LogoutConfirm()"><b>تسجيل خروج</b><span class="mi">🚪</span></button></div><div class="admin-profile"><div class="avatar-sm">${(user.name||'ص').slice(0,1)}</div><div><b>${v15EscapeHtml(user.name||roleName())}</b><small>${v15EscapeHtml(user.email||roleName())}</small></div></div></aside><main class="admin-main"><div class="admin-top"><div class="admin-search">🔎 <input placeholder="بحث عن فني أو خدمة أو طلب..." onkeydown="if(event.key==='Enter'){state.tab=state.user.role==='customer'?'near':'orders';dashboard();setTimeout(()=>{if(document.getElementById('searchTechQ')){document.getElementById('searchTechQ').value=this.value;searchTechnicians()}},100)}"></div><div class="admin-actions"><button class="admin-icon-btn bell-btn" title="التنبيهات" onclick="v10Notify('صوت التنبيه يعمل', 'notify')">🔔 ${v13Badge(state.chatCount)}</button><button class="admin-icon-btn" title="دارك مود" onclick="v10ToggleTheme()">🌙</button><button type="button" class="admin-icon-btn clean-logout v15-top-logout" onclick="v15LogoutConfirm()">🚪 تسجيل خروج</button></div></div>${contentWithTicker}</main></div>`;
  v10ApplyTheme?.();
};

// Keep live profession ticker running forever and make newly-added services appear after dashboard refresh
v13Ticker = function(){
  const sv=(state.meta.services||[]); if(!sv.length) return '';
  const items=sv.map(s=>`<button class="v13-tick v15-tick" onclick="v11SelectService('${String(s.name).replace(/'/g,"\\'")}')"><span>${s.icon||'🧰'}</span><b>${v15EscapeHtml(s.name)}</b><small>متوفر الآن</small></button>`).join('');
  const repeated = Array(12).fill(items).join('');
  return `<section class="v13-ticker-wrap v14-live-ticker v15-live-ticker"><div class="v13-ticker-title"><b>⚡ شريط المهن المباشر</b><small>كل مهنة تضيفها من الإدارة تظهر تلقائياً وتستمر بالدوران بدون توقف</small></div><div class="v13-ticker-window"><div class="v13-ticker-track v14-infinite-track v15-infinite-track">${repeated}</div></div></section>`;
};

// Professional chat guard: blocks phone numbers, WhatsApp, Telegram, email, social links, separated Arabic/English digits
function v15ChatBlockReason(text){
  const raw=String(text||'');
  const ar='٠١٢٣٤٥٦٧٨٩', fa='۰۱۲۳۴۵۶۷۸۹';
  const normalized=raw.toLowerCase()
    .replace(/[٠-٩]/g,ch=>String(ar.indexOf(ch)))
    .replace(/[۰-۹]/g,ch=>String(fa.indexOf(ch)))
    .replace(/[oO]/g,'0');
  const compact=normalized.replace(/[\u064B-\u065F\u0670ـ\s\-_.()\[\]{}|\\/,:;]+/g,'');
  const blocked=['واتس','واتساب','وتساب','whatsapp','watsapp','wa.me','تيليجرام','تليجرام','تلجرام','telegram','t.me','facebook','فيس','fb.com','messenger','instagram','انستا','insta','snapchat','سناب','gmail','hotmail','outlook','yahoo'];
  if(blocked.some(w=>normalized.includes(w)||compact.includes(w.replace(/\W/g,'')))) return 'وسيلة تواصل خارجية';
  if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)) return 'بريد إلكتروني';
  const nums=normalized.replace(/[^0-9]/g,'');
  if(/(00962|962)?0?7[789]\d{7}/.test(nums) || nums.length>=9) return 'رقم هاتف';
  return '';
}
function v15BlockedNotice(reason){
  try{v10Sound?.('notify')}catch(e){}
  toast('⚠️ ممنوع إرسال '+reason+' داخل الشات. التواصل فقط داخل صلّحلي.');
}
sendMsg = async function(e,id){
  e.preventDefault();
  const input=document.getElementById('msg');
  const text=(input?.value||'').trim();
  if(!text) return;
  const reason=v15ChatBlockReason(text);
  if(reason){
    v15BlockedNotice(reason);
    input.classList.add('blocked-input');
    setTimeout(()=>input.classList.remove('blocked-input'),1000);
    return;
  }
  try{
    let j=await api(`/api/requests/${id}/messages`,{method:'POST',body:JSON.stringify({body:text})});
    input.value=''; renderMessages(j.messages); v10Sound?.('message'); v13LoadChatCount?.();
  }catch(err){ toast(err.message); }
};

const __v15ChatBase = chat;
chat = async function(id){
  await __v15ChatBase(id);
  const card=document.querySelector('.chat-card');
  if(card && !document.querySelector('.chat-protection-note')){
    const note=document.createElement('div');
    note.className='chat-protection-note v15-chat-protection-note';
    note.innerHTML='🛡️ حماية صلّحلي: ممنوع مشاركة رقم هاتف، واتساب، تيليجرام، إيميل أو روابط تواصل خارجية. أي محاولة يتم تسجيلها للإدارة.';
    const form=document.querySelector('.chat-input-row');
    card.insertBefore(note, form);
  }
  const input=document.getElementById('msg');
  if(input){ input.placeholder='اكتب رسالتك هنا — بدون رقم هاتف أو واتساب'; }
};


/* ===== Sallehly V16 FINAL: Accurate Chat Protection + Technician Chats ===== */
function v16NormalizeDigits(text){
  const ar='٠١٢٣٤٥٦٧٨٩', fa='۰۱۲۳۴۵۶۷۸۹';
  return String(text||'').toLowerCase()
    .replace(/[٠-٩]/g,ch=>String(ar.indexOf(ch)))
    .replace(/[۰-۹]/g,ch=>String(fa.indexOf(ch)))
    .replace(/[oO]/g,'0');
}
function v16Compact(text){
  return v16NormalizeDigits(text).replace(/[\u064B-\u065F\u0670ـ\s\-_.()\[\]{}|\\/,:;،]+/g,'');
}
function v16ChatBlockReason(text){
  const raw=String(text||'');
  const lower=v16NormalizeDigits(raw);
  const compact=v16Compact(raw);
  const keywordGroups=[
    {reason:'واتساب', words:['واتساب','واتس','وتساب','whatsapp','watsapp','wa.me','wa me']},
    {reason:'تيليجرام', words:['تيليجرام','تليجرام','تلجرام','telegram','t.me','t me']},
    {reason:'فيسبوك أو ماسنجر', words:['facebook','fb.com','fb com','messenger','فيسبوك','ماسنجر']},
    {reason:'إنستغرام أو سناب', words:['instagram','insta','انستا','إنستا','snapchat','سناب']},
    {reason:'بريد إلكتروني', words:['gmail.com','hotmail.com','outlook.com','yahoo.com','gmail','hotmail','outlook','yahoo']}
  ];
  for(const group of keywordGroups){
    for(const word of group.words){
      const wLower=v16NormalizeDigits(word);
      const wCompact=v16Compact(word);
      if((wLower && lower.includes(wLower)) || (wCompact && compact.includes(wCompact))) return group.reason;
    }
  }
  if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)) return 'بريد إلكتروني';
  const digits=lower.replace(/[^0-9+]/g,'');
  const separated=lower.replace(/[^0-9]/g,'');
  if(/(\+?962|00962)?0?7[789]\d{7}/.test(digits) || /(962|00962)?0?7[789]\d{7}/.test(separated)) return 'رقم هاتف';
  if(/\d{10,}/.test(separated)) return 'رقم هاتف';
  if(separated.length>=9 && /^(0?7|9627|009627)/.test(separated)) return 'رقم هاتف';
  return '';
}
function v16BlockedNotice(reason){
  try{v10Sound?.('notify')}catch(e){}
  toast('⚠️ ممنوع مشاركة '+reason+' داخل الشات. الرسائل العادية مسموحة، والتواصل فقط داخل صلّحلي.');
}
sendMsg = async function(e,id){
  e.preventDefault();
  const input=document.getElementById('msg');
  const text=(input?.value||'').trim();
  if(!text) return;
  const reason=v16ChatBlockReason(text);
  if(reason){
    v16BlockedNotice(reason);
    input.classList.add('blocked-input');
    setTimeout(()=>input.classList.remove('blocked-input'),1000);
    return;
  }
  try{
    const j=await api(`/api/requests/${id}/messages`,{method:'POST',body:JSON.stringify({body:text})});
    input.value=''; renderMessages(j.messages); v10Sound?.('message'); v13LoadChatCount?.();
  }catch(err){ toast(err.message); }
};
const __v16ChatBase = chat;
chat = async function(id){
  await __v16ChatBase(id);
  const card=document.querySelector('.chat-card');
  if(card){
    const old=document.querySelector('.chat-protection-note');
    if(old) old.innerHTML='🛡️ حماية صلّحلي: الرسائل العادية مسموحة. الممنوع فقط: رقم هاتف، واتساب، تيليجرام، إيميل أو روابط تواصل خارجية.';
  }
  const input=document.getElementById('msg');
  if(input){ input.placeholder='اكتب رسالتك عادي — بدون رقم هاتف أو واتساب أو إيميل'; }
};
const __v16TechDashBase = techDash;
techDash = async function(){
  await v13LoadChatCount?.();
  let menu=[['dash','الرئيسية'],['orders','الطلبات'],['chats','الدردشات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']];
  if(state.tab==='chats'){layout('لوحة الفني',menu,await chatsPage());return;}
  if(state.tab==='support'){layout('لوحة الفني',menu,supportPage());return;}
  if(state.tab==='settings'){layout('لوحة الفني',menu,v10Hero('الإعدادات','عدّل حسابك وكلمة السر')+settingsPage()); bindAreaSelect('setCity','setArea'); return;}
  return __v16TechDashBase();
};


/* ===== Sallehly V17: Technician Chats + Live Request Counters + Pro Chat Fix ===== */
state.orderCount = 0;
async function v17LoadCounters(){
  try{
    if(!state.user) return {orders:0,chats:0};
    const [r,c] = await Promise.allSettled([api('/api/requests'), api('/api/chats')]);
    const requests = r.status==='fulfilled' ? (r.value.requests||[]) : [];
    const chats = c.status==='fulfilled' ? (c.value.chats||[]) : [];
    state.chatCount = c.status==='fulfilled' ? (c.value.total_unread||0) : (state.chatCount||0);
    if(state.user.role==='technician'){
      state.orderCount = requests.filter(x => ['بانتظار العروض','وصلت عروض'].includes(x.status) || x.technician_id===state.user.id).length;
    }else if(state.user.role==='customer'){
      state.orderCount = requests.length;
    }
    return {orders:state.orderCount||0, chats:state.chatCount||0, requests, chats};
  }catch(e){ return {orders:state.orderCount||0,chats:state.chatCount||0,requests:[],chats:[]}; }
}
function v17MenuLabel(key,label){
  let badge='';
  if(key==='chats') badge=v13Badge(state.chatCount);
  if(key==='orders') badge=v13Badge(state.orderCount);
  return `${label} ${badge}`;
}
const __v17LayoutPrev = layout;
layout=function(title,menu,content){
  document.body.classList.add('dashboard-mode');v10ApplyTheme();let user=state.user||{};
  const contentWithTicker = (state.user && state.user.role!=='admin' ? v13Ticker() : '') + content;
  app.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>ص</span>صلّحلي</div><div class="admin-section-label">الرئيسية</div><div class="admin-menu">${menu.map(m=>`<button class="sidebtn ${state.tab===m[0]?'active':''}" onclick="state.tab='${m[0]}';dashboard()"><b>${v17MenuLabel(m[0],m[1])}</b><span class="mi">${menuIconV13(m[0])}</span></button>`).join('')}</div><div class="admin-section-label">النظام</div><div class="admin-menu"><button class="sidebtn ${state.tab==='settings'?'active':''}" onclick="state.tab='settings';dashboard()"><b>الإعدادات</b><span class="mi">⚙️</span></button><button class="sidebtn ${state.tab==='support'?'active':''}" onclick="state.tab='support';dashboard()"><b>الدعم الفني</b><span class="mi">🎧</span></button><button type="button" class="sidebtn logout-side v17-logout-side" onclick="v15LogoutConfirm()"><b>تسجيل خروج</b><span class="mi">🚪</span></button></div><div class="admin-profile"><div class="avatar-sm">${(user.name||'ص').slice(0,1)}</div><div><b>${v15EscapeHtml(user.name||roleName())}</b><small>${v15EscapeHtml(user.email||roleName())}</small></div></div></aside><main class="admin-main"><div class="admin-top"><div class="admin-search">🔎 <input placeholder="بحث عن فني أو خدمة أو طلب..." onkeydown="if(event.key==='Enter'){state.tab=state.user.role==='customer'?'near':'orders';dashboard();setTimeout(()=>{if(document.getElementById('searchTechQ')){document.getElementById('searchTechQ').value=this.value;searchTechnicians()}},100)}"></div><div class="admin-actions"><button class="admin-icon-btn bell-btn" title="التنبيهات" onclick="v10Notify('صوت التنبيه يعمل', 'notify')">🔔 ${v13Badge(state.chatCount)}</button><button class="admin-icon-btn" title="دارك مود" onclick="v10ToggleTheme()">🌙</button><button type="button" class="admin-icon-btn clean-logout v17-top-logout" onclick="v15LogoutConfirm()">🚪 تسجيل خروج</button></div></div>${contentWithTicker}</main></div>`;
  v10ApplyTheme();
};
function v17TechHome(me,requests){
  const active=requests.filter(r=>r.technician_id===me.id && !['مكتمل','ملغي'].includes(r.status)).length;
  const open=requests.filter(r=>['بانتظار العروض','وصلت عروض'].includes(r.status)).length;
  return dashboardHero('لوحة الفني','طلبات جديدة تظهر لك فوراً حسب خدماتك ومناطق عملك',[{label:'طلبات متاحة',value:open,up:'جديدة',icon:'🛒'},{label:'دردشات',value:state.chatCount||0,up:'رسائل',icon:'💬'},{label:'رصيدك',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'طلب نشط',value:active,up:'قيد العمل',icon:'🔧'}])+`<div class="dash-card"><div class="v13-card-head"><h2>الطلبات المناسبة ${v13Badge(open)}</h2><p class="muted">أي عميل ينشر طلب يناسب خدماتك يظهر هنا مباشرة، وتقدر تقدم عرض سعر ومدة.</p></div>${reqTable(requests)}</div>`;
}
techDash = async function(){
  const me=(await api('/api/me')).user; state.user=me;
  const counters=await v17LoadCounters();
  const menu=[['dash','الرئيسية'],['orders','الطلبات'],['chats','الدردشات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']];
  let c='';
  if(state.tab==='chats'){ c=await chatsPage(); }
  else if(state.tab==='support'){ c=supportPage(); }
  else if(state.tab==='settings'){ c=v10Hero('الإعدادات','عدّل حسابك وكلمة السر')+settingsPage(); }
  else if(state.tab==='orders'){ c=v17TechHome(me,counters.requests||[]); }
  else if(state.tab==='balance'){ c=dashboardHero('الرصيد والباقات','اشحن رصيدك وتابع خصم عمولة الطلبات',[{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'مجاني مستخدم',value:(me.free_orders_used||0)+'/2',up:'طلبات',icon:'🎁'},{label:'الباقات',value:state.meta.packages.length,up:'متاحة',icon:'📦'},{label:'الأعمال',value:me.completed_jobs||0,up:'منجزة',icon:'✅'}])+balancePage(me); }
  else if(state.tab==='topups'){ let j=await api('/api/topups'); c=dashboardHero('طلبات الشحن','تابع حالة دفعاتك وموافقات الإدارة',[{label:'طلبات الشحن',value:j.topups.length,up:'إجمالي',icon:'🚚'},{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'باقات',value:state.meta.packages.length,up:'متوفرة',icon:'📦'},{label:'حالة الحساب',value:'فعال',up:'نشط',icon:'✅'}])+topupTable(j.topups); }
  else if(state.tab==='ledger'){ let j=await api('/api/ledger'); c=dashboardHero('سجل الرصيد','كل عمليات الخصم والشحن في مكان واحد',[{label:'عمليات',value:j.ledger.length,up:'مسجلة',icon:'📘'},{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'حالي',icon:'💳'},{label:'طلبات',value:me.completed_jobs||0,up:'مكتملة',icon:'✅'},{label:'تقييم',value:stars(me.rating_avg),up:'فني',icon:'⭐'}])+ledgerTable(j.ledger); }
  else { c=v17TechHome(me,counters.requests||[]); }
  layout('لوحة الفني',menu,c);
  if(state.tab==='settings') bindAreaSelect('setCity','setArea');
};
const __v17CustDashPrev = custDash;
custDash = async function(){
  await v17LoadCounters();
  await __v17CustDashPrev();
};
// refresh badges live when socket events arrive
if(socket){
  socket.on('messages-updated', ()=>{ v17LoadCounters().then(()=>{ const bells=document.querySelectorAll('.bell-btn'); bells.forEach(b=>b.innerHTML='🔔 '+v13Badge(state.chatCount)); }); });
  socket.on('requests-updated', ()=>{ if(state.user?.role==='technician') v17LoadCounters().then(()=>dashboard()); });
}


/* ===== Sallehly V18: Real-time chat read, completed list, delete request, optional image polish ===== */
state.orderFilter = state.orderFilter || 'active';
function v18IsCompleted(r){ return ['مكتمل','ملغي'].includes(r.status); }
function v18SplitRequests(rows){
  return {
    active:(rows||[]).filter(r=>!v18IsCompleted(r)),
    done:(rows||[]).filter(r=>v18IsCompleted(r))
  };
}
function v18OrdersView(rows){
  const parts=v18SplitRequests(rows||[]);
  const filter=state.orderFilter||'active';
  const selected=filter==='done'?parts.done:parts.active;
  return `<div class="v18-tabs"><button class="btn ${filter==='active'?'':'ghost'}" onclick="state.orderFilter='active';dashboard()">طلبات نشطة ${v13Badge(parts.active.length)}</button><button class="btn ${filter==='done'?'':'ghost'}" onclick="state.orderFilter='done';dashboard()">طلبات مكتملة/ملغية ${v13Badge(parts.done.length)}</button></div>${reqTable(selected)}`;
}
const __v18OldActions = actions;
actions=function(r){
  let a=__v18OldActions(r)||'';
  if(state.user?.role==='customer' && !['مكتمل','ملغي'].includes(r.status)) a+=` <button class="btn danger ghost" onclick="v18DeleteRequest(${r.id})">حذف طلبي</button>`;
  if(state.user?.role==='customer' && r.status==='مكتمل') a+=` <span class="status done-status">تم نقل الطلب إلى المكتملة</span>`;
  return a;
};
async function v18DeleteRequest(id){
  if(!confirm('هل تريد حذف/إلغاء هذا الطلب؟ سيبقى محفوظاً في السجل كملغي.')) return;
  try{ await api(`/api/requests/${id}`,{method:'DELETE'}); toast('تم إلغاء الطلب ونقله للسجل'); await v18RefreshCountersAndPage(); }
  catch(e){ toast(e.message); }
}
const __v18OldReqTable = reqTable;
reqTable=function(rows){
  if(!rows || !rows.length) return '<div class="empty">لا توجد طلبات في هذا القسم</div>';
  return __v18OldReqTable(rows);
};
// Better customer dashboard with completed list and chats tab
const __v18PrevCustDash = custDash;
custDash = async function(){
  await v17LoadCounters?.();
  const menu=[['dash','طلب جديد'],['near','البحث عن فني'],['orders','طلباتي'],['chats','الدردشات']];
  let c='';
  if(state.tab==='chats'){
    c=await chatsPage();
  }else if(state.tab==='orders'){
    let j=await api('/api/requests');
    c=dashboardHero('طلباتي','الطلبات النشطة تظهر هنا، وبعد الاكتمال تنتقل تلقائياً لقائمة المكتملة',[{label:'النشطة',value:v18SplitRequests(j.requests).active.length,up:'قيد العمل',icon:'🛒'},{label:'المكتملة',value:v18SplitRequests(j.requests).done.length,up:'سجل',icon:'✅'},{label:'الدردشات',value:state.chatCount||0,up:'غير مقروءة',icon:'💬'},{label:'الخدمات',value:state.meta.services.length,up:'متاحة',icon:'📦'}])+`<div class="dash-card"><h2>طلباتي</h2>${v18OrdersView(j.requests)}</div>`;
  }else if(state.tab==='near'){
    c=dashboardHero('البحث عن فني','ابحث حسب الخدمة والمنطقة وشاهد الفنيين المناسبين',[{label:'خدمات',value:state.meta.services.length,up:'متاحة',icon:'💼'},{label:'رسائل',value:state.chatCount||0,up:'جديدة',icon:'💬'},{label:'موقع',value:'GPS',up:'اختياري',icon:'📍'},{label:'تقييم',value:'⭐',up:'موثوق',icon:'⭐'}])+nearbyPage();
  }else{
    c=dashboardHero('لوحة العميل','انشر طلبك وأرفق صورة المشكلة اختيارياً وتابع العروض والدردشة مباشرة',[{label:'طلباتي',value:state.orderCount||0,up:'إجمالي',icon:'🛠️'},{label:'دردشات',value:state.chatCount||0,up:'غير مقروءة',icon:'💬'},{label:'خدمات',value:state.meta.services.length,up:'متوفرة',icon:'📦'},{label:'صورة المشكلة',value:'اختياري',up:'JPG/PNG',icon:'📷'}])+`<div class="dash-grid"><div class="dash-card v6-form">${requestForm()}</div>${techSearchBox?techSearchBox():''}</div>`+v11Improvements?.();
  }
  layout('لوحة العميل',menu,c);
  if(state.tab==='dash'){
    bindAreaSelect?.('qcity','qarea','qareaOtherWrap');
    bindAreaSelect?.('searchCity','searchArea');
  }
  if(state.tab==='near') loadNearby?.();
};
// Add request image drag/drop visual if present
const __v18OldRequestForm = requestForm;
requestForm=function(){
  let html=__v18OldRequestForm();
  html=html.replace('صورة المشكلة اختياري','📷 صورة المشكلة اختياري');
  html=html.replace('<input id="problemImage"', '<input id="problemImage" class="v18-file-input"');
  return html;
};
// Update unread counts immediately when chat opens / message read
async function v18RefreshCountersOnly(){
  try{
    await v17LoadCounters?.();
    document.querySelectorAll('.bell-btn').forEach(b=>b.innerHTML='🔔 '+v13Badge(state.chatCount||0));
    document.querySelectorAll('.sidebtn').forEach(btn=>{
      const txt=btn.textContent||'';
      if(txt.includes('الدردشات')){
        const b=btn.querySelector('b'); if(b) b.innerHTML=v17MenuLabel('chats','الدردشات');
      }
      if(txt.includes('طلباتي')||txt.includes('الطلبات')){
        const b=btn.querySelector('b'); if(b) b.innerHTML=v17MenuLabel('orders', state.user?.role==='customer'?'طلباتي':'الطلبات');
      }
    });
  }catch(e){}
}
async function v18RefreshCountersAndPage(){
  await v18RefreshCountersOnly();
  if(state.user && !activeChatId) dashboard();
}
const __v18PrevChat = chat;
chat = async function(id){
  if(socket){ try{ if(activeChatId) socket.emit('leave-request', activeChatId); socket.emit('join-request', id); }catch(e){} }
  await __v18PrevChat(id);
  setTimeout(v18RefreshCountersOnly,250);
};
const __v18PrevRenderMessages = renderMessages;
renderMessages=function(messages){
  __v18PrevRenderMessages(messages);
  setTimeout(v18RefreshCountersOnly,100);
};
async function v18CompleteRequest(id){
  try{ await setStatus(id,'مكتمل'); state.orderFilter='done'; toast('تم اكتمال الطلب ونقله إلى قائمة الطلبات المكتملة'); }
  catch(e){ toast(e.message); }
}
const __v18PrevActions2 = actions;
actions=function(r){
  let a='';
  if(state.user.role==='customer') a+=`<button class="btn ghost" onclick="loadOffers(${r.id})">عروض الفنيين</button> `;
  if(r.technician_id||state.user.role==='admin') a+=`<button class="btn ghost" onclick="chat(${r.id})">محادثة</button> `;
  if(state.user.role==='technician'&&['بانتظار العروض','وصلت عروض'].includes(r.status)) a+=`<button class="btn" onclick="offerForm(${r.id},'${(r.service||'').replaceAll("'",'')}')">تقديم عرض سعر</button>`;
  if(state.user.role==='customer'&&['تم اختيار عرض','قيد التنفيذ','بانتظار تأكيد الدفع'].includes(r.status)) a+=`<button class="btn green" onclick="v18CompleteRequest(${r.id})">تم اكتمال الطلب</button>`;
  if(state.user.role==='customer'&&r.status==='مكتمل') a+=`<button class="btn" onclick="rate(${r.id})">تقييم الفني</button>`;
  if(state.user.role==='customer' && !['مكتمل','ملغي'].includes(r.status)) a+=` <button class="btn danger ghost" onclick="v18DeleteRequest(${r.id})">حذف طلبي</button>`;
  return a;
};
// Real-time polling fallback + sockets for badges/orders/messages
if(!window.v18RealtimeStarted){
  window.v18RealtimeStarted=true;
  setInterval(()=>{ if(state.user && !activeChatId) v18RefreshCountersOnly(); }, 4000);
  setInterval(()=>{ if(state.user && (state.tab==='orders'||state.tab==='chats') && !activeChatId) dashboard(); }, 9000);
}
if(socket){
  socket.on('chat-badges-updated', ()=>v18RefreshCountersOnly());
  socket.on('messages-updated', data=>{
    if(activeChatId && data.requestId==activeChatId){ renderMessages(data.messages||[]); }
    v18RefreshCountersOnly();
    try{ v10Sound?.('message'); }catch(e){}
  });
  socket.on('requests-updated', ()=>{ if(state.user && !activeChatId) dashboard(); });
}


/* =========================================================
   Sallehly V20 MARKET READY
   - Polished customer/technician/admin UI
   - Optional problem image upload with preview
   - Offers marketplace: price + duration + accept/reject
   - Live Socket.IO refresh for requests, chats, badges, offers
   - Chat guard keeps normal messages allowed and blocks external contact only
   ========================================================= */
window.SALLEHLY_VERSION='V20 Market Ready';

function v20SafeTxt(x){return String(x??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function v20Badge(n){n=Number(n||0);return n>0?`<span class="v20-badge">${n>99?'99+':n}</span>`:''}
function v20StatusClass(s){s=String(s||''); if(s.includes('مكتمل'))return 'done'; if(s.includes('ملغي')||s.includes('رفض'))return 'cancel'; if(s.includes('عرض')||s.includes('بانتظار'))return 'wait'; if(s.includes('اختيار')||s.includes('تنفيذ'))return 'work'; return 'new'}
function v20ServiceIcon(name){const s=(state.meta.services||[]).find(x=>x.name===name);return s?.icon||'🧰'}

function v20LiveServicesStrip(){
  const services=state.meta.services||[];
  if(!services.length) return '';
  const cards=services.map(s=>`<button class="v20-live-card" onclick="v11SelectService('${String(s.name).replace(/'/g,"\\'")}')"><span>${s.icon||'🧰'}</span><b>${v20SafeTxt(s.name)}</b><small>متوفر الآن</small></button>`).join('');
  return `<section class="v20-live-strip"><div class="v20-strip-head"><div><h2>⚡ شريط المهن المباشر</h2><p>كل مهنة تضيفها الإدارة تظهر هنا تلقائياً وتستمر بالدوران بدون توقف</p></div><button class="btn ghost" onclick="go('services')">كل الخدمات</button></div><div class="v20-marquee"><div class="v20-marquee-track">${cards}${cards}${cards}</div></div></section>`;
}

requestForm=function(){
  return `<div class="v20-form-card"><div class="v20-card-head"><div><span class="eyebrow">طلب جديد</span><h2>🚀 اطلب خدمة الآن</h2><p class="muted">انشر الطلب، ارفع صورة المشكلة اختيارياً، واستقبل عروض السعر والمدة مباشرة.</p></div><span class="v20-pill">Live Offers</span></div>
  <form class="v20-request-form" onsubmit="createReq(event)">
    <div class="field"><label>الخدمة</label><select id="qservice" onchange="syncSearchFromRequest?.()">${(state.meta.services||[]).map(s=>`<option>${s.name}</option>`).join('')}</select></div>
    <div class="field"><label>المحافظة</label><select id="qcity" onchange="bindAreaSelect?.('qcity','qarea','qareaOtherWrap');syncSearchFromRequest?.()">${typeof governorateOptions==='function'?governorateOptions(state.user?.city||'عمان'):(state.meta.cities||[]).map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div class="field"><label>منطقة السكن</label><select id="qarea" onchange="syncSearchFromRequest?.()"></select></div>
    <div class="field hide" id="qareaOtherWrap"><label>اكتب المنطقة</label><input id="qareaOther" placeholder="اكتب اسم المنطقة"></div>
    <div class="field"><label>الوقت المطلوب</label><input id="qtime" placeholder="اليوم مساءً / بكرا صباحاً"></div>
    <div class="field full"><label>وصف المشكلة</label><textarea id="qdesc" required minlength="10" placeholder="مثال: المكيف لا يبرد وأحتاج فني اليوم، نوع الجهاز سبليت..."></textarea></div>
    <div class="field full"><label>صورة المشكلة <em>اختياري</em></label><label class="v20-upload-zone"><input id="problemImage" type="file" accept="image/png,image/jpeg,image/webp" onchange="previewProblemImage()"><span class="cam">📷</span><b>اختر صورة أو اسحبها هنا</b><small>JPG / PNG / WEBP حتى 3MB</small></label><div id="problemPreview" class="v20-preview"></div></div>
    <div class="field full v20-location-row"><button type="button" class="btn ghost" onclick="useGPS('request')">📍 تحديد موقعي الحالي</button><small class="muted">الموقع يساعد الفنيين على معرفة قربك وتقدير السعر قبل إرسال العرض.</small><div id="requestMap" class="v20-map-preview">${typeof mapBox==='function'?mapBox(state.gps?.lat,state.gps?.lng):''}</div></div>
    <button class="btn v20-submit">🚀 نشر الطلب واستقبال عروض الفنيين</button>
  </form></div>`;
};

previewProblemImage=function(){
  const file=document.getElementById('problemImage')?.files?.[0];
  const box=document.getElementById('problemPreview'); if(!box) return;
  if(!file){box.innerHTML='';return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){box.innerHTML='<small class="danger-text">نوع الصورة غير مسموح</small>';return;}
  const url=URL.createObjectURL(file);
  box.innerHTML=`<div class="v20-preview-card"><img src="${url}" alt="معاينة صورة المشكلة"><div><b>${v20SafeTxt(file.name)}</b><small>${Math.round(file.size/1024)} KB</small><button type="button" class="btn ghost mini" onclick="problemImage.value='';problemPreview.innerHTML=''">إزالة</button></div></div>`;
};

createReq=async function(e){
  e.preventDefault();
  try{
    const fd=new FormData();
    fd.append('service',document.getElementById('qservice')?.value||'');
    fd.append('city',document.getElementById('qcity')?.value||'');
    let area=(typeof selectedArea==='function'?selectedArea('qarea','qareaOther'):(document.getElementById('qarea')?.value||''));
    fd.append('area',area||'');
    fd.append('preferred_time',document.getElementById('qtime')?.value||'');
    fd.append('description',document.getElementById('qdesc')?.value||'');
    fd.append('lat',state.gps?.lat||''); fd.append('lng',state.gps?.lng||'');
    const img=document.getElementById('problemImage')?.files?.[0]; if(img) fd.append('problem_image',img);
    const btn=e.submitter||document.querySelector('.v20-submit'); if(btn){btn.disabled=true;btn.textContent='⏳ جاري نشر الطلب...'}
    await api('/api/requests',{method:'POST',body:fd});
    toast('تم نشر الطلب مباشرة — بانتظار عروض الفنيين'); try{v10Sound?.('request')}catch(_){ }
    state.tab='orders'; state.orderFilter='active'; await dashboard();
  }catch(err){toast(err.message)}
};

function v20SearchPanel(){
  return `<div class="v20-search-panel"><div class="v20-card-head"><div><span class="eyebrow">بحث مباشر</span><h2>🔎 ابحث عن فني</h2><p class="muted">فلترة حسب الخدمة، المحافظة، والمنطقة مع عرض التقييم والملف.</p></div></div>
  <div class="v20-search-grid"><div class="field"><label>كلمة البحث</label><input id="searchTechQ" placeholder="تكييف، كهرباء، سباكة..." oninput="v10AutoService?.()" onkeydown="if(event.key==='Enter')searchTechnicians()"></div><div class="field"><label>الخدمة</label><select id="searchService">${(state.meta.services||[]).map(s=>`<option>${s.name}</option>`).join('')}</select></div><div class="field"><label>المحافظة</label><select id="searchCity" onchange="bindAreaSelect?.('searchCity','searchArea')">${typeof governorateOptions==='function'?governorateOptions(state.user?.city||'عمان'):(state.meta.cities||[]).map(c=>`<option>${c}</option>`).join('')}</select></div><div class="field"><label>المنطقة</label><select id="searchArea"></select></div><button class="btn" onclick="searchTechnicians()">بحث</button><button class="btn ghost" onclick="useGPS('search')">📍 حسب موقعي</button></div></div><div id="techSearchResults" class="v20-tech-results"></div>`;
}
techSearchBox=v20SearchPanel;

function techCard(t, service, city, area){
  const avatar=t.avatar_url?`<img class="v20-tech-avatar" src="${t.avatar_url}" onerror="this.outerHTML='<div class=\'v20-tech-avatar fallback\'>ف</div>'">`:`<div class="v20-tech-avatar fallback">ف</div>`;
  const online=(Number(t.balance||0)>0 || Number(t.free_orders_used||0)<2);
  return `<div class="v20-tech-card">${avatar}<div class="v20-tech-info"><h3>${v20SafeTxt(t.name)}</h3><div>${stars(t.rating_avg)} <small>${t.rating_count||0} تقييم</small></div><div class="v20-chip-row"><span>📍 ${v20SafeTxt(t.city||city||'')}</span><span>✅ ${t.completed_jobs||0} عمل</span><span class="${online?'green-text':'danger-text'}">${online?'متاح':'بحاجة رصيد'}</span></div><p><b>الخدمات:</b> ${v20SafeTxt(t.services||'-')}</p><p><b>المناطق:</b> ${v20SafeTxt(t.areas||area||'-')}</p></div><div class="v20-tech-actions"><button class="btn ghost" onclick='openTechDetails(${JSON.stringify(t).replace(/'/g,"&#39;")}, ${JSON.stringify(service)}, ${JSON.stringify(city)}, ${JSON.stringify(area)})'>ملف الفني</button><button class="btn" onclick="directRequest(${t.id},'${String(service).replaceAll("'",'')}','${String(city).replaceAll("'",'')}','${String(area).replaceAll("'",'')}')">طلب خدمة</button></div></div>`;
}

async function searchTechnicians(){
  try{
    const q=document.getElementById('searchTechQ')?.value?.trim()||'';
    const service=document.getElementById('searchService')?.value||q||state.meta.services?.[0]?.name||'';
    const city=document.getElementById('searchCity')?.value||state.user?.city||'عمان';
    const area=document.getElementById('searchArea')?.value||'';
    const box=document.getElementById('techSearchResults'); if(box) box.innerHTML='<div class="v20-skeleton">جاري البحث عن الفنيين المناسبين...</div>';
    const j=await api(`/api/technicians?q=${encodeURIComponent(q)}&service=${encodeURIComponent(service)}&city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}&lat=${state.gps?.lat||''}&lng=${state.gps?.lng||''}`);
    const techs=j.technicians||[];
    if(!box) return;
    box.innerHTML=techs.length?techs.map(t=>techCard(t,service,city,area)).join(''):`<div class="dash-card empty">لا يوجد فنيين مناسبين الآن. جرّب خدمة أو منطقة ثانية.</div>`;
  }catch(e){toast(e.message)}
}

function v20Timeline(r){
  const steps=['بانتظار العروض','وصلت عروض','تم اختيار عرض','قيد التنفيذ','مكتمل'];
  const idx=Math.max(0,steps.findIndex(s=>String(r.status||'').includes(s)));
  return `<div class="v20-timeline">${steps.map((s,i)=>`<span class="${i<=idx?'active':''}">${s}</span>`).join('')}</div>`;
}

reqTable=function(rows){
  if(!rows||!rows.length) return '<div class="empty">لا توجد طلبات في هذا القسم</div>';
  return `<div class="v20-request-list">${rows.map(r=>`<article class="v20-request-card ${v20StatusClass(r.status)}"><div class="v20-request-head"><div><h3>${v20ServiceIcon(r.service)} #${r.id} - ${v20SafeTxt(r.service)}</h3><p>${v20SafeTxt(r.city)}${r.area?' - '+v20SafeTxt(r.area):''} • ${v20SafeTxt(r.preferred_time||'وقت غير محدد')}</p></div><span class="v20-status ${v20StatusClass(r.status)}">${v20SafeTxt(r.status)}</span></div>${v20Timeline(r)}<div class="v20-request-body">${r.problem_image_url?`<img class="v20-problem-img" src="${r.problem_image_url}" alt="صورة المشكلة">`:''}<p>${v20SafeTxt(r.description||'')}</p></div>${r.lat&&r.lng?`<details class="v20-map-details"><summary>📍 عرض موقع العميل</summary>${typeof mapBox==='function'?mapBox(r.lat,r.lng):''}</details>`:''}<div class="v20-request-meta"><span>👤 العميل: ${v20SafeTxt(r.customer_name||state.user?.name||'-')}</span><span>👨‍🔧 الفني: ${v20SafeTxt(r.technician_name||'-')}</span><span>💰 السعر: ${r.offer_price? r.offer_price+' د.أ':'بانتظار عرض'}</span><span>⏱️ المدة: ${v20SafeTxt(r.arrival_time||'-')}</span></div><div class="actions v20-actions">${actions(r)}</div><div id="offers-${r.id}" class="offers-box v20-offers-box"></div></article>`).join('')}</div>`;
};

offerCards=function(offers,req){
  if(!offers||!offers.length) return '<div class="empty small">لا توجد عروض بعد. سيظهر العرض هنا فوراً عند إرساله من الفني.</div>';
  return `<div class="v20-offers-list"><h3>العروض المستلمة (${offers.length})</h3>${offers.map(o=>`<div class="v20-offer ${o.status}">${o.avatar_url?`<img class="miniAvatar" src="${o.avatar_url}">`:'<div class="miniAvatar fallback">ف</div>'}<div class="v20-offer-info"><b>${v20SafeTxt(o.technician_name)}</b><small>📍 ${v20SafeTxt(o.technician_city||'')} • ${v20SafeTxt(o.technician_areas||'')}</small><span>${stars(o.rating_avg)} • ${o.completed_jobs||0} عمل مكتمل</span><p>${v20SafeTxt(o.note||'لا توجد ملاحظة')}</p></div><div class="v20-offer-price"><b>${o.price} د.أ</b><span>${v20SafeTxt(o.duration)}</span><em>${o.status==='accepted'?'مقبول':o.status==='rejected'?'مرفوض':'بانتظار قرار العميل'}</em>${state.user.role==='customer'&&o.status==='pending'&&req.customer_id===state.user.id?`<button class="btn green mini" onclick="decideOffer(${o.id},'accepted',${req.id})">قبول العرض</button><button class="btn red mini" onclick="decideOffer(${o.id},'rejected',${req.id})">رفض</button>`:''}</div></div>`).join('')}</div>`;
};

function v20CustomerStats(requests=[]){
  const active=requests.filter(r=>!['مكتمل','ملغي'].includes(r.status)).length;
  const done=requests.filter(r=>r.status==='مكتمل').length;
  return [{label:'طلبات نشطة',value:active,up:'مباشر',icon:'🛠️'},{label:'دردشات',value:state.chatCount||0,up:'غير مقروءة',icon:'💬'},{label:'مكتملة',value:done,up:'سجل',icon:'✅'},{label:'الخدمات',value:(state.meta.services||[]).length,up:'متاحة',icon:'📦'}];
}

custDash=async function(){
  await v17LoadCounters?.();
  const menu=[['dash','طلب جديد'],['near','البحث عن فني'],['orders','طلباتي'],['chats','الدردشات']];
  let c='';
  if(state.tab==='chats') c=await chatsPage();
  else if(state.tab==='settings') c=dashboardHero('الإعدادات','تغيير الاسم، المنطقة، الهاتف، وكلمة السر',v20CustomerStats([]))+settingsPage();
  else if(state.tab==='orders'){
    const j=await api('/api/requests');
    c=dashboardHero('طلباتي','تابع الطلبات والعروض والدردشات بشكل مباشر',v20CustomerStats(j.requests))+`<div class="dash-card"><h2>طلباتي</h2>${typeof v18OrdersView==='function'?v18OrdersView(j.requests):reqTable(j.requests)}</div>`;
  }else if(state.tab==='near'){
    c=dashboardHero('البحث عن فني','ابحث حسب الخدمة والمنطقة وشاهد التقييم والملف قبل الطلب',v20CustomerStats([]))+v20LiveServicesStrip()+v20SearchPanel();
  }else{
    const j=await api('/api/requests').catch(()=>({requests:[]}));
    c=dashboardHero('لوحة العميل','انشر طلبك بصورة اختيارية واستقبل عروض الفنيين مباشرة',v20CustomerStats(j.requests||[]))+v20LiveServicesStrip()+`<div class="v20-main-grid"><div>${requestForm()}</div><div>${v20SearchPanel()}</div></div>`;
  }
  layout('لوحة العميل',menu,c);
  if(state.tab==='dash'){bindAreaSelect?.('qcity','qarea','qareaOtherWrap');bindAreaSelect?.('searchCity','searchArea');}
  if(state.tab==='near'){bindAreaSelect?.('searchCity','searchArea'); setTimeout(searchTechnicians,100);}
  if(state.tab==='settings') bindAreaSelect?.('setCity','setArea');
};

techDash=async function(){
  await v17LoadCounters?.();
  const me=(await api('/api/me')).user; state.user=me;
  const menu=[['dash','الرئيسية'],['orders','الطلبات'],['chats','الدردشات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']];
  if(state.tab==='support'){layout('لوحة الفني',menu,supportPage());return;}
  if(state.tab==='chats'){layout('لوحة الفني',menu,await chatsPage());return;}
  if(state.tab==='settings'){layout('لوحة الفني',menu,dashboardHero('الإعدادات','عدّل حسابك وكلمة السر',[{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'تقييم',value:stars(me.rating_avg),up:'فني',icon:'⭐'},{label:'دردشات',value:state.chatCount||0,up:'غير مقروءة',icon:'💬'},{label:'طلبات',value:state.orderCount||0,up:'متاحة',icon:'🛠️'}])+settingsPage()); bindAreaSelect?.('setCity','setArea'); return;}
  if(state.tab==='orders'){
    const j=await api('/api/requests');
    layout('لوحة الفني',menu,dashboardHero('طلبات الفني','الطلبات المناسبة تظهر فوراً، أرسل عرض السعر والمدة وانتظر موافقة العميل',[{label:'طلبات مناسبة',value:j.requests.length,up:'مباشر',icon:'🛠️'},{label:'دردشات',value:state.chatCount||0,up:'غير مقروءة',icon:'💬'},{label:'الرصيد',value:(me.balance||0)+' د.أ',up:'متاح',icon:'💳'},{label:'تقييم',value:stars(me.rating_avg),up:'ثقة',icon:'⭐'}])+v20LiveServicesStrip()+`<div class="dash-card"><h2>الطلبات المتاحة والحالية</h2>${reqTable(j.requests)}</div>`);return;
  }
  return __v10TechBase?__v10TechBase():null;
};

async function v20LiveRefresh(full=false){
  try{await v17LoadCounters?.();}catch(_){ }
  if(full && state.user && !activeChatId) dashboard();
  document.querySelectorAll('.bell-btn').forEach(b=>{b.innerHTML='🔔 '+v20Badge(state.chatCount||0); b.classList.toggle('shake',Number(state.chatCount||0)>0)});
}
function v20BindRealtime(){
  setupSocket?.(); if(!socket||socket.__v20Bound) return; socket.__v20Bound=true;
  socket.on('messages-updated', data=>{ if(activeChatId && Number(data.requestId)===Number(activeChatId)){renderMessages(data.messages||[]);} v20LiveRefresh(false); try{v10Sound?.('message')}catch(_){ } });
  socket.on('chat-badges-updated', ()=>v20LiveRefresh(false));
  socket.on('requests-updated', ()=>{ if(state.user && !activeChatId){v20LiveRefresh(true);} });
  socket.on('request-status-updated', ()=>{ if(state.user && !activeChatId){v20LiveRefresh(true);} });
}
const __v20DashboardBase=dashboard; dashboard=function(){v20BindRealtime(); return __v20DashboardBase();};
const __v20InitBase=init; init=async function(){await __v20InitBase(); v20BindRealtime(); setInterval(()=>{ if(state.user && !activeChatId) v20LiveRefresh(false); },3000); setInterval(()=>{ if(state.user && !activeChatId && ['orders','chats'].includes(state.tab)) dashboard(); },7000);};

/* ===== Sallehly V21 Login/Admin Full Fix ===== */
function v21ResetSessionForRole(user, token){
  state.user=user; state.token=token; localStorage.token=token; state.tab='dash'; activeChatId=null;
  if(chatTimer){ clearInterval(chatTimer); chatTimer=null; }
}
function v21El(id){ return document.getElementById(id); }

login=function(){
  state.tab='dash';
  app.innerHTML=`<div class="auth-page v21-auth"><div class="auth-shell">
    <div class="auth-card">
      <div class="auth-logo"><span>ص</span><b>صلّحلي</b></div>
      <h1>تسجيل الدخول</h1>
      <p class="muted">ادخل بحساب العميل أو الفني أو الإدارة، وسيتم فتح اللوحة المناسبة تلقائياً.</p>
      <form class="form" onsubmit="doLogin(event)">
        <div class="field"><label>البريد الإلكتروني</label><input id="email" type="email" autocomplete="email" placeholder="example@email.com" required></div>
        <div class="field"><label>كلمة السر</label><input id="password" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
        <button class="btn big" type="submit">دخول الآن</button>
      </form>
      <div class="login-hint secure-hint"><b>تسجيل آمن</b><span>لا يتم عرض بيانات الإدارة داخل الواجهة.</span><span>يتم إنشاء حساب الإدارة من ملف .env فقط.</span></div>
      <button class="btn ghost" onclick="register('customer')">إنشاء حساب جديد</button>
    </div>
    <div class="auth-side"><div class="welcome-logo">ص</div><h2>لوحة واحدة لكل الأدوار</h2><p>عميل، فني، وإدارة بصلاحيات منفصلة وواجهات مرتبة.</p></div>
  </div></div>`;
}

doLogin=async function(e){
  e.preventDefault();
  const emailInput=v21El('email'), passInput=v21El('password');
  try{
    const j=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:emailInput.value.trim(),password:passInput.value})});
    v21ResetSessionForRole(j.user,j.token);
    toast('تم تسجيل الدخول بنجاح');
    dashboard();
  }catch(err){ toast(err.message || 'تعذر تسجيل الدخول'); }
}

register=function(role='customer'){
  state.tab='dash';
  const services=(state.meta.services||[]).map(s=>`<option value="${v15EscapeHtml(s.name)}">${v15EscapeHtml(s.name)}</option>`).join('');
  const cities=(state.meta.cities||[]).map(c=>`<option value="${v15EscapeHtml(c)}">${v15EscapeHtml(c)}</option>`).join('');
  app.innerHTML=`<div class="auth-page v21-auth"><div class="auth-shell register-shell">
    <div class="auth-card register-card">
      <div class="auth-logo"><span>ص</span><b>صلّحلي</b></div>
      <h1>إنشاء حساب</h1>
      <p class="muted">اختر نوع الحساب بدقة. صورة الفني مطلوبة للفني فقط ولا تؤثر على تسجيل دخول الإدارة.</p>
      <form class="form two" onsubmit="doRegister(event)">
        <div class="field"><label>نوع الحساب</label><select id="role" onchange="toggleTech()"><option value="customer">عميل</option><option value="technician">فني</option></select></div>
        <div class="field"><label>الاسم الكامل</label><input id="name" required minlength="2" placeholder="مثال: أحمد محمد"></div>
        <div class="field"><label>البريد الإلكتروني</label><input id="remail" type="email" autocomplete="email" required placeholder="example@email.com"></div>
        <div class="field"><label>رقم الهاتف</label><input id="phone" required placeholder="0791234567"></div>
        <div class="field"><label>كلمة السر</label><input id="rpassword" type="password" autocomplete="new-password" required minlength="8"></div>
        <div class="field"><label>المحافظة</label><select id="city">${cities}</select></div>
        <div class="field techOnly"><label>الصورة الشخصية للفني</label><input id="avatar" type="file" accept="image/png,image/jpeg,image/webp" onchange="v21PreviewAvatar()"><small class="muted">مطلوبة للفني فقط. JPG / PNG / WEBP.</small><div id="avatarPreview"></div></div>
        <div class="field techOnly"><label>الرقم الوطني</label><input id="national" placeholder="10 أرقام"></div>
        <div class="field techOnly"><label>الخدمات</label><select id="srv" multiple size="5">${services}</select><small class="muted">حدد خدمة واحدة أو أكثر.</small></div>
        <div class="field techOnly"><label>مناطق العمل</label><select id="areas" multiple size="5">${cities}</select></div>
        <button class="btn big" type="submit">إنشاء الحساب</button>
        <button class="btn ghost" type="button" onclick="login()">عندي حساب</button>
      </form>
    </div>
    <div class="auth-side"><div class="welcome-logo">ص</div><h2>انضم إلى صلّحلي</h2><p>حساب عميل لطلب الخدمات، أو حساب فني لاستقبال الطلبات حسب منطقتك ومهنتك.</p></div>
  </div></div>`;
  v21El('role').value=role;
  toggleTech();
}
function v21PreviewAvatar(){
  const f=v21El('avatar')?.files?.[0], box=v21El('avatarPreview'); if(!box) return;
  if(!f){ box.innerHTML=''; return; }
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)){ box.innerHTML=''; toast('نوع الصورة غير مسموح'); return; }
  box.innerHTML=`<img class="problem-preview avatar-preview" src="${URL.createObjectURL(f)}" alt="صورة الفني">`;
}
toggleTech=function(){
  const isTech=v21El('role')?.value==='technician';
  document.querySelectorAll('.techOnly').forEach(x=>x.style.display=isTech?'block':'none');
  const national=v21El('national'); if(national) national.required=isTech;
}
doRegister=async function(e){
  e.preventDefault();
  try{
    const role=v21El('role').value;
    const fd=new FormData();
    fd.append('role',role);
    fd.append('name',v21El('name').value.trim());
    fd.append('email',v21El('remail').value.trim().toLowerCase());
    fd.append('phone',v21El('phone').value.trim());
    fd.append('password',v21El('rpassword').value);
    fd.append('city',v21El('city').value);
    fd.append('national_number',role==='technician'?(v21El('national')?.value.trim()||''):'');
    fd.append('services',role==='technician'?vals('#srv').join(','):'');
    fd.append('areas',role==='technician'?vals('#areas').join(','):'');
    const avatar=v21El('avatar');
    if(role==='technician'){
      if(!avatar?.files?.[0]) throw new Error('الرجاء اختيار صورة شخصية للفني');
      fd.append('avatar',avatar.files[0]);
    }
    const j=await api('/api/auth/register',{method:'POST',body:fd});
    v21ResetSessionForRole(j.user,j.token);
    toast('تم إنشاء الحساب بنجاح');
    dashboard();
  }catch(err){ toast(err.message || 'تعذر إنشاء الحساب'); }
}

function v21StatusCounts(rows){
  return {
    all: rows.length,
    open: rows.filter(r=>['بانتظار العروض','وصلت عروض'].includes(r.status)).length,
    active: rows.filter(r=>['تم اختيار عرض','قيد التنفيذ','بانتظار تأكيد الدفع'].includes(r.status)).length,
    done: rows.filter(r=>r.status==='مكتمل').length
  };
}
function v21RequestDetails(id){
  api('/api/requests').then(j=>{
    const r=(j.requests||[]).find(x=>String(x.id)===String(id));
    if(!r) return toast('الطلب غير موجود');
    const html=`<div class="v21-modal"><div class="v21-modal-card"><button class="welcome-close" onclick="this.closest('.v21-modal').remove()">×</button>
      <h2>تفاصيل الطلب #${r.id}</h2>
      <div class="request-meta v21-details">
        <span>الخدمة: <b>${v15EscapeHtml(r.service||'-')}</b></span>
        <span>الحالة: <b>${v15EscapeHtml(r.status||'-')}</b></span>
        <span>العميل: <b>${v15EscapeHtml(r.customer_name||'-')}</b></span>
        <span>الفني: <b>${v15EscapeHtml(r.technician_name||'-')}</b></span>
        <span>المحافظة: <b>${v15EscapeHtml(r.city||'-')}</b></span>
        <span>المنطقة: <b>${v15EscapeHtml(r.area||'-')}</b></span>
        <span>السعر: <b>${r.offer_price? v15EscapeHtml(r.offer_price)+' د.أ':'-'}</b></span>
        <span>المدة: <b>${v15EscapeHtml(r.arrival_time||'-')}</b></span>
      </div>
      ${r.problem_image_url?`<img class="problem-img big-preview" src="${r.problem_image_url}" alt="صورة المشكلة">`:''}
      <p class="v21-desc">${v15EscapeHtml(r.description||'لا يوجد وصف')}</p>
      <div class="actions"><button class="btn ghost" onclick="loadOffers(${r.id});this.closest('.v21-modal').remove();state.tab='orders';dashboard();setTimeout(()=>loadOffers(${r.id}),250)">عرض عروض الفنيين</button><button class="btn" onclick="chat(${r.id})">فتح المحادثة</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  }).catch(e=>toast(e.message));
}

const __v21OldActions = actions;
actions=function(r){
  let a='';
  if(state.user?.role==='admin'){
    a+=`<button class="btn" onclick="v21RequestDetails(${r.id})">فتح التفاصيل</button> `;
    a+=`<button class="btn ghost" onclick="loadOffers(${r.id})">العروض</button> `;
    a+=`<button class="btn ghost" onclick="chat(${r.id})">الشات</button> `;
    if(r.status!=='مكتمل') a+=`<button class="btn green" onclick="setStatus(${r.id},'مكتمل')">إنهاء</button> `;
    if(!['مكتمل','ملغي'].includes(r.status)) a+=`<button class="btn danger" onclick="setStatus(${r.id},'ملغي')">إلغاء</button>`;
    return a;
  }
  return __v21OldActions(r);
}

const __v21OldReqTable=reqTable;
reqTable=function(rows){
  if(!rows || !rows.length) return '<div class="empty">لا توجد طلبات</div>';
  return `<div class="request-list v21-request-list">${rows.map(r=>`<div class="request-card v21-request-card">
    <div class="request-head"><div><b>#${r.id} - ${v15EscapeHtml(r.service||'-')}</b><p class="muted">${v15EscapeHtml(r.city||'-')}${r.area?' - '+v15EscapeHtml(r.area):''} • ${v15EscapeHtml(r.preferred_time||'بدون وقت محدد')}</p></div><span class="status">${v15EscapeHtml(r.status||'-')}</span></div>
    ${r.problem_image_url?`<img class="problem-img" src="${r.problem_image_url}" alt="صورة المشكلة">`:''}
    <p>${v15EscapeHtml(r.description||'')}</p>
    <div class="request-meta"><span>الفني: ${v15EscapeHtml(r.technician_name||'-')}</span><span>العميل: ${v15EscapeHtml(r.customer_name||'-')}</span><span>السعر: ${r.offer_price? v15EscapeHtml(r.offer_price)+' د.أ':'-'}</span><span>المدة: ${v15EscapeHtml(r.arrival_time||'-')}</span></div>
    <div class="actions">${actions(r)}</div><div id="offers-${r.id}" class="offers-box"></div>
  </div>`).join('')}</div>`;
}

admin=async function(){
  state.user = (await api('/api/me')).user;
  const menu=[['dash','لوحة الإدارة'],['users','المستخدمين'],['orders','الطلبات'],['topups','شحن الفنيين'],['services','المهن والخدمات'],['packages','الباقات'],['support','الدعم'],['violations','محاولات الشات']];
  let c='';
  try{
    if(state.tab==='users'){
      const j=await api('/api/admin/users');
      c=dashboardHero('إدارة المستخدمين','كل حسابات العملاء والفنيين مع التفعيل والتعطيل',[{label:'المستخدمين',value:j.users.length,up:'إجمالي',icon:'👥'},{label:'الفنيين',value:j.users.filter(u=>u.role==='technician').length,up:'فني',icon:'👨‍🔧'},{label:'العملاء',value:j.users.filter(u=>u.role==='customer').length,up:'عميل',icon:'🙂'},{label:'نشط',value:j.users.filter(u=>u.is_active).length,up:'حساب',icon:'✅'}])+usersTable(j.users);
    }else if(state.tab==='orders'){
      const j=await api('/api/requests'); const s=v21StatusCounts(j.requests||[]);
      c=dashboardHero('إدارة الطلبات','افتح أي طلب، راجع العروض، الشات، الصورة، والحالة',[{label:'كل الطلبات',value:s.all,up:'إجمالي',icon:'🛒'},{label:'مفتوحة',value:s.open,up:'طلبات',icon:'⚡'},{label:'قيد التنفيذ',value:s.active,up:'طلبات',icon:'🔧'},{label:'مكتملة',value:s.done,up:'طلبات',icon:'✅'}])+`<div class="dash-card"><h2>كل الطلبات</h2>${reqTable(j.requests||[])}</div>`;
    }else if(state.tab==='topups'){
      const j=await api('/api/topups');
      c=dashboardHero('شحن الفنيين','راجع إثباتات الدفع وفعّل الرصيد',[{label:'طلبات الشحن',value:j.topups.length,up:'إجمالي',icon:'🚚'},{label:'بانتظار',value:j.topups.filter(t=>t.status==='pending').length,up:'مراجعة',icon:'⏳'},{label:'موافق عليها',value:j.topups.filter(t=>t.status==='approved').length,up:'عملية',icon:'✅'},{label:'مرفوضة',value:j.topups.filter(t=>t.status==='rejected').length,up:'عملية',icon:'❌'}])+topupTable(j.topups);
    }else if(state.tab==='services'){
      c=dashboardHero('المهن والخدمات','أي مهنة تضيفها تظهر مباشرة في الشريط المتحرك والطلبات',[{label:'الخدمات',value:state.meta.services.length,up:'متاحة',icon:'💼'},{label:'الشريط',value:'Live',up:'مباشر',icon:'⚡'},{label:'بحث',value:'فعال',up:'للعميل',icon:'🔎'},{label:'حالة',value:'جاهز',up:'نظام',icon:'✅'}])+`<div class="dash-grid two"><div class="dash-card v6-form">${servicesAdmin()}</div>${promoBox('إضافة خدمة جديدة','بعد الإضافة ستظهر في القوائم وشريط المهن المباشر تلقائياً')}</div>${categoriesBox()}`;
    }else if(state.tab==='packages'){
      c=dashboardHero('إدارة الباقات','أنشئ باقات شحن للفنيين وحدد العمولة',[{label:'الباقات',value:state.meta.packages.length,up:'متاحة',icon:'📦'},{label:'الدفع',value:'بنكي',up:'تحويل',icon:'🏦'},{label:'العمولة',value:'2 د.أ',up:'افتراضي',icon:'💳'},{label:'حالة',value:'فعال',up:'جاهز',icon:'✅'}])+packagesAdmin();
    }else if(state.tab==='support'){
      const j=await api('/api/support');
      c=dashboardHero('الدعم الفني','كل تذاكر الدعم من العملاء والفنيين',[{label:'التذاكر',value:j.tickets.length,up:'إجمالي',icon:'🎧'},{label:'مفتوحة',value:j.tickets.filter(t=>t.status==='open').length,up:'جديدة',icon:'📩'},{label:'مستخدمين',value:new Set(j.tickets.map(t=>t.user_id)).size,up:'تواصلوا',icon:'👥'},{label:'جاهز',value:'24/7',up:'دعم',icon:'✅'}])+`<div class="dash-card"><h2>تذاكر الدعم</h2>${j.tickets.length?`<div class="table-wrap"><table><thead><tr><th>#</th><th>المستخدم</th><th>النوع</th><th>العنوان</th><th>التفاصيل</th><th>التاريخ</th></tr></thead><tbody>${j.tickets.map(t=>`<tr><td>${t.id}</td><td>${v15EscapeHtml(t.user_name||'-')}<br><small>${v15EscapeHtml(t.email||'')}</small></td><td>${v15EscapeHtml(t.type||'-')}</td><td>${v15EscapeHtml(t.title||'-')}</td><td>${v15EscapeHtml(t.body||'-')}</td><td>${v15EscapeHtml(t.created_at||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">لا توجد تذاكر</div>'}</div>`;
    }else if(state.tab==='violations'){
      const j=await api('/api/chat-violations');
      c=dashboardHero('محاولات التواصل الخارجي','أي رقم أو واتساب أو إيميل يتم تسجيله هنا',[{label:'المحاولات',value:j.violations.length,up:'آخر 200',icon:'🛡️'},{label:'الشات',value:'محمي',up:'فعال',icon:'💬'},{label:'العمولة',value:'محفوظة',up:'منصة',icon:'💰'},{label:'الأمان',value:'Live',up:'مباشر',icon:'⚡'}])+`<div class="dash-card"><h2>السجل</h2>${j.violations.length?`<div class="table-wrap"><table><thead><tr><th>#</th><th>المستخدم</th><th>الطلب</th><th>السبب</th><th>المحتوى</th><th>الوقت</th></tr></thead><tbody>${j.violations.map(v=>`<tr><td>${v.id}</td><td>${v15EscapeHtml(v.user_name||'-')}<br><small>${v15EscapeHtml(v.user_email||'')}</small></td><td>#${v.request_id}<br><small>${v15EscapeHtml(v.service||'')}</small></td><td>${v15EscapeHtml(v.reason||'')}</td><td>${v15EscapeHtml(v.body||'')}</td><td>${v15EscapeHtml(v.created_at||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">لا توجد محاولات ممنوعة</div>'}</div>`;
    }else{
      const j=await api('/api/admin/stats'); const s=j.stats;
      c=dashboardHero('مرحباً بك في لوحة الإدارة','تحكم كامل في المنصة من مكان واحد',[{label:'العملاء',value:s.customers||0,up:'حساب',icon:'🙂'},{label:'الفنيين',value:s.technicians||0,up:'حساب',icon:'👨‍🔧'},{label:'الطلبات',value:s.requests||0,up:'إجمالي',icon:'🛒'},{label:'مكتملة',value:s.completed||0,up:'طلب',icon:'✅'}])+`<div class="dash-grid"><div>${activityBox()}</div><div class="dash-card v6-form">${servicesAdmin()}</div>${promoBox('لوحة إدارة جاهزة','المستخدمين، الطلبات، الشحن، الخدمات، الدعم، ومحاولات التواصل الخارجي')}</div>${categoriesBox()}${chartsBox()}`;
    }
  }catch(err){ c=`<div class="dash-card"><h2>حدث خطأ</h2><p class="muted">${v15EscapeHtml(err.message||'تعذر تحميل الصفحة')}</p><button class="btn" onclick="state.tab='dash';dashboard()">رجوع للوحة</button></div>`; }
  layout('لوحة الإدارة',menu,c);
}

logout=async function(){
  try{ await api('/api/auth/logout',{method:'POST'}); }catch(e){}
  localStorage.removeItem('token'); delete localStorage.token; state.user=null; state.token=''; state.tab='dash'; activeChatId=null;
  if(chatTimer){ clearInterval(chatTimer); chatTimer=null; }
  toast('تم تسجيل الخروج');
  login();
}

/* Small styling injected for V21 fixes */
(function(){
  const css=`.v21-auth{min-height:calc(100vh - 90px);display:grid;place-items:center}.auth-shell{display:grid;grid-template-columns:1.1fr .9fr;max-width:1100px;width:min(94vw,1100px);background:#fff;border:1px solid #dbe7ff;border-radius:34px;overflow:hidden;box-shadow:0 28px 80px rgba(19,31,75,.16)}.auth-card{padding:44px}.auth-side{background:linear-gradient(145deg,#10235f,#7434ee);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:44px}.auth-logo{display:flex;gap:10px;align-items:center;margin-bottom:14px}.auth-logo span,.auth-side .welcome-logo{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#1e88ff,#8a36ff);color:#fff;font-weight:900;font-size:30px}.login-hint{display:grid;gap:6px;background:#f4f8ff;border:1px solid #dbe7ff;border-radius:18px;padding:14px;margin:14px 0}.v21-modal{position:fixed;inset:0;background:rgba(4,10,30,.45);z-index:9999;display:grid;place-items:center;padding:22px}.v21-modal-card{position:relative;max-width:820px;width:100%;max-height:90vh;overflow:auto;background:#fff;border-radius:26px;padding:30px;box-shadow:0 30px 90px rgba(0,0,0,.25)}.v21-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.v21-desc{background:#f6f9ff;border:1px solid #dbe7ff;border-radius:18px;padding:14px}.big-preview{max-height:340px;object-fit:contain}.danger{background:#ff3b5c!important;color:#fff!important}.avatar-preview{max-width:150px;height:150px;object-fit:cover;border-radius:22px;margin-top:10px}@media(max-width:850px){.auth-shell{grid-template-columns:1fr}.auth-side{display:none}.v21-details{grid-template-columns:1fr}}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();

/* ===== Sallehly V22 FINAL TECH PANEL FIX =====
   Fixes: technician sidebar tabs, chats, orders, topups, ledger, balance,
   customer optional problem image, live refresh and polished UI.
*/
function v22Money(n){ return (Number(n||0)).toFixed(2).replace('.00','')+' د.أ'; }
function v22UnreadBadge(n){ n=Number(n||0); return n>0?`<span class="badge-dot">${n}</span>`:''; }
function v22TechMetrics(me, requests=[]){
  const open=requests.filter(r=>['بانتظار العروض','وصلت عروض'].includes(r.status)).length;
  const active=requests.filter(r=>r.technician_id===me.id && !['مكتمل','ملغي'].includes(r.status)).length;
  return [
    {label:'طلبات متاحة',value:open,up:'Live',icon:'🛠️'},
    {label:'دردشات',value:state.chatCount||0,up:'غير مقروءة',icon:'💬'},
    {label:'الرصيد',value:v22Money(me.balance),up:'متاح',icon:'💳'},
    {label:'طلب نشط',value:active,up:'قيد العمل',icon:'⚡'}
  ];
}
function v22Safe(v){ return (typeof v15EscapeHtml==='function'?v15EscapeHtml(String(v??'')):String(v??'')); }
async function v22Counters(){ try{ return await v17LoadCounters(); }catch(e){ return {requests:[],chats:[]}; } }
function v22TechWelcome(me, requests){
  return dashboardHero('لوحة الفني','كل شيء يعمل من هنا: الطلبات، الدردشات، الشحن، الرصيد والسجل.',v22TechMetrics(me,requests))+
  v20LiveServicesStrip()+
  `<div class="v22-grid">
    <div class="dash-card v22-action" onclick="state.tab='orders';dashboard()"><span>🛠️</span><h3>الطلبات المتاحة</h3><p>شاهد الطلبات المناسبة لمهنتك ومناطقك وقدم عرض سعر ومدة.</p></div>
    <div class="dash-card v22-action" onclick="state.tab='chats';dashboard()"><span>💬</span><h3>الدردشات ${v22UnreadBadge(state.chatCount)}</h3><p>كل محادثاتك مع العملاء تظهر هنا مع عداد الرسائل الجديدة.</p></div>
    <div class="dash-card v22-action" onclick="state.tab='balance';dashboard()"><span>💳</span><h3>الرصيد والباقات</h3><p>اشحن رصيدك واختر باقة مناسبة لتفعيل استقبال الطلبات.</p></div>
    <div class="dash-card v22-action" onclick="state.tab='ledger';dashboard()"><span>📘</span><h3>سجل الرصيد</h3><p>تابع خصم العمولة وعمليات الشحن بشكل واضح.</p></div>
  </div><div class="dash-card"><h2>آخر الطلبات المناسبة</h2>${reqTable((requests||[]).slice(0,6))}</div>`;
}
function v22TechOrders(me, requests){
  const split=typeof v18SplitRequests==='function'?v18SplitRequests(requests):{active:requests,done:[]};
  const filter=state.orderFilter||'active';
  const selected=filter==='done'?split.done:split.active;
  return dashboardHero('طلبات الفني','طلبات العملاء تظهر هنا مباشرة. أرسل عرض السعر والمدة وانتظر موافقة العميل.',v22TechMetrics(me,requests))+
    v20LiveServicesStrip()+
    `<div class="dash-card"><div class="v22-head"><div><h2>الطلبات المتاحة والحالية</h2><p class="muted">إذا قبل العميل عرضك يفتح الشات ويتحول الطلب لقيد التنفيذ.</p></div><button class="btn ghost" onclick="dashboard()">تحديث الآن</button></div>
    <div class="v18-tabs"><button class="btn ${filter==='active'?'':'ghost'}" onclick="state.orderFilter='active';dashboard()">نشطة ${v22UnreadBadge(split.active.length)}</button><button class="btn ${filter==='done'?'':'ghost'}" onclick="state.orderFilter='done';dashboard()">مكتملة/ملغية ${v22UnreadBadge(split.done.length)}</button></div>${reqTable(selected)}</div>`;
}
async function v22TechTopups(me){
  const j=await api('/api/topups');
  return dashboardHero('طلبات الشحن','تابع حالة طلبات الشحن وإثباتات الدفع التي رفعتها للإدارة.',[
    {label:'طلبات الشحن',value:j.topups.length,up:'إجمالي',icon:'🚚'},
    {label:'بانتظار',value:j.topups.filter(t=>t.status==='pending').length,up:'مراجعة',icon:'⏳'},
    {label:'الرصيد',value:v22Money(me.balance),up:'حالي',icon:'💳'},
    {label:'الباقات',value:state.meta.packages.length,up:'متاحة',icon:'📦'}
  ])+`<div class="dash-card"><div class="v22-head"><h2>طلبات الشحن</h2><button class="btn" onclick="state.tab='balance';dashboard()">شحن جديد</button></div>${topupTable(j.topups)}</div>`;
}
async function v22TechLedger(me){
  const j=await api('/api/ledger');
  return dashboardHero('سجل الرصيد','كل عمليات الشحن والخصم والعمولة محفوظة هنا.',[
    {label:'عمليات',value:j.ledger.length,up:'مسجلة',icon:'📘'},
    {label:'الرصيد',value:v22Money(me.balance),up:'حالي',icon:'💳'},
    {label:'أعمال مكتملة',value:me.completed_jobs||0,up:'طلب',icon:'✅'},
    {label:'تقييم',value:stars(me.rating_avg),up:'فني',icon:'⭐'}
  ])+`<div class="dash-card"><h2>السجل المالي</h2>${ledgerTable(j.ledger)}</div>`;
}
function v22TechBalance(me){
  return dashboardHero('الرصيد والباقات','اشحن الرصيد من خلال باقة، ثم ارفع إثبات الدفع للإدارة.',[
    {label:'رصيدك',value:v22Money(me.balance),up:'متاح',icon:'💳'},
    {label:'طلبات مجانية',value:(me.free_orders_used||0)+'/2',up:'مستخدمة',icon:'🎁'},
    {label:'الباقات',value:state.meta.packages.length,up:'متاحة',icon:'📦'},
    {label:'حالة الحساب',value:'فعال',up:'جاهز',icon:'✅'}
  ])+balancePage(me);
}

// Strong final technician dashboard: no fallback to old broken versions
techDash=async function(){
  const me=(await api('/api/me')).user; state.user=me;
  await v22Counters();
  const menu=[['dash','الرئيسية'],['orders','الطلبات'],['chats','الدردشات'],['balance','الرصيد والباقات'],['topups','طلبات الشحن'],['ledger','سجل الرصيد']];
  let content='';
  try{
    if(state.tab==='orders'){
      const j=await api('/api/requests'); content=v22TechOrders(me,j.requests||[]);
    }else if(state.tab==='chats'){
      content=dashboardHero('الدردشات','كل محادثات العملاء في مكان واحد، والرسائل الجديدة تظهر بعداد أحمر.',v22TechMetrics(me,[]))+await chatsPage();
    }else if(state.tab==='balance'){
      content=v22TechBalance(me);
    }else if(state.tab==='topups'){
      content=await v22TechTopups(me);
    }else if(state.tab==='ledger'){
      content=await v22TechLedger(me);
    }else if(state.tab==='settings'){
      content=dashboardHero('الإعدادات','تعديل الاسم، الهاتف، المنطقة، وكلمة السر.',v22TechMetrics(me,[]))+settingsPage();
    }else if(state.tab==='support'){
      content=dashboardHero('الدعم الفني','أرسل مشكلة للإدارة وسيتم متابعتها.',v22TechMetrics(me,[]))+supportPage();
    }else{
      const j=await api('/api/requests'); content=v22TechWelcome(me,j.requests||[]);
    }
  }catch(err){
    content=`<div class="dash-card"><h2>تعذر تحميل القسم</h2><p class="muted">${v22Safe(err.message||'حدث خطأ')}</p><button class="btn" onclick="dashboard()">إعادة المحاولة</button></div>`;
  }
  layout('لوحة الفني',menu,content);
  if(state.tab==='settings') bindAreaSelect?.('setCity','setArea');
};

// Final customer request form with clear optional image upload + preview
requestForm=function(){
  return `<div class="card bluehint offer-request v22-request-form"><h2>طلب خدمة جديد</h2><p class="muted">حدد الخدمة والمنطقة، أضف وصف المشكلة، والصورة اختيارية لكنها تساعد الفني يعطيك سعر أدق.</p>
  <form class="form two" onsubmit="createReq(event)">
    <div class="field"><label>الخدمة</label><select id="qservice">${state.meta.services.map(s=>`<option>${v22Safe(s.name)}</option>`).join('')}</select></div>
    <div class="field"><label>المحافظة</label><select id="qcity">${typeof governorateOptions==='function'?governorateOptions(state.user?.city||'عمان'):state.meta.cities.map(c=>`<option>${v22Safe(c)}</option>`).join('')}</select></div>
    <div class="field"><label>منطقة السكن</label><select id="qarea"></select></div>
    <div class="field"><label>الوقت المطلوب</label><input id="qtime" placeholder="مثال: اليوم مساءً"></div>
    <div class="field" style="grid-column:1/-1"><label>وصف المشكلة</label><textarea id="qdesc" required minlength="10" placeholder="مثال: المكيف لا يبرد وأحتاج فني اليوم"></textarea></div>
    <div class="field" style="grid-column:1/-1"><label>📷 صورة المشكلة <span class="muted">اختياري</span></label><label class="v22-upload"><input id="problemImage" type="file" accept="image/png,image/jpeg,image/webp" onchange="previewProblemImage()"><span>اضغط لاختيار صورة أو اسحبها هنا</span><small>JPG / PNG / WEBP حتى 3MB</small></label><div id="problemPreview"></div></div>
    <div class="field" style="grid-column:1/-1"><button type="button" class="btn ghost" onclick="useGPS('request')">📍 تحديد موقعي الحالي</button><small class="muted">الموقع يساعد الفنيين على معرفة قربك قبل تقديم العرض.</small><div id="requestMap">${typeof mapBox==='function'?mapBox(state.gps?.lat,state.gps?.lng):''}</div></div>
    <button class="btn big" type="submit">🚀 نشر الطلب واستقبال العروض</button>
  </form></div>`;
};
createReq=async function(e){
  e.preventDefault();
  try{
    const fd=new FormData();
    fd.append('service',document.getElementById('qservice').value);
    fd.append('city',document.getElementById('qcity').value);
    fd.append('area',document.getElementById('qarea')?.value||'');
    fd.append('preferred_time',document.getElementById('qtime').value||'');
    fd.append('description',document.getElementById('qdesc').value.trim());
    fd.append('lat',state.gps?.lat||''); fd.append('lng',state.gps?.lng||'');
    const img=document.getElementById('problemImage')?.files?.[0];
    if(img) fd.append('problem_image',img);
    await api('/api/requests',{method:'POST',body:fd});
    toast('تم نشر الطلب بنجاح، وسيظهر للفنيين مباشرة');
    state.tab='orders'; state.orderFilter='active'; dashboard();
  }catch(err){ toast(err.message); }
};
previewProblemImage=function(){
  const file=document.getElementById('problemImage')?.files?.[0], box=document.getElementById('problemPreview');
  if(!box) return; if(!file){ box.innerHTML=''; return; }
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){ box.innerHTML=''; toast('نوع الصورة غير مسموح'); return; }
  if(file.size>3*1024*1024){ box.innerHTML=''; toast('حجم الصورة كبير، الحد الأقصى 3MB'); return; }
  box.innerHTML=`<img class="problem-preview v22-preview" src="${URL.createObjectURL(file)}" alt="معاينة صورة المشكلة"><button type="button" class="btn ghost mini" onclick="document.getElementById('problemImage').value='';document.getElementById('problemPreview').innerHTML=''">إزالة الصورة</button>`;
};

// Make chat/order badges refresh live without breaking pages
if(!window.v22LiveStarted){
  window.v22LiveStarted=true;
  setInterval(async()=>{ if(state.user && !activeChatId){ await v22Counters(); document.querySelectorAll('.bell-btn').forEach(b=>b.innerHTML='🔔 '+v22UnreadBadge(state.chatCount)); } },2500);
  setInterval(()=>{ if(state.user && !activeChatId && ['orders','chats','topups','ledger'].includes(state.tab)) dashboard(); },8000);
}

(function(){
  const css=`
  .v22-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin:22px 0}.v22-action{cursor:pointer;transition:.25s;min-height:170px}.v22-action:hover{transform:translateY(-6px);box-shadow:0 24px 60px rgba(38,80,230,.16)}.v22-action span{width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#2d8cff,#7b35f3);display:grid;place-items:center;font-size:26px;color:#fff;margin-bottom:12px}.v22-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px}.badge-dot{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:#f43255;color:#fff;font-size:12px;font-weight:900;margin-inline-start:8px;box-shadow:0 8px 18px rgba(244,50,85,.35)}.v22-upload{display:grid;place-items:center;text-align:center;min-height:145px;border:2px dashed #b9cff8;border-radius:24px;background:linear-gradient(180deg,#f7fbff,#eef6ff);cursor:pointer;color:#1d47d8;font-weight:900}.v22-upload input{display:none}.v22-upload small{display:block;color:#7686a5;margin-top:8px}.v22-preview{max-width:260px;max-height:180px;border-radius:20px;margin-top:12px;border:1px solid #d7e4fa;object-fit:cover}.v22-request-form textarea{min-height:130px}.sidebtn{cursor:pointer}.admin-menu .sidebtn.active{box-shadow:0 14px 34px rgba(47,104,255,.22)}.table-wrap,.request-list,.v20-request-list{overflow:auto}@media(max-width:1100px){.v22-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.v22-grid{grid-template-columns:1fr}.v22-head{display:block}.v22-upload{min-height:120px}}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();


/* ===== Sallehly V23 Security + Mobile Polish ===== */
login=function(){
  state.tab='dash';
  app.innerHTML=`<div class="auth-page v23-auth"><div class="auth-shell v23-auth-shell">
    <div class="auth-card v23-auth-card">
      <div class="auth-logo"><span>ص</span><b>صلّحلي</b></div>
      <h1>تسجيل الدخول</h1>
      <p class="muted">ادخل بحسابك فقط. حساب الإدارة مخفي ولا تظهر بياناته داخل الموقع لحماية المنصة.</p>
      <form class="form v23-login-form" onsubmit="doLogin(event)">
        <div class="field"><label>البريد الإلكتروني</label><input id="email" type="email" autocomplete="email" placeholder="example@email.com" required></div>
        <div class="field"><label>كلمة السر</label><input id="password" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
        <button class="btn big" type="submit">دخول آمن</button>
      </form>
      <div class="login-hint secure-hint"><b>🔐 حماية الإدارة</b><span>لا توجد بيانات أدمن ظاهرة في الواجهة أو ملفات GitHub.</span><span>يتم ضبط حساب الإدارة من ملف .env على السيرفر.</span></div>
      <button class="btn ghost" onclick="register('customer')">إنشاء حساب جديد</button>
    </div>
    <div class="auth-side v23-auth-side"><div class="welcome-logo">ص</div><h2>صلّحلي</h2><p>منصة صيانة آمنة، صلاحيات منفصلة، وتصميم متوافق مع الهاتف.</p><div class="secure-list"><span>JWT</span><span>Roles</span><span>Protected Admin</span></div></div>
  </div></div>`;
}

(function(){
  const css=`
  .secure-hint{background:#eef7ff;border:1px solid #cfe3ff;color:#173263}.secure-hint b{color:#0b3bd8}.v23-auth{padding:18px}.v23-auth-shell{width:min(96vw,1080px)}.v23-auth-card h1{font-size:clamp(30px,5vw,52px)}.secure-list{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:18px}.secure-list span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.25);padding:8px 12px;border-radius:999px;font-weight:900}
  @media(max-width:920px){
    .nav{height:auto;min-height:76px;padding:12px 16px}.brand{font-size:26px}.menu{display:grid!important}.links{position:fixed;top:76px;left:12px;right:12px;background:rgba(255,255,255,.97);border:1px solid #dbe7ff;border-radius:24px;box-shadow:0 24px 70px rgba(20,37,83,.16);padding:14px;display:none;z-index:50}.open .links{display:grid;gap:10px}.links a,.links button{width:100%;justify-content:center;text-align:center}.hero,.pro-hero{grid-template-columns:1fr!important;padding:28px 18px!important}.hero h1{font-size:clamp(32px,8vw,48px)!important}.phone{display:none!important}.section,.page{padding:18px!important}.grid,.feature-grid,.steps-grid,.dash-grid,.dash-grid.two,.v20-main-grid{grid-template-columns:1fr!important}.admin-shell{display:block!important}.admin-sidebar{position:relative!important;inset:auto!important;width:100%!important;min-height:auto!important;border-radius:0 0 26px 26px!important;padding:18px!important}.admin-logo{font-size:28px!important}.admin-menu{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.admin-menu .sidebtn{min-height:56px!important;padding:12px!important}.admin-main{padding:16px!important}.admin-top{display:grid!important;grid-template-columns:1fr!important;gap:12px}.admin-search{width:100%!important}.admin-actions{justify-content:space-between!important}.dashboard-hero,.v6-hero{padding:22px!important;border-radius:26px!important}.stats-grid,.hero-stats{grid-template-columns:1fr 1fr!important}.stat-card{min-height:120px!important}.v20-live-strip{border-radius:24px!important;padding:16px!important}.v20-live-card{min-width:210px!important}.v20-search-grid,.v20-request-form,.form.two{grid-template-columns:1fr!important}.v20-tech-card{grid-template-columns:1fr!important;text-align:start}.v20-tech-actions{display:grid!important;grid-template-columns:1fr 1fr}.request-card,.v21-request-card,.v20-request-card{padding:16px!important}.request-head,.v20-request-head{display:block!important}.request-meta,.v21-details{grid-template-columns:1fr!important}.table-wrap{overflow:auto}.auth-shell,.v23-auth-shell{grid-template-columns:1fr!important;border-radius:26px!important}.auth-side,.v23-auth-side{display:none!important}.auth-card,.v23-auth-card{padding:28px 18px!important}.topbar{display:grid!important;gap:10px}.sidebar{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));position:relative!important;width:100%!important}.panel{grid-template-columns:1fr!important}.v22-grid{grid-template-columns:1fr!important}.v22-upload{min-height:112px!important}.problem-preview,.v22-preview{max-width:100%!important;width:100%!important}.chat-page .card{padding:14px!important}.chat-box{height:48vh!important}.chat-form{display:grid!important;grid-template-columns:1fr!important;gap:10px}.clean-logout,.v17-top-logout{font-size:14px!important;padding:10px 12px!important}
  }
  @media(max-width:520px){
    body{font-size:15px}.brand span,.admin-logo span{width:42px!important;height:42px!important}.btn.big,.btn{min-height:48px}.stats-grid,.hero-stats{grid-template-columns:1fr!important}.admin-menu{grid-template-columns:1fr}.v20-tech-actions{grid-template-columns:1fr}.v20-timeline{grid-template-columns:1fr!important}.v20-offer{grid-template-columns:1fr!important}.v20-live-card{min-width:185px!important;padding:12px!important}.dashboard-hero h1{font-size:32px!important}.auth-card h1{font-size:34px!important}.nav .btn{padding:10px 12px!important}.toast{max-width:92vw!important}
  }
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();
