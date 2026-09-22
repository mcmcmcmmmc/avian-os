(function(root){
'use strict';
const D=typeof module==='object'&&module.exports?require('./challenge-data.js'):root.AvianChallenges;
const names=['黄眉柳莺','淡眉柳莺','黄腰柳莺','褐柳莺','巨嘴柳莺','极北柳莺'];
const latin=['Phylloscopus inornatus','Phylloscopus humei','Phylloscopus proregulus','Phylloscopus fuscatus','Phylloscopus schwarzi','Phylloscopus borealis'];
const comparisons=[
 ['黄眉柳莺','与淡眉柳莺很接近。眉纹、翼斑、羽色需要组合判断；单张照片的曝光、磨损会改变观感，叫声常能提供重要补充。'],
 ['淡眉柳莺','通常较灰淡，上方翼斑较弱；不能把“照片看起来灰”当作定种证据，也不能把没拍到的翼斑当作不存在。'],
 ['黄腰柳莺','寻找中央冠纹与淡黄腰斑的组合。腰被翅膀挡住时，“没看见黄腰”不能排除它；题外还存在其他相似柳莺。'],
 ['褐柳莺','常呈褐色、眉纹明显，通常没有醒目的翼斑。与巨嘴柳莺比较时，应看嘴、腿、眉纹及体形的组合。'],
 ['巨嘴柳莺','通常嘴较粗壮、腿较有力，眉纹及下体色调也有帮助；斜角会改变比例，不能只凭“粗嘴”单项判断。'],
 ['极北柳莺','注意较长的初级飞羽突出、眉纹与翼斑。极北柳莺复合群涉及堪察加柳莺、日本柳莺等；本练习的六候选不覆盖所有相似种。']
];
// These are photo-reading exercises, not independently verified local sightings.
// Source species is disclosed only in the review, and never used as a claim that
// the displayed photograph alone permits that level of identification.
const photos={w01:'assets/reference/w01.jpg',w02:'assets/reference/w02.jpg',w03:'assets/reference/w03.jpg',w04:'assets/reference/w04.jpg',w05:'assets/reference/w05.jpg',w06:'assets/reference/w06.jpg',w07:'assets/reference/w07.jpg',w08:'assets/reference/w08.jpg',w09:'assets/reference/w09.jpg'};
const rows=[
 ['w01',0,'叶缝里的一眼','遮挡 · 翼与腰不完整','鸟停在枝叶之间，头脸露出，身体轮廓被横枝与叶片分割。','能见到浅色眉纹和一部分翼羽；身体被枝叶分割，腰和腿缺少完整视角，翼斑也不连续。','黄眉、淡眉和黄腰等小型柳莺都值得检查。先记录哪些结构看不到，别把绿色背景反光当作羽色。','想办法得到完整侧翼与腰的视角；若能听到叫声，记录原声而非用“啾啾”替代。'],
 ['w02',1,'迎面停在细枝上','正面 · 翼斑被角度隐藏','小鸟朝向观察者，侧翼大部分被身体挡住。','眉纹可见，下体偏浅；这个角度不便比较两道翼斑与初级飞羽长度。','这张正面照的信息量明显低于标准侧面照。黄眉与淡眉的色调会受光线影响，不能只按灰绿程度选答案。','优先等它转为侧面，或听清一次完整叫声。'],
 ['w03',2,'枝条之后','远距 · 细枝穿过轮廓','鸟很小，躲在密集枝条间。放大也不能恢复没有记录到的细节。','能找到浅色眉部与明暗相间的头部；腰部和翼斑的连续轮廓受枝条影响。','原档案有物种标签，但标签不是画面里的证据。头纹可以提出假设，腰部未确认前应保留其他可能。','下一次最有价值的是无阻挡的头顶与腰，而不是把同一张照片继续放大。'],
 ['w04',3,'低处的褐色小鸟','局部遮挡 · 缺比例参照','鸟停在较低的细茎上，身旁枝叶遮住了部分轮廓。','整体偏褐，浅色眉纹能看到；嘴、腿的比例缺少同角度参照，翼上没有看清明显斑纹。','“褐色、眉纹、低处活动”不能独自区分褐柳莺和巨嘴柳莺。没有看清翼斑也不等于确认无翼斑。','补一张侧头、嘴基与腿清楚的画面，连同录音一起比较。'],
 ['w05',4,'只有胸前这一面','仰视 · 背与侧翼缺失','鸟停在斜枝上，观察角度偏正面，背与腰隐藏在另一侧。','能看见头脸、胸腹和尾部的一部分；嘴的侧面长度、完整翼斑和腰不可确认。','正面视角很容易把体形比例看错。即使原档案标为巨嘴柳莺，也应说明这张照片中缺少哪些复核依据。','先获得同一只鸟的侧面，注意眉纹前后色调、嘴基、腿部与整体体形。'],
 ['w06',5,'杂枝中的侧影','环境照 · 复合群边界','绿叶与红褐色枝条之间有一只小鸟，头和侧面只露出一部分。','浅眉纹、偏浅的下体可见；翅尖和尾基附近有遮挡，飞羽突出长度很难可靠估计。','档案标作极北柳莺。这个类群的近亲并不全在六候选中，排除另外五项也不等于完成真实世界的定种。','需要清楚侧翼和可靠叫声，并把日本柳莺、堪察加柳莺等题外候选纳入复核。'],
 ['w07',0,'光从身后过来','逆光 · 颜色不可靠','小鸟停在覆苔的枝上，亮背景使头部与上体的细节显得发灰。','侧翼有浅色条纹，眉纹在暗部较难看清；照片没有提供可靠的腰部视角。','这是同一物种在另一种光线中的样子。灰淡不直接等于淡眉柳莺，鲜绿也不直接等于黄眉柳莺。','组合比较翼斑与头纹；用录音补充，避免只凭整张照片的冷暖。'],
 ['w08',2,'松针间的头纹','局部可辨 · 腰仍被挡','头部从松针之间露出，身体侧面受到前景遮挡。','头部明暗条纹相对明显，可看见浅色眉部；腰没有形成可确认的完整色块。','头纹比上一张枝条照更有信息，可以提高对黄腰柳莺的倾向；但冠纹不是它独有，六候选之外还有相似种。','下一眼找中央冠纹与腰斑的组合，必要时核对声音与其他相似种。'],
 ['w09',1,'背朝你时','背面 · 头侧信息有限','鸟背朝观察者，头略向一侧转，侧脸与胸腹都没有完整展示。','背部与部分翼羽可见，头侧和嘴的轮廓不完整；光线使上体颜色不宜直接与图鉴对比。','背面照可以补充翼部，但单靠灰绿色调仍难可靠分开黄眉与淡眉。注意保留前后几次观察，不要每换一个角度就把假设全部推翻。','获得头侧与双翼斑清晰度的对照，最好有同一只鸟的叫声。']
];
const cases=rows.map(([id,n,title,tag,opening,form,takeaway,nextLook])=>({id,advanced:true,title,tag,area:'北京候选训练（照片来自其他地区）',season:'拍摄季节不作题目线索',time:'时间未记录',weather:'不据照片推定天气',count:'画面中可见 1 只；不推断实际群体数',habitat:'仅以照片中可见的植被、枝条为依据',opening,form,behavior:'这次只有单张照片，没有同一只鸟的动作序列；静止姿态不能证明它一直在某个高度活动。',voice:'没有这只鸟的录音；未录到不等于没有叫。',answer:names[n],latin:latin[n],options:names,key:['form'],image:photos[id],audio:null,art:'unknown',takeaway,nextLook,comparisons,source:'https://wildbeijing.org/status-of-the-birds-of-beijing-interactive/',sourceTitle:'Wild Beijing · 北京鸟种状态（候选背景；非照片地点）'}));
const original=D.evaluate;
function evaluate(c,input={}){
 if(!c.advanced)return original(c,input);
 const candidates=[...new Set((input.candidates||[]).filter(n=>names.includes(n)))];
 const uncertain=!candidates.length,referenceIncluded=candidates.includes(c.answer);
 return {answer:uncertain?'暂不定种':candidates.join(' / '),candidates,confidence:input.confidence||'medium',referenceIncluded,uncertain,correct:null,advanced:true,calibrated:null,overconfident:false,confidenceReview:!uncertain&&input.confidence==='high',supported:(input.evidence||[]).includes('form'),relevant:(input.evidence||[]).filter(k=>k==='form')};
}
if(typeof module==='object'&&module.exports)module.exports={cases,evaluate,names};
else {D.cases.unshift(...cases);D.evaluate=evaluate;D.version=3;}
})(globalThis);
