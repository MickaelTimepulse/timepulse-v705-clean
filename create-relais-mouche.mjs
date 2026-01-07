import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🏃 Création de l\'événement "Relais de la Mouche"...\n');

// 1. Récupérer un organisateur
const { data: organizer } = await supabase
  .from('organizers')
  .select('id')
  .limit(1)
  .single();

if (!organizer) {
  console.error('❌ Aucun organisateur trouvé');
  process.exit(1);
}

console.log(`✅ Organisateur: ${organizer.id}`);

// 2. Créer l'événement
const { data: event, error: eventError } = await supabase
  .from('events')
  .insert({
    name: 'Relais de la Mouche 2025',
    slug: 'relais-mouche-2025',
    start_date: '2025-05-10',
    end_date: '2025-05-10',
    city: 'Nantes',
    address: 'Parc de la Chantrerie, Nantes',
    country: 'FRA',
    organizer_id: organizer.id,
    description: 'Relais par équipe de 4 coureurs - Course affiliée FFA',
    ffa_affiliated: true,
    ffa_calorg_code: '999999',
    registration_opens_at: '2025-01-01',
    registration_closes_at: '2025-05-08',
    max_participants: 200,
    is_public: true
  })
  .select()
  .single();

if (eventError) {
  console.error('❌ Erreur création événement:', eventError.message);
  process.exit(1);
}

console.log(`✅ Événement créé: ${event.name} (ID: ${event.id})`);

// 3. Créer la course relais
const { data: race, error: raceError } = await supabase
  .from('races')
  .insert({
    event_id: event.id,
    name: 'Relais 4 × 5 km',
    distance: 20,
    sport_type: 'Course à pied',
    race_date: event.start_date,
    max_participants: 200,
    registration_opens_at: event.registration_opens_at,
    registration_closes_at: event.registration_closes_at,
    team_config: {
      enabled: true,
      min_members: 4,
      max_members: 4,
      team_rules: {
        category_quotas: {
          homme: { min_men: 4, max_men: 4, min_women: 0, max_women: 0 },
          femme: { min_men: 0, max_men: 0, min_women: 4, max_women: 4 },
          mixte: { min_men: 2, max_men: 2, min_women: 2, max_women: 2 }
        }
      }
    }
  })
  .select()
  .single();

if (raceError) {
  console.error('❌ Erreur création course:', raceError.message);
  process.exit(1);
}

console.log(`✅ Course créée: ${race.name} (ID: ${race.id})`);

// 4. Créer les segments de relais
const segments = [
  { segment_order: 1, name: 'Relais 1', distance: 5, discipline: 'running' },
  { segment_order: 2, name: 'Relais 2', distance: 5, discipline: 'running' },
  { segment_order: 3, name: 'Relais 3', distance: 5, discipline: 'running' },
  { segment_order: 4, name: 'Relais 4', distance: 5, discipline: 'running' }
];

for (const segment of segments) {
  const { error: segmentError } = await supabase
    .from('relay_segments')
    .insert({
      race_id: race.id,
      ...segment
    });

  if (segmentError) {
    console.error(`❌ Erreur segment ${segment.segment_order}:`, segmentError.message);
  } else {
    console.log(`✅ Segment ${segment.segment_order} créé: ${segment.name}`);
  }
}

// 5. Créer les types de licence disponibles
const { data: licenseTypes } = await supabase
  .from('license_types')
  .select('id, name, code')
  .in('code', ['FFA', 'NON_LICENCIE']);

if (licenseTypes && licenseTypes.length > 0) {
  console.log('\n📝 Types de licence disponibles:');
  licenseTypes.forEach(lt => {
    console.log(`   - ${lt.name} (${lt.code})`);
  });

  // 6. Créer une période de tarification
  const { data: period, error: periodError } = await supabase
    .from('pricing_periods')
    .insert({
      race_id: race.id,
      name: 'Tarif Normal',
      start_date: '2025-01-01',
      end_date: '2025-05-08',
      active: true
    })
    .select()
    .single();

  if (!periodError && period) {
    console.log(`\n✅ Période de tarification créée: ${period.name}`);

    // 7. Créer les tarifs pour chaque type de licence
    for (const lt of licenseTypes) {
      const price = lt.code === 'FFA' ? 800 : 1000; // 8€ licencié, 10€ non-licencié

      const { error: pricingError } = await supabase
        .from('race_pricing')
        .insert({
          race_id: race.id,
          license_type_id: lt.id,
          pricing_period_id: period.id,
          price_cents: price
        });

      if (!pricingError) {
        console.log(`   - ${lt.name}: ${price / 100}€`);
      }
    }
  }
}

console.log('\n🎉 Événement "Relais de la Mouche" créé avec succès !');
console.log(`\n🔗 URL d'inscription: /events/${event.slug}/register?race=${race.id}`);
console.log(`\n✅ Configuration FFA:`);
console.log(`   - Événement affilié FFA: OUI`);
console.log(`   - Code CALORG: ${event.ffa_calorg_code}`);
console.log(`   - Vérification licence FFA: Automatique`);
console.log(`   - PSP obligatoire pour non-licenciés: OUI`);
