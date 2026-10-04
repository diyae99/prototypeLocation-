import {useState} from 'react';
import {ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, RotateCcw, UsersRound} from 'lucide-react';
import {type Data, carName, clientName, date, localDate} from './domain';
import {getPlanningMovements, shiftPlanningDate} from './planning';
import CarDrawing from './CarDrawing';

type Props = {
  data: Data;
  open: (kind: string, id?: string) => void;
};

export default function DashboardPlanning({data, open}: Props) {
  const [selectedDay, setSelectedDay] = useState(localDate);
  const [movement, setMovement] = useState<'departures' | 'returns'>('departures');
  const planning = getPlanningMovements(data, selectedDay);
  const items = planning[movement];
  const returning = movement === 'returns';
  const dayLabel = date(`${selectedDay}T12:00`);

  return <section className="panel planning-panel" aria-labelledby="planning-title">
    <div className="section-heading">
      <div>
        <h2 id="planning-title">Planning des véhicules</h2>
        <p>Les sorties et les récupérations prévues pour chaque jour.</p>
      </div>
      <CalendarDays size={21} aria-hidden="true"/>
    </div>
    <div className="planning-controls">
      <label className="planning-date">
        <span>Date du planning</span>
        <input
          type="date"
          value={selectedDay}
          min="0001-01-01"
          max="9999-12-31"
          required
          onInput={event => {
            const value = event.currentTarget.value;
            if (value && event.currentTarget.validity.valid) setSelectedDay(value);
          }}
        />
      </label>
      <div className="planning-navigation" role="group" aria-label="Changer de jour">
        <button className="secondary" aria-label="Jour précédent" onClick={() => setSelectedDay(day => shiftPlanningDate(day, -1))}>
          <ChevronLeft size={19}/>
        </button>
        <button className="secondary" onClick={() => setSelectedDay(localDate())}>Aujourd’hui</button>
        <button className="secondary" aria-label="Jour suivant" onClick={() => setSelectedDay(day => shiftPlanningDate(day, 1))}>
          <ChevronRight size={19}/>
        </button>
      </div>
    </div>
    <div className="planning-tabs" role="group" aria-label="Type de mouvement">
      <button aria-pressed={!returning} aria-controls="planning-results" onClick={() => setMovement('departures')}>
        <ArrowUpRight size={19} aria-hidden="true"/>
        <span>Voitures à sortir</span><b>{planning.departures.length}</b>
      </button>
      <button aria-pressed={returning} aria-controls="planning-results" onClick={() => setMovement('returns')}>
        <RotateCcw size={18} aria-hidden="true"/>
        <span>Voitures à récupérer</span><b>{planning.returns.length}</b>
      </button>
    </div>
    <p className="planning-summary" role="status">
      {items.length} {returning ? 'récupération' : 'sortie'}{items.length === 1 ? '' : 's'} prévue{items.length === 1 ? '' : 's'} le {dayLabel}
    </p>
    <div id="planning-results">
      {items.length ? <div className="car-grid planning-cards">
        {items.map(item => {
          const vehicle = data.cars.find(car => car.id === item.carId);
          const customer = data.clients.find(client => client.id === item.clientId);
          const color = ['#adc5c0', '#d5d1c7', '#647e8c'][Math.max(0, data.cars.findIndex(car => car.id === item.carId)) % 3];
          return <article className="car-card planning-card" key={`${item.kind}-${item.id}`}>
            <div className="car-art">
              {vehicle?.photo ? <img src={vehicle.photo} alt={carName(vehicle)}/> : <CarDrawing color={color}/>}
              <span className={`badge ${item.kind === 'booking' ? 'confirmée' : 'en-cours'}`}>
                {item.kind === 'booking' ? 'Réservation' : 'Contrat'}
              </span>
            </div>
            <div className="car-body">
              <h3>{carName(vehicle)}</h3>
              <span className="plate">{vehicle?.plate ?? 'Immatriculation indisponible'}</span>
              <div className="planning-card-details">
                <p><Clock3 size={17} aria-hidden="true"/><span>{returning ? 'Retour prévu' : 'Départ prévu'} <b><time dateTime={item.scheduledAt}>{item.scheduledAt.slice(11, 16)}</time></b></span></p>
                <p><UsersRound size={17} aria-hidden="true"/><span>{clientName(customer)}</span></p>
              </div>
              <button className="car-detail" onClick={() => open(item.kind, item.id)}>
                {item.kind === 'booking' ? 'Voir la réservation' : 'Voir le contrat'}<ArrowUpRight size={17}/>
              </button>
            </div>
          </article>;
        })}
      </div> : <div className="empty planning-empty">
        <CalendarDays size={32} aria-hidden="true"/>
        <p>Aucune voiture à {returning ? 'récupérer' : 'sortir'} le {dayLabel}.</p>
      </div>}
    </div>
    <div className="quick-actions">
      <button onClick={() => open('pickDeparture')}><ArrowUpRight size={18}/>Départ véhicule</button>
      <button onClick={() => open('pickReturn')}><RotateCcw size={18}/>Retour véhicule</button>
      <button onClick={() => open('pickPayment')}><Plus size={18}/>Ajouter un paiement</button>
    </div>
  </section>;
}
