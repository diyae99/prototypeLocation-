import type {Data} from './domain';

export type PlanningMovement = {
  id:string;
  kind:'booking'|'contract';
  carId:string;
  clientId:string;
  scheduledAt:string;
};

export function getPlanningMovements(data:Data, day:string):{departures:PlanningMovement[];returns:PlanningMovement[]} {
  const departures:PlanningMovement[] = [];
  const returns:PlanningMovement[] = [];
  const contractedBookings = new Set(data.contracts.map(contract=>contract.bookingId).filter(Boolean));

  for (const booking of data.bookings) {
    if (booking.status !== 'confirmée' || contractedBookings.has(booking.id)) continue;
    const movement = {id:booking.id, kind:'booking' as const, carId:booking.carId, clientId:booking.clientId};
    if (booking.start.slice(0,10) === day) departures.push({...movement, scheduledAt:booking.start});
    if (booking.end.slice(0,10) === day) returns.push({...movement, scheduledAt:booking.end});
  }

  for (const contract of data.contracts) {
    if ((contract.status !== 'préparé' && contract.status !== 'en cours') || contract.arrival) continue;
    const movement = {id:contract.id, kind:'contract' as const, carId:contract.carId, clientId:contract.clientId};
    if (contract.status === 'préparé' && !contract.departure && contract.start.slice(0,10) === day) {
      departures.push({...movement, scheduledAt:contract.start});
    }
    if (contract.end.slice(0,10) === day) returns.push({...movement, scheduledAt:contract.end});
  }

  const compare = (a:PlanningMovement,b:PlanningMovement)=>{
    const aKey = `${a.scheduledAt}|${a.kind}|${a.id}`;
    const bKey = `${b.scheduledAt}|${b.kind}|${b.id}`;
    return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
  };
  return {departures:departures.sort(compare), returns:returns.sort(compare)};
}

export function shiftPlanningDate(day:string, offset:number):string {
  const date = new Date(`${day}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(date.getTime()) || date.getUTCFullYear()<1 || date.toISOString().slice(0,10) !== day || !Number.isInteger(offset)) return day;
  date.setUTCDate(date.getUTCDate()+offset);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear()<1 || date.getUTCFullYear()>9999) return day;
  return date.toISOString().slice(0,10);
}
