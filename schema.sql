-- =====================================================================
-- Boutique gadgets : schéma final (Supabase / PostgreSQL)
-- À coller dans Supabase > SQL Editor > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- PRODUITS
-- ---------------------------------------------------------------------
create table if not exists produits (
  id            uuid primary key default gen_random_uuid(),
  nom           text    not null,
  description   text,
  prix          integer not null check (prix > 0),          -- prix de vente affiché (FCFA)
  prix_vendeur  integer not null check (prix_vendeur >= 0), -- ce que tu dois au vendeur
  photo_url     text,
  vendeur_nom   text,
  vendeur_tel   text,
  actif         boolean not null default true,
  created_at    timestamptz not null default now(),
  check (prix >= prix_vendeur)
);

-- ---------------------------------------------------------------------
-- COMMANDES
-- ---------------------------------------------------------------------
create table if not exists commandes (
  id                   uuid primary key default gen_random_uuid(), -- sert dans le lien de suivi
  numero               serial unique,                              -- n° lisible pour le client

  produit_id           uuid not null references produits(id),
  quantite             integer not null default 1 check (quantite between 1 and 10),

  -- Montants (FCFA), calculés côté serveur au moment de la commande
  prix_unitaire        integer not null,            -- prix figé à la commande
  total_produits       integer not null,            -- prix_unitaire * quantite
  frais_livraison      integer check (frais_livraison >= 0),
                                                    -- Abidjan : 0 ; intérieur : null jusqu'au devis
  total                integer generated always as
                         (total_produits + coalesce(frais_livraison, 0)) stored,
  commission           integer not null,            -- ta marge sur les produits

  -- Client
  client_nom           text not null,
  client_tel           text not null check (client_tel ~ '^[0-9]{10}$'),
  client_email         text,
  notification_pref    text not null
                         check (notification_pref in ('whatsapp','sms','appel','email')),
  adresse              text not null,
  ville                text not null,
  zone                 text not null check (zone in ('abidjan','interieur')),

  -- Paiement MTN Money (manuel au départ)
  momo_transaction_id  text unique,                 -- null tant que le client n'a pas payé

  -- Suivi
  statut               text not null default 'paiement_a_verifier'
                         check (statut in (
                           'en_attente_devis',   -- intérieur : l'admin doit chiffrer l'expédition
                           'devis_envoye',       -- le client peut payer
                           'paiement_a_verifier',-- le client a saisi son n° de transaction
                           'validee',            -- paiement vérifié par l'admin
                           'livree',             -- livraison confirmée par l'admin
                           'annulee'
                         )),

  devis_envoye_at      timestamptz,
  devis_expire_at      timestamptz,                 -- ex. envoi + 48 h
  paiement_declare_at  timestamptz,
  validee_at           timestamptz,
  livree_at            timestamptz,
  created_at           timestamptz not null default now(),

  -- L'e-mail est obligatoire si le client choisit ce canal
  constraint email_si_canal_email
    check (notification_pref <> 'email' or client_email is not null),

  -- Cohérence entre zone, frais et statut de départ
  constraint abidjan_livraison_gratuite
    check (zone <> 'abidjan' or frais_livraison = 0)
);

create index if not exists commandes_statut_idx  on commandes (statut, created_at desc);
create index if not exists commandes_tel_idx     on commandes (client_tel);

-- ---------------------------------------------------------------------
-- SÉCURITÉ (RLS)
-- ---------------------------------------------------------------------
alter table produits  enable row level security;
alter table commandes enable row level security;

-- Le public ne voit que les produits actifs, et sans les champs sensibles
-- (prix_vendeur, vendeur_tel) : on passe donc par une vue.
create or replace view produits_publics as
  select id, nom, description, prix, photo_url
  from produits
  where actif = true;

grant select on produits_publics to anon;

-- Aucune policy sur `produits` ni `commandes` : seul le serveur
-- (clé service_role, routes API Next.js) peut y accéder.
-- Le catalogue public lit `produits_publics`.

-- ---------------------------------------------------------------------
-- DONNÉES DE TEST (à supprimer ensuite)
-- ---------------------------------------------------------------------
insert into produits (nom, description, prix, prix_vendeur, vendeur_nom, vendeur_tel) values
  ('Écouteurs sans fil', 'Bluetooth 5.0, boîtier de charge', 8000, 5500, 'Vendeur test', '0700000000'),
  ('Support téléphone voiture', 'Fixation ventouse, rotation 360°', 3500, 2000, 'Vendeur test', '0700000000'),
  ('Lampe LED rechargeable', 'USB, 3 modes d''éclairage', 5000, 3200, 'Vendeur test', '0700000000');
