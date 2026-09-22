(function(root){
'use strict';
const options=['黄眉柳莺','淡眉柳莺','黄腰柳莺','褐柳莺','巨嘴柳莺','极北柳莺','冕柳莺','冠纹柳莺','双斑绿柳莺'];
const regional='https://wildbeijing.org/status-of-the-birds-of-beijing-interactive/';
const speciesPages={yellow:'037900',hume:'037800',pallas:'038100',dusky:'038400',radde:'038300',arctic:'040100'};
const scenes=[
 {id:'e01',title:'柳梢上，声音先到了',area:'北京 · 温榆河林缘',date:'9 月 23 日',time:'07:12',weather:'晴间多云 · 16°C · 微风',habitat:'河边阔叶林，树下有灌丛与窄步道',count:'先只看到一个轮廓，附近另有鸟活动',height:'约 4–7 米',kind:'canopy',answer:'黄眉柳莺',latin:'Phylloscopus inornatus',page:'yellow',photo:'assets/reference/w01.jpg',audio:'assets/reference/e01-audio.mp3',
 opening:'你刚走到桥头，右侧树叶里传来细声。一个小影子从叶片背后穿过，停的位置比视线高。相机里还没有留下完整的鸟。',
 sound:'叫声细而高，带两个相连的音节，后段明显抬高。先记音调走向，不急着把它写成鸟名。',
 form:'短暂视角里能看见浅眉纹与部分浅色翼斑。上体偏绿，但叶片反光很强，腰完全没看清。',
 motion:'它沿着枝叶不断换位置，在叶下和枝端寻找小虫；主要停在树冠下层，没有持续下到地面。',
 target:'canopy',prediction:'它仍在逐枝觅食。把视线留在树冠外缘的一段细枝上，比一直追着晃动的叶子更容易等到完整侧面。',
 detail:'你等到两次短暂停顿：两道翼斑可辨，头顶没有出现醒目的中央浅冠纹；叫声又响了一次，第二段明显上扬。',
 reason:'在这个虚构遭遇里，头翼组合与上扬的双音节叫声共同支持黄眉柳莺。地点和九月只说明它可能经过，不能直接给出答案。',
 contrasts:[['淡眉柳莺','羽色会受光线影响；比较叫声的音节与转折，并复查翼斑，不能只用“偏灰/偏绿”。'],['黄腰柳莺','应继续寻找中央冠纹和淡黄腰斑；本轮补充目击没有支持那组组合。']],
 facts:'阔叶林、灌丛与城市公园可出现；持续在树冠下与灌丛觅食；典型叫声两段相接、后段较高。北京九月为过境期。'},
 {id:'e02',title:'松枝间，一下悬停',area:'北京 · 奥森北园林缘',date:'10 月 22 日',time:'08:06',weather:'晴 · 10°C · 弱风',habitat:'松树与阔叶树相接的一小片林缘',count:'只跟踪眼前这一只，不把背景声都算成它',height:'约 2–5 米',kind:'canopy',answer:'黄腰柳莺',latin:'Phylloscopus proregulus',page:'pallas',photo:'assets/reference/w08.jpg',audio:'assets/reference/e02-audio.mp3',
 opening:'松针簇轻轻晃了一下。一只很小的鸟在枝端停了不到一秒，你只记得头脸似乎有几条明暗纹路。',
 sound:'较短的鼻音，尾端略抬高；不像长段连续的鸣唱。把这段与眉纹、腰部一起核对。',
 form:'松针之间露出浅色眉部和部分头纹；翅与腰还被遮着。头纹只是一个方向，还不能代替腰部观察。',
 motion:'它行动很快，偶尔离开枝条短暂悬停，从叶边取食，又落回附近的小枝。',
 target:'canopy',prediction:'下一次悬停很可能仍在枝端附近。守住树冠外缘的空隙，有机会看见平时被翅膀挡住的腰。',
 detail:'在一次短暂悬停中，腰部出现淡黄斑；落回枝头时，你又看到中央浅冠纹和两道翼斑。',
 reason:'本场景的关键是冠纹、淡黄腰斑、悬停行为和鼻音叫声相互支持。悬停不是它独有的动作，单独使用会误判。',
 contrasts:[['黄眉柳莺','也有眉纹与翼斑，但这次额外目击的中央冠纹和腰斑组合不支持它。'],['云南柳莺（题外）','现实中也要考虑这类近亲；本关是候选内的综合练习，不是完备的野外排除法。']],
 facts:'常快速觅食，较常悬停取食；中央冠纹与淡黄腰斑有辨认价值；叫声有鼻音、尾段上扬。北京晚九月至十一月初有秋季过境。'},
 {id:'e03',title:'水边，像小石子轻碰',area:'北京 · 沙河水库支渠',date:'9 月 19 日',time:'16:38',weather:'多云 · 21°C · 西北微风',habitat:'浅水边的草丛、芦苇与低矮柳灌丛',count:'暂见 1 只，未能数清隐蔽处个体',height:'离地约 0.3–1 米',kind:'low',answer:'褐柳莺',latin:'Phylloscopus fuscatus',page:'dusky',photo:'assets/reference/w04.jpg',audio:'assets/reference/e03-audio.mp3',
 opening:'你站在渠边等了一会儿。低处传来几下短声，草茎之间有褐色影子来回钻动，没有停在显眼的高枝上。',
 sound:'短促、较硬的“嗒”音，像小石子相碰；注意间隔，不要把芦苇摩擦的声音算进去。',
 form:'整体褐色，浅眉纹可见；侧翼没有看清明显斑纹。嘴和腿被草茎切断，暂时不写“粗”或“细”。',
 motion:'它很少停住，在贴近地面的植被间钻行找食。你沿着相同高度追踪，几次都被草叶挡住。',
 target:'low',prediction:'守住低灌丛里的一个空隙，镜头不要跟着背景树梢的动静向上抬。',
 detail:'等它穿过草茎空隙时，嘴较细、腿也较纤细；眉纹在眼前较白而清楚，后方较暗淡。硬短叫声继续从同一位置发出。',
 reason:'湿地低植被与钻行只缩小范围；细嘴、细腿、眉纹前后对比和硬短叫声才共同支持本关的褐柳莺。',
 contrasts:[['巨嘴柳莺','通常更结实，嘴与腿较粗；眉纹前后对比及较软的鼻音也值得比较。'],['棕眉柳莺（题外）','北京也有记录；真实野外不要以“没有在候选选项里”将其排除。']],
 facts:'偏好湿处附近的植被；常在低灌丛中活动、隐蔽而不停移动；叫声硬而短。北京春秋过境。'},
 {id:'e04',title:'同样是褐色，却换了位置',area:'北京 · 温榆河灌丛带',date:'9 月 24 日',time:'09:24',weather:'阴转晴 · 18°C · 微风',habitat:'林缘灌丛与稍干的草坡，不在开阔水面',count:'单独追踪 1 只',height:'离地约 0.5–2 米',kind:'low',answer:'巨嘴柳莺',latin:'Phylloscopus schwarzi',page:'radde',photo:'assets/reference/w05.jpg',audio:'assets/reference/e04-audio.mp3',
 opening:'这只小鸟比你刚才遇到的更难跟。灌丛动了一阵，它忽然横穿到另一丛，只留下了正面的一瞥。',
 sound:'有些鼻音的短“切/怯”声，比较柔和；和硬而脆的“嗒”音区别，比单纯记拟声字更有用。',
 form:'偏浅的胸腹、醒目的眉部可以看见；正面角度使嘴的实际长度难以判断，侧翼和腰没有完整展示。',
 motion:'它在一丛植被里停留一阵后，突然飞到数米外另一丛；不要把飞过去的那一下误认为一直在高处觅食。',
 target:'low',prediction:'注意下一丛低灌木的边缘。它可能换一块觅食位置，不一定马上回到原来的枝条。',
 detail:'新位置的侧面视角显示嘴较粗壮、腿较有力；眉纹前方偏暖色，眼后较白，下体后部偏暖。短鼻音仍从这只鸟附近传来。',
 reason:'本关由嘴腿比例、眉纹前后色调与叫声互相印证。较大范围的移动是辅助线索，不是物种专属行为。',
 contrasts:[['褐柳莺','通常显得纤细，硬短叫声与本关的柔和鼻音不同；需连同眉纹和嘴腿比较。'],['棕眉柳莺（题外）','也是现实需要比较的对象；不能把“褐色、低处”当成唯一答案。']],
 facts:'开阔林地与灌丛可出现；可能在较大范围换位觅食；较粗的嘴腿、眉纹前暖后白与鼻音叫声有帮助。北京秋季过境。'},
 {id:'e05',title:'树冠里，短短的一声',area:'北京 · 奥森阔叶林',date:'5 月 19 日',time:'06:52',weather:'多云 · 19°C · 微风',habitat:'阔叶树冠相接，树下有较密的灌丛',count:'暂见 1 只；其余声音不计入数量',height:'约 4–8 米',kind:'canopy',answer:'极北柳莺',latin:'Phylloscopus borealis',page:'arctic',photo:'assets/reference/w06.jpg',audio:'assets/reference/e05-audio.mp3',
 opening:'林冠里有一只鸟缓慢挪动。你先记到一声带沙哑质感的短叫，再看到浅眉纹划过枝条间隙。',
 sound:'参考录音包含短音与较长的颤鸣。注意短音粗糙、略带蜂鸣感的质地，不把长鸣唱当作单次叫声来比较。',
 form:'上体偏绿、浅眉纹，下体较淡。枝条挡住了翅尖，暂时无法可靠比较飞羽伸出的长度。',
 motion:'它沿树冠枝叶较慢地搜寻，时而探向叶背取食，没有像另一类小柳莺那样频繁地短悬停。',
 target:'canopy',prediction:'把视线移到树冠外缘的横枝上，等待它沿枝慢慢走到较少遮挡的位置。',
 detail:'侧面停顿时，初级飞羽向外突出较长；眉纹长而明显。你又记录到同样短而带沙哑感的叫声。',
 reason:'这组模拟线索在本关候选中支持极北柳莺。现实定种还要排除复合群的近亲；这段参考录音不表示所有种群都发出完全相同的声音。',
 contrasts:[['黄眉柳莺','要综合体形、翼形与声调比较，不能只看到浅眉纹就归到同一类。'],['堪察加/日本柳莺（题外）','真实识别需要更细的声音与形态核对；本关没有穷尽复合群的全部候选。']],
 facts:'在有遮蔽的林木或灌丛停留；常在树冠较慢觅食；短而带蜂鸣感的叫声可辅助鉴别。北京五月为春季过境时段。'},
 {id:'e06',title:'南方山林里的另一种声音',area:'印度 · 班加罗尔附近山林',date:'1 月 16 日',time:'08:18',weather:'晴 · 17°C · 林间弱风',habitat:'冬季山林步道旁的树木与灌丛',count:'正在跟踪 1 只，林中还有背景鸟声',height:'约 2–5 米',kind:'canopy',answer:'淡眉柳莺',latin:'Phylloscopus humei',page:'hume',photo:'assets/reference/w09.jpg',audio:'assets/reference/e06-audio.mp3',
 opening:'旅途中，你又遇到一只“很像黄眉”的小鸟。这次它背朝你，绿灰色的背部几乎融进枝叶，声音却与记忆里有些不同。',
 sound:'略低、较拖长的近双音节叫声。录音取自印度种群，不把它当成北京 mandellii 种群的标准叫声。',
 form:'偏灰绿的背部、部分浅色翼斑可见；光线不足以让你单靠颜色排除黄眉。',
 motion:'它在枝间取食与换位，转头后又背朝观察者；这些动作本身对区分黄眉、淡眉帮助很小。',
 target:'canopy',prediction:'守住树冠外缘的一段枝条，等它转成侧面，同时再次记录叫声，不靠背部颜色直接下结论。',
 detail:'在这个场景的补充目击中，嘴腿偏暗，上方翼斑较弱，整体羽缘对比不强；再次听到的叫声也比黄眉常见的上扬双音更低而拖长。',
 reason:'这次是印度冬季的虚构遭遇：声音与多项形态共同支持淡眉柳莺。亚种会带来声音差异，所以没有把印度录音硬套进北京故事。',
 contrasts:[['黄眉柳莺','灰绿照片不足以排除它；比较清楚的翼斑、嘴腿和典型上扬双音节叫声。'],['mandellii 种群','常被叫作淡眉，但叫声与指名种群不同。地理范围在这里约束的是参考声音的适用性。']],
 facts:'淡眉与黄眉外形接近；指名种群和 mandellii 声音存在差异；应结合嘴腿、翼斑与声音。本关地点为配合印度参考录音而编写。'}
];
for(const c of scenes){c.family='leaf';c.options=options;c.sources=[{title:'香港观鸟会 · 形态、声音、行为与生境',url:'https://avifauna.hkbws.org.hk/species/0320/'+speciesPages[c.page]},...(c.id==='e06'?[]:[{title:'Wild Beijing · 北京出现季节',url:regional}])];c.mustHave=['sound','detail'];}
scenes.push(...(typeof module==='object'&&module.exports?require('./encounter-expansion.js'):root.AvianEncounterExpansion));
const bank=typeof module==='object'&&module.exports?require('./encounter-bank.js'):root.AvianEncounterBank;
scenes.push(...bank.scenes);
for(const c of scenes)c.track=c.track||(c.family==='leaf'?'leaf':'mixed');
const tracks={
 leaf:{label:'柳莺专练',short:'柳莺 9 种',description:'9 种柳莺 · 先听叫声，再核对冠纹、翼斑与动作。部分遭遇没有照片。'},
 mixed:{label:'混合进阶',short:'混合 20 种',description:'20 种柳莺、蝗莺、树莺与鹨 · 先判断活动层次，再细分；有些遭遇只能保留两个候选。'},
 ...bank.trackMeta
};
function pool(track){return track==='mixed'?scenes.filter(c=>c.track==='leaf'||c.track==='mixed'):scenes.filter(c=>c.track===track);}
function choices(track){return pool(track).map(c=>c.answer);}
for(const c of scenes)c.options=choices(c.track);
const families={leaf:'柳莺',grass:'蝗莺',bush:'树莺',pipit:'鹨'};
const labels={context:'地点与生境',sound:'声音',motion:'活动方式',form:'短暂目击',detail:'补充观察'};
function begin(){return {seen:['context'],selected:[],hypotheses:[],predictions:[],submitted:false};}
function addEvidence(state,key){if(!Object.hasOwn(labels,key))return false;if(state.seen.includes(key))return false;state.seen.push(key);return true;}
function saveHypothesis(state,candidates,confidence){const entry={candidates:[...candidates],confidence,seen:[...state.seen],step:state.hypotheses.length+1};state.hypotheses.push(entry);return entry;}
function assess(c,state,candidates,confidence){
 const choices=[...new Set(candidates.filter(x=>c.options.includes(x)))];const missing=c.mustHave.filter(k=>!state.seen.includes(k));
 const required=c.resolutionCandidates||[c.answer];const exact=choices.length===required.length&&required.every(x=>choices.includes(x));const included=required.some(x=>choices.includes(x));
 return {candidates:choices,answer:choices.join(' / ')||'暂不定种',confidence,missing,correct:exact&&!missing.length,verdict:!choices.length?'open':missing.length?'incomplete':exact?'supported':included&&c.resolutionCandidates?'limited':included?'narrowed':'reconsider',overconfident:confidence==='high'&&(!exact||missing.length>0||!!c.resolutionCandidates)};
}
const api={scenes,labels,begin,addEvidence,saveHypothesis,assess,pool,choices,families,tracks,version:6};
if(typeof module==='object'&&module.exports)module.exports=api;else root.AvianEncounters=api;
})(globalThis);
