-- db/migrations/010_seed_initial_data.sql

-- Chauffeurs
INSERT INTO public.drivers (name, notes) VALUES
    ('Yannick', 'Semaine, 7h-15h habituel'),
    ('Solange', 'Semaine, 7h-14h habituel'),
    ('Ali', 'Semaine après-midi/soir, 15h-23h'),
    ('Aymen', 'Weekend + remplacements');

-- Véhicules
INSERT INTO public.vehicles (name, license_plate) VALUES
    ('Dacia 1', 'HE-271-AT'),
    ('Dacia 2', 'HH-147-GZ');

-- Point de départ fixe (dépôt)
INSERT INTO public.locations (name, address, latitude, longitude, location_type, notes) VALUES
    ('Dépôt - Simone Veil', '117 avenue Simone Veil, 06200 Nice', 43.6205, 7.0489, 'rdv', 'Point de départ et retour fixe pour toutes les tournées');
