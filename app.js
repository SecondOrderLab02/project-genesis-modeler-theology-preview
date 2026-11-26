import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const colors=['#c7e48b','#86c6a4','#91c7e8','#e2be77'];
const names=['河谷平原','高地山脉','沿海地区','干旱内陆'];
const actions=['正在迁徙','采集食物','与邻居交换','学习新技能','耕作与储存','探索陌生地带'];
let tick=24,running=true,food=71,knowledge=.62,ties=126,selected=-1;

// Genesis-1 is a fictional, rule-driven world. No external map tiles are needed.
function makeEarthTexture(){
  const c=document.createElement('canvas');c.width=2048;c.height=1024;const x=c.getContext('2d');
  const sea=x.createLinearGradient(0,0,0,1024);sea.addColorStop(0,'#275147');sea.addColorStop(.48,'#1b463d');sea.addColorStop(1,'#102f2a');x.fillStyle=sea;x.fillRect(0,0,2048,1024);
  x.strokeStyle='rgba(185,221,195,.13)';x.lineWidth=1;
  for(let lat=-75;lat<=75;lat+=15){const yy=(90-lat)/180*1024;x.beginPath();x.moveTo(0,yy);x.lineTo(2048,yy);x.stroke()}
  for(let lon=-180;lon<=180;lon+=15){const xx=(lon+180)/360*2048;x.beginPath();x.moveTo(xx,0);x.lineTo(xx,1024);x.stroke()}
  const continents=[[[ -168,70],[-140,68],[-128,55],[-112,53],[-98,50],[-82,25],[-97,15],[-108,25],[-124,32],[-130,48],[-153,58]],[[-80,12],[-67,8],[-52,-3],[-42,-20],[-53,-44],[-68,-55],[-76,-30]],[[-11,72],[20,70],[42,59],[56,48],[39,34],[44,13],[33,-5],[20,-35],[7,-34],[-1,-9],[-14,5],[-17,36],[-6,50]],[[35,69],[68,74],[100,66],[130,56],[158,51],[147,37],[121,25],[109,7],[98,12],[80,7],[68,23],[49,29],[38,45]],[[112,-11],[153,-10],[154,-28],[137,-40],[115,-34]],[[-52,82],[-25,77],[-36,59],[-50,60]],[[-180,-68],[-120,-73],[-50,-72],[30,-71],[100,-73],[180,-68],[180,-90],[-180,-90]]];
  for(const poly of continents){x.beginPath();poly.forEach(([lon,lat],i)=>{const px=(lon+180)/360*2048,py=(90-lat)/180*1024;i?x.lineTo(px,py):x.moveTo(px,py)});x.closePath();x.fillStyle='#72946c';x.fill();x.strokeStyle='#b2c69a';x.lineWidth=3;x.stroke()}
  for(const [lon,lat,col] of [[18,16,'#c7e48b'],[78,42,'#86c6a4'],[-102,26,'#91c7e8'],[132,-20,'#e2be77']]){const px=(lon+180)/360*2048,py=(90-lat)/180*1024;x.beginPath();x.arc(px,py,48,0,Math.PI*2);x.fillStyle=col+'44';x.fill();x.strokeStyle=col+'aa';x.lineWidth=3;x.stroke()}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function ll(lat,lon,r=1){const a=THREE.MathUtils.degToRad(lat),b=THREE.MathUtils.degToRad(lon);return new THREE.Vector3(r*Math.cos(a)*Math.sin(b),r*Math.sin(a),r*Math.cos(a)*Math.cos(b))}
const agents=Array.from({length:84},(_,i)=>{const region=i%4,base=[{lat:17,lon:18},{lat:42,lon:78},{lat:19,lon:-100},{lat:-18,lon:132}][region];return {id:i+1,region,lat:base.lat+Math.sin(i*12.1)*12,lon:base.lon+Math.cos(i*7.31)*19,energy:.28+((i*31)%70)/100,skill:.12+((i*17)%70)/100,action:i%6,age:i%50,phase:i*.77}});

function showAgent(i){selected=i;const a=agents[i];document.getElementById('agent-id').textContent=String(a.id).padStart(2,'0');document.getElementById('agent-action').textContent=actions[a.action];document.getElementById('agent-region').textContent=names[a.region]+' · 在附近寻找食物与同伴';document.getElementById('energy-bar').style.width=Math.round(a.energy*100)+'%';document.getElementById('knowledge-bar').style.width=Math.round(a.skill*100)+'%';document.getElementById('agent-card').classList.add('visible')}

function buildWorld(canvas){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#f5f3ed');
  const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,.12,3.35);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  scene.add(new THREE.AmbientLight(0xb0cbb5,1.6));const key=new THREE.DirectionalLight(0xe5f2d9,3.2);key.position.set(-3,2,4);scene.add(key);const rim=new THREE.PointLight(0x64b99e,15,8);rim.position.set(2,-1,-3);scene.add(rim);
  const root=new THREE.Group();scene.add(root);
  const earth=new THREE.Mesh(new THREE.SphereGeometry(1,112,88),new THREE.MeshStandardMaterial({map:makeEarthTexture(),roughness:.92,metalness:.015}));root.add(earth);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(1.035,72,52),new THREE.MeshBasicMaterial({color:0x5caa8a,transparent:true,opacity:.13,side:THREE.BackSide}));root.add(halo);
  const clouds=new THREE.Group();root.add(clouds);for(let i=0;i<16;i++){const p=ll(-55+(i*31)%110,-165+i*33,1.006);const mesh=new THREE.Mesh(new THREE.SphereGeometry(.008+(i%3)*.003,8,6),new THREE.MeshBasicMaterial({color:0xe4f0df,transparent:true,opacity:.18}));mesh.position.copy(p);clouds.add(mesh)}
  const agentGeo=new THREE.SphereGeometry(.014,10,8),agentMat=new THREE.MeshBasicMaterial({color:0xffffff});const pins=new THREE.InstancedMesh(agentGeo,agentMat,112);pins.count=agents.length;pins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);pins.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(112*3),3);root.add(pins);
  const temp=new THREE.Object3D(),col=new THREE.Color();const regionGroup=new THREE.Group();root.add(regionGroup);const regionCenters=[[17,18],[42,78],[19,-100],[-18,132]];
  regionCenters.forEach((p,i)=>{const marker=new THREE.Mesh(new THREE.SphereGeometry(.026,12,10),new THREE.MeshBasicMaterial({color:colors[i]}));marker.position.copy(ll(p[0],p[1],1.015));regionGroup.add(marker);const ring=new THREE.Mesh(new THREE.TorusGeometry(.057,.0025,6,48),new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.68}));ring.position.copy(ll(p[0],p[1],1.012));ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),ll(p[0],p[1]).normalize());regionGroup.add(ring)});
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=1.28;controls.maxDistance=5.2;controls.autoRotate=true;controls.autoRotateSpeed=.18;controls.enablePan=false;controls.rotateSpeed=.62;
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return}down=null;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObject(pins);if(hits.length&&hits[0].instanceId!==undefined)showAgent(hits[0].instanceId);else{const hit=ray.intersectObject(earth);if(hit.length){const local=earth.worldToLocal(hit[0].point.clone()).normalize();let idx=0,best=-2;agents.forEach((a,i)=>{const score=local.dot(ll(a.lat,a.lon).normalize());if(score>best){best=score;idx=i}});showAgent(idx)}}});
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(canvas);resize();const clock=new THREE.Clock();
  function draw(){requestAnimationFrame(draw);const elapsed=clock.getElapsedTime();if(running){earth.rotation.y+=.00018;clouds.rotation.y+=.0003}agents.forEach((a,i)=>{const lat=a.lat+Math.sin(elapsed*.45+a.phase)*.55,lon=a.lon+Math.cos(elapsed*.31+a.phase)*.75;temp.position.copy(ll(lat,lon,1.019));temp.scale.setScalar(i===selected?1.8:1);temp.updateMatrix();pins.setMatrixAt(i,temp.matrix);col.set(colors[a.region]);pins.setColorAt(i,col)});pins.instanceMatrix.needsUpdate=true;if(pins.instanceColor)pins.instanceColor.needsUpdate=true;controls.update();renderer.render(scene,camera)}draw();
  return controls;
}

function advance(){tick++;food=clamp(food+Math.sin(tick*.37)*2.6-.15,24,98);knowledge=clamp(knowledge+.002+Math.sin(tick*.08)*.001,.1,.99);ties=Math.max(32,Math.round(ties+Math.sin(tick*.2)*2));agents.forEach(a=>{a.action=(a.action+((tick+a.age)%5===0?1:0))%actions.length;a.age++;a.energy=clamp(a.energy+Math.sin(tick*.19+a.age)*.06,.08,.99);a.skill=clamp(a.skill+.0005,.05,.99)});if(tick%73===0&&agents.length<104)agents.push({...agents[tick%agents.length],id:agents.length+1,age:0,phase:tick*.27});if(tick%111===0&&agents.length>55)agents.pop();updateUI()}
function updateUI(){document.getElementById('cycle').textContent=String(tick).padStart(3,'0');document.getElementById('population').textContent=String(agents.length).padStart(3,'0');document.getElementById('food').textContent=Math.round(food)+'%';document.getElementById('knowledge').textContent=knowledge.toFixed(2);document.getElementById('ties').textContent=ties;document.getElementById('toggle-run').innerHTML=running?'<span>Ⅱ</span> 暂停时间':'<span>▶</span> 继续时间'}
function fallback(){document.querySelector('.earth-loading').textContent='3D 地球暂时无法载入，请联网后刷新。'}
try{const controls=buildWorld(document.getElementById('hero-globe'));document.querySelector('.earth-loading').remove();document.getElementById('toggle-run').addEventListener('click',()=>{running=!running;controls.autoRotate=running;updateUI()});document.getElementById('step-run').addEventListener('click',advance);document.getElementById('close-card').addEventListener('click',()=>{document.getElementById('agent-card').classList.remove('visible');selected=-1});setInterval(()=>{if(running)advance()},2100);updateUI()}catch(err){console.error(err);fallback()}

const chapters=[...document.querySelectorAll('.chapter')];const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.getElementById('chapter-number').textContent=entry.target.dataset.chapter;document.getElementById('world-caption').textContent=entry.target.dataset.caption}}},{threshold:.5});chapters.forEach(ch=>observer.observe(ch));
