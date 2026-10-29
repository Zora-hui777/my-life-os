/* My Life OS Learning Studio — local-first. No pretend AI calls. */
(function(){
const M=()=>{if(!state.mentor||typeof state.mentor!=='object')state.mentor={};for(const k of ['inbox','topics','resources','grades','relays'])if(!Array.isArray(state.mentor[k]))state.mentor[k]=[];return state.mentor};
const E=s=>esc(s??'');const V=id=>document.getElementById(id)?.value?.trim()||'';
const save=async()=>{await persist();renderMentor()};
const row=(title,meta,body,actions)=>`<div class="ml-entry"><div class="ml-entry-title">${E(title)}</div><div class="ml-entry-meta">${E(meta)}</div>${body?`<p>${E(body)}</p>`:''}<div class="ml-entry-actions">${actions}</div></div>`;
const btn=(label,action,id)=>`<button class="small-action" data-ml-action="${action}" data-ml-id="${E(id)}">${label}</button>`;
const empty='<div class="ml-empty">这里还没有记录，添加第一条吧。</div>';
const levels={new:'还没学懂',learning:'正在理解',practice:'需要练习迁移',mastered:'可以独立完成'};
const date=()=>todayISO();
const find=(kind,id)=>M()[kind].find(x=>x.id===id);
function task(title,body='',due=''){const t={id:uid(),title,body,due,importance:'medium',urgency:'medium',category:'学习',done:false};state.tasks.push(t);return t}
window.renderMentor=function(){const m=M();
$('#ml-inbox-list').innerHTML=m.inbox.length?m.inbox.slice().reverse().map(x=>row(x.text.slice(0,90),x.date,x.text.length>90?x.text.slice(90):'',btn('转为任务','inbox-task',x.id)+btn('删除','inbox-delete',x.id))).join(''):empty;
$('#ml-topic-list').innerHTML=m.topics.length?m.topics.slice().reverse().map(x=>row(`${x.course} · ${x.name}`,`${levels[x.level]||x.level} · ${x.date}`,x.note,btn('更新掌握程度','topic-level',x.id)+btn('明日复习','topic-review',x.id)+btn('删除','topic-delete',x.id))).join(''):empty;
$('#ml-resource-list').innerHTML=m.resources.length?m.resources.slice().reverse().map(x=>row(`${x.course} · ${x.name}`,x.date,``, `<a class="ml-link" href="${E(x.url)}" target="_blank" rel="noopener noreferrer">打开学习资源 ↗</a> `+btn('删除','resource-delete',x.id))).join(''):empty;
const valid=m.grades.filter(x=>Number.isFinite(+x.score)&&Number.isFinite(+x.credit)&&+x.credit>0);const sum=valid.reduce((n,x)=>n+ +x.credit,0);const gpa=valid.reduce((n,x)=>n+ +x.credit*gpoint(+x.score),0);$('#ml-grade-summary').textContent=sum?`已录入 ${valid.length} 门 · ${sum} 学分 · 示例加权绩点 ${(gpa/sum).toFixed(2)} / 4.00`:'还没有成绩数据';
$('#ml-grade-list').innerHTML=m.grades.length?m.grades.map(x=>row(x.name,`${x.credit} 学分 · 当前 ${x.score} 分 · 目标 ${x.target||'未设置'} 分 · 示例绩点 ${gpoint(+x.score).toFixed(1)}`,'',btn('删除','grade-delete',x.id))).join(''):empty;
$('#ml-relay-list').innerHTML=m.relays.length?m.relays.slice().reverse().map(x=>row(x.title,x.date,`进度：${x.context}\n回来后的第一步：${x.next}`,btn('创建继续任务','relay-task',x.id)+btn('删除','relay-delete',x.id))).join(''):empty;
};
function gpoint(n){if(n>=90)return 4;if(n>=85)return 3.7;if(n>=82)return 3.3;if(n>=78)return 3;if(n>=75)return 2.7;if(n>=72)return 2.3;if(n>=68)return 2;if(n>=64)return 1.5;if(n>=60)return 1;return 0}
const notify=s=>toast(s);
function addInbox(asTask){const text=V('ml-capture-text');if(!text)return notify('先写下一句话吧');M().inbox.push({id:uid(),text,date:date()});if(asTask)task(text.slice(0,100),text);$('#ml-capture-text').value='';save();notify(asTask?'已保存并创建任务':'想法已保存')}
$('#ml-capture-save').addEventListener('click',()=>addInbox(false));$('#ml-capture-task').addEventListener('click',()=>addInbox(true));
$('#ml-topic-save').addEventListener('click',()=>{const name=V('ml-topic-name');if(!name)return notify('请填写知识点');M().topics.push({id:uid(),name,course:V('ml-topic-course'),level:V('ml-topic-level'),note:V('ml-topic-note'),date:date()});$('#ml-topic-name').value='';$('#ml-topic-note').value='';save();notify('知识点已记录')});
$('#ml-topic-review').addEventListener('click',()=>{const name=V('ml-topic-name');if(!name)return notify('先填写知识点名称');task('复习：'+V('ml-topic-course')+' · '+name,'先回忆概念，再独立完成2道题。',addDays(date(),1));save();notify('已加入明日复习任务')});
$('#ml-resource-save').addEventListener('click',()=>{const name=V('ml-resource-name'),url=V('ml-resource-url');let parsed;try{parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol))throw Error()}catch{return notify('请填写有效的 http(s) 链接')}if(!name)return notify('请填写资源名称');M().resources.push({id:uid(),name,url:parsed.href,course:V('ml-resource-course'),date:date()});$('#ml-resource-name').value='';$('#ml-resource-url').value='';save();notify('学习资源已保存')});
$('#ml-grade-save').addEventListener('click',()=>{const name=V('ml-grade-name'),credit=+V('ml-grade-credit'),score=+V('ml-grade-score'),target=V('ml-grade-target');if(!name||!V('ml-grade-credit')||!V('ml-grade-score')||!Number.isFinite(credit)||credit<=0||credit>30||!Number.isFinite(score)||score<0||score>100||(target&&(+target<0||+target>100)))return notify('请填写有效的课程、学分和分数');M().grades.push({id:uid(),name,credit,score,target,date:date()});$('#ml-grade-name').value='';$('#ml-grade-credit').value='';$('#ml-grade-score').value='';$('#ml-grade-target').value='';save();notify('成绩已保存')});
$('#ml-relay-save').addEventListener('click',()=>{const title=V('ml-relay-title');if(!title)return notify('请填写当前任务');M().relays.push({id:uid(),title,context:V('ml-relay-context'),next:V('ml-relay-next'),date:date()});save();notify('暂停点已保存')});
$('#ml-relay-task').addEventListener('click',()=>{const title=V('ml-relay-title'),next=V('ml-relay-next');if(!title)return notify('先填写当前任务');task('继续：'+title,next||'打开之前的学习资料，从上次进度开始');save();notify('继续任务已创建')});
document.addEventListener('click',async e=>{const tab=e.target.closest('[data-ml-tab]');if(tab){document.querySelectorAll('.ml-tab').forEach(b=>b.classList.toggle('selected',b===tab));document.querySelectorAll('.ml-pane').forEach(p=>p.classList.toggle('active',p.id==='ml-'+tab.dataset.mlTab));return}const b=e.target.closest('[data-ml-action]');if(!b)return;const [kind,action]=b.dataset.mlAction.split('-'),id=b.dataset.mlId;const map={inbox:'inbox',topic:'topics',resource:'resources',grade:'grades',relay:'relays'},key=map[kind],x=find(key,id);if(!x)return;
if(action==='delete'){if(!confirm('确定删除这条记录？'))return;M()[key]=M()[key].filter(y=>y.id!==id)}else if(kind==='inbox'&&action==='task'){task(x.text.slice(0,100),x.text);notify('任务已创建')}else if(kind==='topic'&&action==='level'){const order=['new','learning','practice','mastered'];x.level=order[(order.indexOf(x.level)+1)%order.length];notify('掌握程度已更新')}else if(kind==='topic'&&action==='review'){task('复习：'+x.course+' · '+x.name,'复习概念，并做两道独立练习。',addDays(date(),1));notify('已安排明日复习')}else if(kind==='relay'&&action==='task'){task('继续：'+x.title,`上次进度：${x.context}\n下一步：${x.next}`);notify('继续任务已创建')}
await save();});
})();
