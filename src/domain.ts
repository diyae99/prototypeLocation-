export type Car = { id:string; brand:string; model:string; plate:string; year:number; photo:string; km:number; fuel:string; gearbox:string; rate:number; status:'disponible'|'louée'|'maintenance'; insurance:string; inspection:string; oilDate:string; oilKm:number; maintenance:{date:string; label:string; km:number; amount:number}[] };
export type Client = { id:string; type:'particulier'|'entreprise'; first:string; last:string; phone:string; email:string; address:string; identity:string; license:string; licenseExpiry:string; company:string; ice:string; contact:string };
export type Booking = {id:string; clientId:string; carId:string; start:string; end:string; rate:number; status:'confirmée'|'annulée'|'convertie en contrat'};
export type Payment = {id:string; date:string; amount:number; mode:string; reference:string};
export type Inspection = {date:string; km:number; fuel:string; notes:string; photos:string[]};
export type Contract = {id:string; number:string; bookingId?:string; clientId:string; carId:string; start:string; end:string; rate:number; discount:number; tax:number; driver:string; notes:string; conditions:string; status:'préparé'|'en cours'|'clôturé'|'annulé'; payments:Payment[]; depositExpected:number; depositReceived:number; depositReturned:number; depositLog:{date:string; kind:string; amount:number}[]; fees:{label:string; amount:number}[]; departure?:Inspection; arrival?:Inspection};
export type Agency = {name:string; logo:string; address:string; phone:string; email:string; ice:string; conditions:string; taxEnabled:boolean; taxRate:number};
export type Invoice = {id:string; number:string; contractId:string; date:string; agency:Agency; client:Client; car:Car; contract:Contract};
export type Data = {version:1; cars:Car[]; clients:Client[]; bookings:Booking[]; contracts:Contract[]; invoices:Invoice[]; agency:Agency; counters:{contract:number;invoice:number}};
export const uid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const relative=(days:number,hour=10)=>{const d=new Date();d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);return `${localDate(d)}T${String(hour).padStart(2,'0')}:00`};
export const money=(v:number)=>new Intl.NumberFormat('fr-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(v);
export const date=(v:string, time=false)=>v?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric',...(time?{hour:'2-digit',minute:'2-digit'} as const:{})}).format(new Date(v)):'—';
export const days=(start:string,end:string)=>Math.max(1,Math.ceil((new Date(end).getTime()-new Date(start).getTime())/86400000));
export const clientName=(c:Client|undefined)=>c?(c.type==='entreprise'?c.company:`${c.first} ${c.last}`):'Client supprimé';
export const carName=(c:Car|undefined)=>c?`${c.brand} ${c.model}`:'Voiture supprimée';
export const subtotal=(c:Contract)=>Math.max(0,days(c.start,c.end)*c.rate-c.discount)+c.fees.reduce((s,f)=>s+f.amount,0);
export const total=(c:Contract)=>Math.round(subtotal(c)*(1+c.tax/100)*100)/100;
export const paid=(c:Contract)=>Math.round(c.payments.reduce((s,p)=>s+p.amount,0)*100)/100;
export const balance=(c:Contract)=>Math.round((total(c)-paid(c))*100)/100;
export function availability(d:Data,carId:string,start:string,end:string,exclude?:string):string {
 if(!start||!end||!Number.isFinite(new Date(start).getTime())||!Number.isFinite(new Date(end).getTime())||end<=start)return 'Le retour doit être après le départ.';
 const car=d.cars.find(c=>c.id===carId);if(!car)return 'Choisissez une voiture.';
 if(car.status==='maintenance')return 'Cette voiture est en maintenance.';
 const overlap=(x:{start:string;end:string})=>start<x.end&&end>x.start;
 if(d.bookings.some(b=>b.id!==exclude&&b.carId===carId&&b.status==='confirmée'&&overlap(b)))return 'Cette voiture a déjà une réservation sur ces dates.';
 if(d.contracts.some(c=>c.id!==exclude&&c.carId===carId&&(c.status==='préparé'||c.status==='en cours')&&(overlap(c)||(c.status==='en cours'&&new Date(c.end).getTime()<Date.now()&&end>c.start))))return 'Cette voiture est déjà affectée à un contrat (ou son retour est en retard).';
 return '';
}
export function paymentError(c:Contract,amount:number){return !Number.isFinite(amount)||amount<=0?'Le montant doit être supérieur à zéro.':amount>balance(c)?'Le paiement ne peut pas dépasser le solde restant.':'';}
export function returnError(c:Contract,km:number,actual:string){return km<(c.departure?.km??0)?'Le kilométrage de retour ne peut pas être inférieur au départ.':actual<(c.departure?.date??c.start)?'Le retour réel doit être après le départ.':'';}
export const statusOf=(d:Data,c:Car)=>c.status==='maintenance'?'maintenance':d.contracts.some(x=>x.carId===c.id&&x.status==='en cours')?'louée':'disponible';
export function seed():Data {
 const models=[['Dacia','Duster',450],['Renault','Clio',300],['Hyundai','Tucson',650],['Peugeot','208',320],['Dacia','Logan',250],['Volkswagen','Golf',500],['Kia','Sportage',600],['Toyota','Yaris',350]] as const;
 const cars:Car[]=models.map((m,i)=>({id:`car${i}`,brand:m[0],model:m[1],plate:`${23541+i*173} · أ · ${i%2?6:1}`,year:2023+i%3,photo:'',km:18000+i*5700,fuel:i%3?'Diesel':'Essence',gearbox:i%2?'Manuelle':'Automatique',rate:m[2],status:i===6?'maintenance':'disponible',insurance:relative(i===2?12:180).slice(0,10),inspection:relative(150).slice(0,10),oilDate:relative(i===4?-2:90).slice(0,10),oilKm:22000+i*5700,maintenance:i===6?[{date:localDate(),label:'Révision générale et remplacement des pneus',km:52200,amount:1800}]:[]}));
 const names=[['Youssef','Bennani'],['Salma','El Amrani'],['Mehdi','Alaoui'],['Lina','Idrissi'],['Amine','Berrada'],['Sara','Tazi'],['Omar','Benjelloun'],['Nadia','Chraïbi'],['Karim','Mansouri'],['Hind','Fassi']];
 const clients:Client[]=names.map((n,i)=>({id:`client${i}`,type:i>7?'entreprise':'particulier',first:n[0],last:n[1],phone:`06 61 24 80 ${10+i}`,email:`contact${i+1}@exemple.ma`,address:i%2?'Guéliz, Marrakech':'Agdal, Rabat',identity:`DE${345600+i}`,license:`${123400+i}/24`,licenseExpiry:relative(800).slice(0,10),company:i===8?'Riad Horizon':'Atlas Événements',ice:i>7?`0012345670000${i}9`:'',contact:i>7?`${n[0]} ${n[1]}`:''}));
 const agency:Agency={name:'Atlas Location',logo:'',address:'24, avenue Mohammed V, Marrakech',phone:'05 24 44 18 20',email:'bonjour@atlas-location.exemple',ice:'',conditions:'Documents de démonstration. Le conducteur doit présenter un permis valide. Le véhicule est restitué au niveau de carburant du départ. Tout frais supplémentaire doit être expliqué et accepté. Ces conditions sont fictives et doivent être adaptées par l’agence.',taxEnabled:false,taxRate:0};
 const contracts:Contract[]=[{car:0,client:0,start:-2,end:0,status:'en cours'},{car:2,client:8,start:-3,end:2,status:'en cours'},{car:1,client:1,start:0,end:3,status:'préparé'},{car:3,client:2,start:-8,end:-5,status:'clôturé'},{car:5,client:3,start:-4,end:-1,status:'en cours'}].map((x,i)=>{
 const c:Contract={id:`contract${i}`,number:`CTR-${new Date().getFullYear()}-${String(i+1).padStart(4,'0')}`,clientId:`client${x.client}`,carId:`car${x.car}`,start:relative(x.start,9),end:relative(x.end,18),rate:cars[x.car].rate,discount:0,tax:0,driver:`${clients[x.client].first} ${clients[x.client].last}`,notes:'',conditions:agency.conditions,status:x.status as Contract['status'],payments:[],depositExpected:3000,depositReceived:x.status==='préparé'?0:3000,depositReturned:x.status==='clôturé'?3000:0,depositLog:[],fees:[]};
 if(x.status!=='préparé')c.departure={date:c.start,km:cars[x.car].km-300,fuel:'Plein',notes:'Bon état général',photos:[]};
 if(x.status==='clôturé')c.arrival={date:c.end,km:cars[x.car].km,fuel:'Plein',notes:'RAS',photos:[]};
 c.payments=[{id:uid(),date:localDate(new Date(c.start)),amount:i===3?total(c):i===1?1500:500,mode:'Espèces',reference:'Démo'}];return c;
 });
 const bookings:Booking[]=[{car:4,client:4,start:0,end:2},{car:0,client:5,start:3,end:6},{car:7,client:9,start:1,end:4},{car:3,client:6,start:4,end:7}].map((x,i)=>({id:`booking${i}`,carId:`car${x.car}`,clientId:`client${x.client}`,start:relative(x.start,14),end:relative(x.end,14),rate:cars[x.car].rate,status:'confirmée'}));
 const invoices:Invoice[]=[contracts[3],contracts[1]].map((c,i)=>({id:`invoice${i}`,number:`FAC-${new Date().getFullYear()}-${String(i+1).padStart(4,'0')}`,contractId:c.id,date:localDate(),agency:{...agency},client:{...clients.find(x=>x.id===c.clientId)!},car:{...cars.find(x=>x.id===c.carId)!},contract:structuredClone(c)}));
 return {version:1,cars,clients,bookings,contracts,invoices,agency,counters:{contract:5,invoice:2}};
}
export const STORAGE_KEY='atlas-location-mvp-v1';
export function load():Data {const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return seed();const d=JSON.parse(raw);if(d.version!==1||!Array.isArray(d.cars)||!Array.isArray(d.contracts))throw new Error('Données locales non reconnues.');return d;}
