import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,days,total,paid,balance,availability,paymentError,returnError,relative,statusOf} from './domain';
import type {Booking,Contract,Data} from './domain';
import {getPlanningMovements,shiftPlanningDate} from './planning';
test('tarification par tranche commencée de 24 h',()=>{assert.equal(days('2026-10-01T10:00','2026-10-01T10:01'),1);assert.equal(days('2026-10-01T10:00','2026-10-02T10:00'),1);assert.equal(days('2026-10-01T10:00','2026-10-02T10:01'),2)});
test('conflits, limites adjacentes, annulation et maintenance',()=>{const d=seed();d.contracts=[];d.bookings=[{id:'b',carId:'car0',clientId:'client0',start:relative(10),end:relative(12),rate:450,status:'confirmée'}];assert.match(availability(d,'car0',relative(11),relative(13)),/réservation/);assert.equal(availability(d,'car0',relative(12),relative(13)),'');assert.equal(availability(d,'car0',relative(10),relative(12),'b'),'');d.bookings[0].status='annulée';assert.equal(availability(d,'car0',relative(10),relative(12)),'');assert.match(availability(d,'car6',relative(10),relative(12)),/maintenance/);assert.match(availability(d,'car1',relative(12),relative(10)),/après/)});
test('contrats préparés bloquants et contrats clôturés libérés',()=>{const d=seed();const c=d.contracts.find(c=>c.status==='préparé')!;assert.match(availability(d,c.carId,c.start,c.end),/contrat/);assert.equal(availability(d,c.carId,c.start,c.end,c.id),'');c.status='clôturé';assert.equal(availability(d,c.carId,c.start,c.end),'')});
test('prix, remise, frais, taxe explicite, cautions indépendantes',()=>{const c=seed().contracts[0];c.start='2026-10-01T10:00';c.end='2026-10-03T10:01';c.rate=300;c.discount=100;c.fees=[{label:'Carburant',amount:50}];c.tax=0;c.payments=[{id:'p',amount:200,date:'2026-10-01',mode:'Carte',reference:''}];assert.equal(total(c),850);assert.equal(balance(c),650);c.depositReceived=5000;c.depositReturned=2000;assert.equal(paid(c),200);assert.equal(balance(c),650);c.tax=10;assert.equal(total(c),935)});
test('paiements positifs plafonnés au solde',()=>{const c=seed().contracts[0];assert.ok(paymentError(c,-1));assert.ok(paymentError(c,0));assert.ok(paymentError(c,NaN));assert.ok(paymentError(c,balance(c)+.01));assert.equal(paymentError(c,balance(c)),'')});
test('retour contrôlé et statut réel dérivé',()=>{const d=seed();const c=d.contracts[0];assert.ok(returnError(c,c.departure!.km-1,c.end));assert.ok(returnError(c,c.departure!.km,relative(-10)));assert.equal(returnError(c,c.departure!.km,c.end),'');assert.equal(statusOf(d,d.cars[0]),'louée');c.status='clôturé';assert.equal(statusOf(d,d.cars[0]),'disponible')});
test('factures séparées, instantané financier et paiements uniques',()=>{const d=seed();const i=d.invoices[0];const c=d.contracts.find(c=>c.id===i.contractId)!;const before=total(i.contract);c.rate+=100;assert.equal(total(i.contract),before);assert.notEqual(i.id,c.id);assert.equal(d.clients.length,10);assert.equal(d.cars.length,8);assert.equal(d.clients.filter(c=>c.type==='entreprise').length,2)});

function planningData():Data {
  return {...seed(),bookings:[],contracts:[]};
}

function planningBooking(overrides:Partial<Booking> = {}):Booking {
  return {id:'booking-a',carId:'car0',clientId:'client0',start:'2026-10-04T09:00',end:'2026-10-07T18:00',rate:450,status:'confirmée',...overrides};
}

function planningContract(overrides:Partial<Contract> = {}):Contract {
  return {
    id:'contract-a',number:'CTR-2026-0001',carId:'car0',clientId:'client0',
    start:'2026-10-04T09:00',end:'2026-10-07T18:00',rate:450,discount:0,tax:0,
    driver:'',notes:'',conditions:'',status:'préparé',payments:[],fees:[],
    depositExpected:0,depositReceived:0,depositReturned:0,depositLog:[],...overrides,
  };
}

test('planning : départs et retours des réservations confirmées aux dates prévues',()=>{
  const data=planningData();
  data.bookings=[planningBooking(),planningBooking({id:'cancelled',status:'annulée'}),planningBooking({id:'converted',status:'convertie en contrat'})];
  assert.deepEqual(getPlanningMovements(data,'2026-10-04'),{
    departures:[{id:'booking-a',kind:'booking',carId:'car0',clientId:'client0',scheduledAt:'2026-10-04T09:00'}],returns:[],
  });
  assert.deepEqual(getPlanningMovements(data,'2026-10-07'),{
    departures:[],returns:[{id:'booking-a',kind:'booking',carId:'car0',clientId:'client0',scheduledAt:'2026-10-07T18:00'}],
  });
  assert.deepEqual(getPlanningMovements(data,'2026-10-05'),{departures:[],returns:[]});
});

test('planning : contrat préparé et retour futur avant le départ',()=>{
  const data=planningData();
  data.contracts=[planningContract()];
  assert.deepEqual(getPlanningMovements(data,'2026-10-04').departures,[
    {id:'contract-a',kind:'contract',carId:'car0',clientId:'client0',scheduledAt:'2026-10-04T09:00'},
  ]);
  assert.deepEqual(getPlanningMovements(data,'2026-10-07').returns,[
    {id:'contract-a',kind:'contract',carId:'car0',clientId:'client0',scheduledAt:'2026-10-07T18:00'},
  ]);
});

test('planning : les statuts et états des lieux excluent les mouvements terminés',()=>{
  const data=planningData();
  const inspection={date:'2026-10-04T11:00',km:18000,fuel:'Plein',notes:'',photos:[]};
  data.contracts=[
    planningContract({id:'prepared',end:'2026-10-04T18:00'}),
    planningContract({id:'departed',end:'2026-10-04T18:00',departure:inspection}),
    planningContract({id:'ongoing',end:'2026-10-04T18:00',status:'en cours',departure:inspection}),
    planningContract({id:'ongoing-no-inspection',end:'2026-10-04T18:00',status:'en cours'}),
    planningContract({id:'returned',end:'2026-10-04T18:00',status:'en cours',departure:inspection,arrival:inspection}),
    planningContract({id:'prepared-returned',end:'2026-10-04T18:00',arrival:inspection}),
    planningContract({id:'closed',end:'2026-10-04T18:00',status:'clôturé'}),
    planningContract({id:'cancelled',end:'2026-10-04T18:00',status:'annulé'}),
  ];
  const movements=getPlanningMovements(data,'2026-10-04');
  assert.deepEqual(movements.departures.map(m=>m.id),['prepared']);
  assert.deepEqual(movements.returns.map(m=>m.id),['departed','ongoing','ongoing-no-inspection','prepared']);
});

test('planning : conversion, départ et retour actualisent les mouvements sans doublon',()=>{
  const data=planningData();
  const booking=planningBooking({end:'2026-10-04T18:00'});
  data.bookings=[booking];
  assert.deepEqual(getPlanningMovements(data,'2026-10-04').departures.map(m=>m.kind),['booking']);
  const contract=planningContract({bookingId:booking.id,end:booking.end});
  data.contracts.push(contract);
  // Même une réservation restée confirmée ne doit pas doubler son contrat.
  assert.deepEqual(getPlanningMovements(data,'2026-10-04').departures.map(m=>m.kind),['contract']);
  assert.deepEqual(getPlanningMovements(data,'2026-10-04').returns.map(m=>m.kind),['contract']);
  booking.status='convertie en contrat';
  contract.departure={date:'2026-10-04T09:15',km:18000,fuel:'Plein',notes:'',photos:[]};
  contract.status='en cours';
  assert.deepEqual(getPlanningMovements(data,'2026-10-04').departures,[]);
  assert.deepEqual(getPlanningMovements(data,'2026-10-04').returns.map(m=>m.id),[contract.id]);
  contract.arrival={date:'2026-10-04T17:45',km:18200,fuel:'Plein',notes:'',photos:[]};
  assert.deepEqual(getPlanningMovements(data,'2026-10-04'),{departures:[],returns:[]});
  contract.status='clôturé';
  assert.deepEqual(getPlanningMovements(data,'2026-10-04'),{departures:[],returns:[]});
});

test('planning : un contrat annulé ou clôturé ne réactive pas sa réservation liée',()=>{
  for (const status of ['annulé','clôturé'] as const) {
    const data=planningData();
    data.bookings=[planningBooking({end:'2026-10-04T18:00'})];
    data.contracts=[planningContract({bookingId:'booking-a',status,end:'2026-10-04T18:00'})];
    assert.deepEqual(getPlanningMovements(data,'2026-10-04'),{departures:[],returns:[]});
  }
});

test('planning : conserve les locations distinctes du même véhicule et trie de façon stable',()=>{
  const data=planningData();
  data.bookings=[
    planningBooking({id:'z',start:'2026-10-04T11:00',end:'2026-10-04T12:00'}),
    planningBooking({id:'b',start:'2026-10-04T09:00',end:'2026-10-04T10:00'}),
    planningBooking({id:'a',start:'2026-10-04T09:00',end:'2026-10-04T10:00'}),
  ];
  data.contracts=[
    planningContract({id:'b',start:'2026-10-04T09:00',end:'2026-10-04T10:00'}),
    planningContract({id:'a',start:'2026-10-04T09:00',end:'2026-10-04T10:00'}),
  ];
  const expected=['booking:a','booking:b','contract:a','contract:b','booking:z'];
  const movements=getPlanningMovements(data,'2026-10-04');
  assert.deepEqual(movements.departures.map(m=>`${m.kind}:${m.id}`),expected);
  assert.deepEqual(movements.returns.map(m=>`${m.kind}:${m.id}`),expected);
  data.bookings.reverse();
  data.contracts.reverse();
  assert.deepEqual(getPlanningMovements(data,'2026-10-04'),movements);
});

test('planning : calcul et résultats indépendants des données sauvegardées',()=>{
  const data=planningData();
  data.bookings=[planningBooking({id:'later',start:'2026-10-04T12:00'}),planningBooking()];
  data.contracts=[planningContract()];
  const before=structuredClone(data);
  const movements=getPlanningMovements(data,'2026-10-04');
  assert.deepEqual(data,before);
  movements.departures[0].carId='another-car';
  movements.departures.pop();
  assert.deepEqual(data,before);
});

test('planning : navigation de date à travers mois, années, années bissextiles et changements d’heure',()=>{
  const examples:[string,number,string][]=[
    ['2026-10-04',0,'2026-10-04'],
    ['2026-10-31',1,'2026-11-01'],
    ['2026-11-01',-1,'2026-10-31'],
    ['2026-12-31',1,'2027-01-01'],
    ['2027-01-01',-1,'2026-12-31'],
    ['2028-02-28',1,'2028-02-29'],
    ['2028-03-01',-1,'2028-02-29'],
    ['2026-02-28',1,'2026-03-01'],
    ['2026-03-08',1,'2026-03-09'],
    ['2026-03-29',1,'2026-03-30'],
    ['2026-10-25',1,'2026-10-26'],
    ['2026-11-01',1,'2026-11-02'],
    ['2026-01-01',365,'2027-01-01'],
  ];
  for (const [day,offset,expected] of examples) {
    assert.equal(shiftPlanningDate(day,offset),expected);
    assert.equal(shiftPlanningDate(expected,-offset),day);
  }
  assert.equal(shiftPlanningDate('2026-02-30',1),'2026-02-30');
  assert.equal(shiftPlanningDate('invalid',1),'invalid');
  assert.equal(shiftPlanningDate('',1),'');
  assert.equal(shiftPlanningDate('2026-10-04',0.5),'2026-10-04');
  assert.equal(shiftPlanningDate('0001-01-01',-1),'0001-01-01');
  assert.equal(shiftPlanningDate('9999-12-31',1),'9999-12-31');
  assert.equal(shiftPlanningDate('2026-10-04',Number.MAX_SAFE_INTEGER),'2026-10-04');
});
