--
-- PostgreSQL database dump
--

\restrict gcRJipQJmwaK4RBTUKxmrbxv2X7fP7Qqu5RAZoN94DkweKsW0wd7HBhk3CZ8kLo

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: sex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sex AS ENUM (
    'MALE',
    'FEMALE'
);


--
-- Name: species; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.species AS ENUM (
    'DOG',
    'CAT',
    'OTHER'
);


--
-- Name: status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status AS ENUM (
    'AVAILABLE',
    'ADOPTED',
    'LOST',
    'INACTIVE'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'USER',
    'ADMIN',
    'SHELTER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adoption_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adoption_requests (
    request_id integer NOT NULL,
    pet_id integer NOT NULL,
    user_id integer NOT NULL,
    contact_name character varying(255) NOT NULL,
    contact_email character varying(255) NOT NULL,
    contact_phone character varying(60),
    message character varying(1000),
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    decision_notes character varying(1000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    edited_at timestamp without time zone,
    applicant_answers text
);


--
-- Name: adoption_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.adoption_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: adoption_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.adoption_requests_request_id_seq OWNED BY public.adoption_requests.request_id;


--
-- Name: case_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_messages (
    message_id integer NOT NULL,
    case_id integer NOT NULL,
    sender_id integer,
    sender_name character varying(150),
    message character varying(2000) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    image_urls text
);


--
-- Name: case_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.case_messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: case_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.case_messages_message_id_seq OWNED BY public.case_messages.message_id;


--
-- Name: cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cases (
    case_id integer NOT NULL,
    case_type character varying(30) NOT NULL,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    pet_id integer,
    report_id integer,
    adoption_request_id integer,
    report_sighting_id integer,
    owner_id integer NOT NULL,
    participant_id integer,
    title character varying(180) NOT NULL,
    last_message character varying(2000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at timestamp without time zone,
    blocked_by integer,
    blocked_at timestamp without time zone
);


--
-- Name: cases_case_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cases_case_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cases_case_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cases_case_id_seq OWNED BY public.cases.case_id;


--
-- Name: chat_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_reports (
    chat_report_id integer NOT NULL,
    case_id integer,
    message_id integer,
    reporter_id integer NOT NULL,
    reported_user_id integer,
    case_title character varying(180),
    reason character varying(30) NOT NULL,
    details character varying(1000),
    evidence text,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    admin_notes character varying(1000),
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: chat_reports_chat_report_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_reports_chat_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_reports_chat_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_reports_chat_report_id_seq OWNED BY public.chat_reports.chat_report_id;


--
-- Name: lost_pets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lost_pets (
    report_id integer NOT NULL,
    reporter_id integer NOT NULL,
    type character varying(30) NOT NULL,
    name character varying(255) NOT NULL,
    species character varying(30) NOT NULL,
    breed character varying(255),
    sex character varying(30),
    color character varying(255),
    age integer,
    location character varying(500) NOT NULL,
    latitude double precision,
    longitude double precision,
    location_point public.geography(Point,4326) GENERATED ALWAYS AS (
CASE
    WHEN ((latitude IS NOT NULL) AND (longitude IS NOT NULL)) THEN (public.st_setsrid(public.st_makepoint(longitude, latitude), 4326))::public.geography
    ELSE NULL::public.geography
END) STORED,
    description character varying(1000),
    contact_phone character varying(60),
    image_url text,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    moderation_notes character varying(1000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_urls character varying(4000)
);


--
-- Name: lost_pets_report_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lost_pets_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lost_pets_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lost_pets_report_id_seq OWNED BY public.lost_pets.report_id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    match_id integer NOT NULL,
    report_id integer NOT NULL,
    pet_id integer,
    visual_score real,
    attribute_score integer,
    score real NOT NULL,
    reason character varying(500),
    status character varying(30) DEFAULT 'SUGGESTED'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    confidence real,
    matched_report_id integer,
    CONSTRAINT matches_status_check CHECK (((status)::text = ANY ((ARRAY['SUGGESTED'::character varying, 'VALIDATED'::character varying, 'REJECTED'::character varying, 'DISCARDED'::character varying])::text[])))
);


--
-- Name: matches_match_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matches_match_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matches_match_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matches_match_id_seq OWNED BY public.matches.match_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(40) NOT NULL,
    title character varying(200) NOT NULL,
    message character varying(500),
    link character varying(200),
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: password_reset_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_codes (
    reset_id integer NOT NULL,
    user_id integer NOT NULL,
    code_hash character varying(100) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: password_reset_codes_reset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_codes_reset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_codes_reset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_codes_reset_id_seq OWNED BY public.password_reset_codes.reset_id;


--
-- Name: pet_image_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_image_embeddings (
    embedding_id integer NOT NULL,
    image_id integer NOT NULL,
    model character varying(50) DEFAULT 'efficientnet_b0'::character varying NOT NULL,
    dim integer DEFAULT 1280 NOT NULL,
    embedding real[] NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    breed character varying(80),
    breed_confidence real,
    colors character varying(120),
    size character varying(16),
    stage character varying(16)
);


--
-- Name: pet_image_embeddings_embedding_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pet_image_embeddings_embedding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pet_image_embeddings_embedding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pet_image_embeddings_embedding_id_seq OWNED BY public.pet_image_embeddings.embedding_id;


--
-- Name: pet_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_images (
    image_id integer NOT NULL,
    pet_id integer,
    url_image text NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer
);


--
-- Name: pet_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pet_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pet_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pet_images_image_id_seq OWNED BY public.pet_images.image_id;


--
-- Name: pet_vaccines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_vaccines (
    vaccine_id integer NOT NULL,
    pet_id integer NOT NULL,
    name character varying(120) NOT NULL,
    applied_at date,
    next_dose_at date,
    vet character varying(255),
    lot character varying(80),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pet_vaccines_vaccine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pet_vaccines_vaccine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pet_vaccines_vaccine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pet_vaccines_vaccine_id_seq OWNED BY public.pet_vaccines.vaccine_id;


--
-- Name: pets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pets (
    pet_id integer NOT NULL,
    owner_id integer,
    name character varying(255) NOT NULL,
    species public.species NOT NULL,
    breed character varying(255) NOT NULL,
    sex public.sex NOT NULL,
    color character varying(255) NOT NULL,
    age integer NOT NULL,
    description character varying(500) NOT NULL,
    location character varying(500) NOT NULL,
    latitude double precision,
    longitude double precision,
    location_point public.geography(Point,4326) GENERATED ALWAYS AS (
CASE
    WHEN ((latitude IS NOT NULL) AND (longitude IS NOT NULL)) THEN (public.st_setsrid(public.st_makepoint(longitude, latitude), 4326))::public.geography
    ELSE NULL::public.geography
END) STORED,
    status public.status NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    birth_date date,
    weight_kg double precision,
    sterilized boolean,
    microchip character varying(60),
    dewormed_at date,
    vet_name character varying(255),
    medical_notes character varying(1000),
    size character varying(20)
);


--
-- Name: pets_pet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pets_pet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pets_pet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pets_pet_id_seq OWNED BY public.pets.pet_id;


--
-- Name: publication_authorization_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_authorization_requests (
    authorization_id integer NOT NULL,
    user_id integer NOT NULL,
    reason character varying(1000),
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    review_notes character varying(1000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: publication_authorization_requests_authorization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.publication_authorization_requests_authorization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: publication_authorization_requests_authorization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.publication_authorization_requests_authorization_id_seq OWNED BY public.publication_authorization_requests.authorization_id;


--
-- Name: report_image_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_image_embeddings (
    embedding_id integer NOT NULL,
    report_id integer NOT NULL,
    model character varying(50) DEFAULT 'efficientnet_b0'::character varying NOT NULL,
    dim integer DEFAULT 1280 NOT NULL,
    embedding real[] NOT NULL,
    breed character varying(80),
    breed_confidence real,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    image_url character varying(500),
    colors character varying(120),
    size character varying(16),
    stage character varying(16)
);


--
-- Name: report_image_embeddings_embedding_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_image_embeddings_embedding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_image_embeddings_embedding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_image_embeddings_embedding_id_seq OWNED BY public.report_image_embeddings.embedding_id;


--
-- Name: report_sighting_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_sighting_entries (
    entry_id integer NOT NULL,
    sighting_id integer NOT NULL,
    location character varying(255),
    latitude double precision,
    longitude double precision,
    message character varying(2000) NOT NULL,
    image_urls character varying(4000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: report_sighting_entries_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_sighting_entries_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_sighting_entries_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_sighting_entries_entry_id_seq OWNED BY public.report_sighting_entries.entry_id;


--
-- Name: report_sightings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_sightings (
    sighting_id integer NOT NULL,
    report_id integer NOT NULL,
    user_id integer,
    contact_name character varying(150) NOT NULL,
    contact_email character varying(180),
    contact_phone character varying(40),
    location character varying(255),
    message character varying(2000) NOT NULL,
    image_urls character varying(4000),
    status character varying(30) DEFAULT 'NEW'::character varying NOT NULL,
    owner_reply character varying(2000),
    case_opened_at timestamp without time zone,
    replied_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    latitude double precision,
    longitude double precision,
    edited_at timestamp without time zone
);


--
-- Name: report_sightings_sighting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_sightings_sighting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_sightings_sighting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_sightings_sighting_id_seq OWNED BY public.report_sightings.sighting_id;


--
-- Name: user_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_blocks (
    block_id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    case_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_user_blocks_self CHECK ((blocker_id <> blocked_id))
);


--
-- Name: user_blocks_block_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_blocks_block_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_blocks_block_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_blocks_block_id_seq OWNED BY public.user_blocks.block_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone character varying(60),
    role public.user_role DEFAULT 'USER'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    publishing_authorized boolean DEFAULT false NOT NULL,
    account_active boolean DEFAULT true NOT NULL
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: adoption_requests request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adoption_requests ALTER COLUMN request_id SET DEFAULT nextval('public.adoption_requests_request_id_seq'::regclass);


--
-- Name: case_messages message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_messages ALTER COLUMN message_id SET DEFAULT nextval('public.case_messages_message_id_seq'::regclass);


--
-- Name: cases case_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases ALTER COLUMN case_id SET DEFAULT nextval('public.cases_case_id_seq'::regclass);


--
-- Name: chat_reports chat_report_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reports ALTER COLUMN chat_report_id SET DEFAULT nextval('public.chat_reports_chat_report_id_seq'::regclass);


--
-- Name: lost_pets report_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_pets ALTER COLUMN report_id SET DEFAULT nextval('public.lost_pets_report_id_seq'::regclass);


--
-- Name: matches match_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches ALTER COLUMN match_id SET DEFAULT nextval('public.matches_match_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: password_reset_codes reset_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes ALTER COLUMN reset_id SET DEFAULT nextval('public.password_reset_codes_reset_id_seq'::regclass);


--
-- Name: pet_image_embeddings embedding_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_image_embeddings ALTER COLUMN embedding_id SET DEFAULT nextval('public.pet_image_embeddings_embedding_id_seq'::regclass);


--
-- Name: pet_images image_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_images ALTER COLUMN image_id SET DEFAULT nextval('public.pet_images_image_id_seq'::regclass);


--
-- Name: pet_vaccines vaccine_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_vaccines ALTER COLUMN vaccine_id SET DEFAULT nextval('public.pet_vaccines_vaccine_id_seq'::regclass);


--
-- Name: pets pet_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pets ALTER COLUMN pet_id SET DEFAULT nextval('public.pets_pet_id_seq'::regclass);


--
-- Name: publication_authorization_requests authorization_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_authorization_requests ALTER COLUMN authorization_id SET DEFAULT nextval('public.publication_authorization_requests_authorization_id_seq'::regclass);


--
-- Name: report_image_embeddings embedding_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_image_embeddings ALTER COLUMN embedding_id SET DEFAULT nextval('public.report_image_embeddings_embedding_id_seq'::regclass);


--
-- Name: report_sighting_entries entry_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_sighting_entries ALTER COLUMN entry_id SET DEFAULT nextval('public.report_sighting_entries_entry_id_seq'::regclass);


--
-- Name: report_sightings sighting_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_sightings ALTER COLUMN sighting_id SET DEFAULT nextval('public.report_sightings_sighting_id_seq'::regclass);


--
-- Name: user_blocks block_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks ALTER COLUMN block_id SET DEFAULT nextval('public.user_blocks_block_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: adoption_requests adoption_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adoption_requests
    ADD CONSTRAINT adoption_requests_pkey PRIMARY KEY (request_id);


--
-- Name: case_messages case_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_messages
    ADD CONSTRAINT case_messages_pkey PRIMARY KEY (message_id);


--
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (case_id);


--
-- Name: chat_reports chat_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reports
    ADD CONSTRAINT chat_reports_pkey PRIMARY KEY (chat_report_id);


--
-- Name: lost_pets lost_pets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_pets
    ADD CONSTRAINT lost_pets_pkey PRIMARY KEY (report_id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (match_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: password_reset_codes password_reset_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_pkey PRIMARY KEY (reset_id);


--
-- Name: pet_image_embeddings pet_image_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_image_embeddings
    ADD CONSTRAINT pet_image_embeddings_pkey PRIMARY KEY (embedding_id);


--
-- Name: pet_images pet_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_images
    ADD CONSTRAINT pet_images_pkey PRIMARY KEY (image_id);


--
-- Name: pet_vaccines pet_vaccines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_vaccines
    ADD CONSTRAINT pet_vaccines_pkey PRIMARY KEY (vaccine_id);


--
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (pet_id);


--
-- Name: publication_authorization_requests publication_authorization_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_authorization_requests
    ADD CONSTRAINT publication_authorization_requests_pkey PRIMARY KEY (authorization_id);


--
-- Name: report_image_embeddings report_image_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_image_embeddings
    ADD CONSTRAINT report_image_embeddings_pkey PRIMARY KEY (embedding_id);


--
-- Name: report_sighting_entries report_sighting_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_sighting_entries
    ADD CONSTRAINT report_sighting_entries_pkey PRIMARY KEY (entry_id);


--
-- Name: report_sightings report_sightings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_sightings
    ADD CONSTRAINT report_sightings_pkey PRIMARY KEY (sighting_id);


--
-- Name: user_blocks user_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: matches ux_matches_report_pet; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT ux_matches_report_pet UNIQUE (report_id, pet_id);


--
-- Name: pet_image_embeddings ux_pet_image_embeddings_image; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_image_embeddings
    ADD CONSTRAINT ux_pet_image_embeddings_image UNIQUE (image_id);


--
-- Name: user_blocks ux_user_blocks; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT ux_user_blocks UNIQUE (blocker_id, blocked_id);


--
-- Name: idx_adoption_requests_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_adoption_requests_pet_id ON public.adoption_requests USING btree (pet_id);


--
-- Name: idx_adoption_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_adoption_requests_user_id ON public.adoption_requests USING btree (user_id);


--
-- Name: idx_authorization_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authorization_requests_user_id ON public.publication_authorization_requests USING btree (user_id);


--
-- Name: idx_chat_reports_reported; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_reports_reported ON public.chat_reports USING btree (reported_user_id);


--
-- Name: idx_chat_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_reports_status ON public.chat_reports USING btree (status, created_at DESC);


--
-- Name: idx_lost_pets_location_point; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lost_pets_location_point ON public.lost_pets USING gist (location_point);


--
-- Name: idx_lost_pets_reporter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lost_pets_reporter_id ON public.lost_pets USING btree (reporter_id);


--
-- Name: idx_lost_pets_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lost_pets_type ON public.lost_pets USING btree (type);


--
-- Name: idx_matches_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_pet_id ON public.matches USING btree (pet_id);


--
-- Name: idx_matches_report_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_report_id ON public.matches USING btree (report_id);


--
-- Name: idx_matches_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_status ON public.matches USING btree (status);


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_password_reset_codes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_codes_user ON public.password_reset_codes USING btree (user_id);


--
-- Name: idx_pet_image_embeddings_breed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pet_image_embeddings_breed ON public.pet_image_embeddings USING btree (breed);


--
-- Name: idx_pet_image_embeddings_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pet_image_embeddings_image_id ON public.pet_image_embeddings USING btree (image_id);


--
-- Name: idx_pet_images_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pet_images_pet_id ON public.pet_images USING btree (pet_id);


--
-- Name: idx_pet_images_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pet_images_position ON public.pet_images USING btree (pet_id, "position");


--
-- Name: idx_pet_vaccines_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pet_vaccines_pet_id ON public.pet_vaccines USING btree (pet_id);


--
-- Name: idx_pets_location_point; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pets_location_point ON public.pets USING gist (location_point);


--
-- Name: idx_pets_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pets_owner_id ON public.pets USING btree (owner_id);


--
-- Name: idx_pets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pets_status ON public.pets USING btree (status);


--
-- Name: idx_report_image_embeddings_breed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_image_embeddings_breed ON public.report_image_embeddings USING btree (breed);


--
-- Name: idx_report_image_embeddings_report; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_image_embeddings_report ON public.report_image_embeddings USING btree (report_id);


--
-- Name: idx_report_sighting_entries_sighting; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_sighting_entries_sighting ON public.report_sighting_entries USING btree (sighting_id, created_at);


--
-- Name: idx_report_sightings_report_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_sightings_report_id ON public.report_sightings USING btree (report_id);


--
-- Name: idx_user_blocks_blocked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_blocked ON public.user_blocks USING btree (blocked_id);


--
-- Name: ix_case_messages_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_case_messages_case ON public.case_messages USING btree (case_id);


--
-- Name: ix_cases_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cases_owner ON public.cases USING btree (owner_id);


--
-- Name: ix_cases_participant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cases_participant ON public.cases USING btree (participant_id);


--
-- Name: ux_adoption_requests_pet_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_adoption_requests_pet_user ON public.adoption_requests USING btree (pet_id, user_id);


--
-- Name: ux_cases_adoption_request; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_cases_adoption_request ON public.cases USING btree (adoption_request_id) WHERE (adoption_request_id IS NOT NULL);


--
-- Name: ux_cases_report_sighting; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_cases_report_sighting ON public.cases USING btree (report_sighting_id) WHERE (report_sighting_id IS NOT NULL);


--
-- Name: ux_matches_report_matchedreport; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_matches_report_matchedreport ON public.matches USING btree (report_id, matched_report_id) WHERE (matched_report_id IS NOT NULL);


--
-- Name: ux_report_sightings_report_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_report_sightings_report_user ON public.report_sightings USING btree (report_id, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: case_messages case_messages_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_messages
    ADD CONSTRAINT case_messages_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(case_id) ON DELETE CASCADE;


--
-- Name: case_messages case_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_messages
    ADD CONSTRAINT case_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: cases cases_adoption_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_adoption_request_id_fkey FOREIGN KEY (adoption_request_id) REFERENCES public.adoption_requests(request_id) ON DELETE SET NULL;


--
-- Name: cases cases_blocked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_blocked_by_fkey FOREIGN KEY (blocked_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: cases cases_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: cases cases_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: cases cases_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id) ON DELETE SET NULL;


--
-- Name: cases cases_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.lost_pets(report_id) ON DELETE SET NULL;


--
-- Name: cases cases_report_sighting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_report_sighting_id_fkey FOREIGN KEY (report_sighting_id) REFERENCES public.report_sightings(sighting_id) ON DELETE SET NULL;


--
-- Name: chat_reports chat_reports_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reports
    ADD CONSTRAINT chat_reports_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(case_id) ON DELETE SET NULL;


--
-- Name: chat_reports chat_reports_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reports
    ADD CONSTRAINT chat_reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.case_messages(message_id) ON DELETE SET NULL;


--
-- Name: chat_reports chat_reports_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reports
    ADD CONSTRAINT chat_reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: chat_reports chat_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reports
    ADD CONSTRAINT chat_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: chat_reports chat_reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reports
    ADD CONSTRAINT chat_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: adoption_requests fk_adoption_requests_pet; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adoption_requests
    ADD CONSTRAINT fk_adoption_requests_pet FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id) ON DELETE CASCADE;


--
-- Name: adoption_requests fk_adoption_requests_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adoption_requests
    ADD CONSTRAINT fk_adoption_requests_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: publication_authorization_requests fk_authorization_requests_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_authorization_requests
    ADD CONSTRAINT fk_authorization_requests_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: lost_pets fk_lost_pets_reporter; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_pets
    ADD CONSTRAINT fk_lost_pets_reporter FOREIGN KEY (reporter_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: matches fk_matches_matched_report; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT fk_matches_matched_report FOREIGN KEY (matched_report_id) REFERENCES public.lost_pets(report_id) ON DELETE CASCADE;


--
-- Name: matches fk_matches_pet; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT fk_matches_pet FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id) ON DELETE CASCADE;


--
-- Name: matches fk_matches_report; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT fk_matches_report FOREIGN KEY (report_id) REFERENCES public.lost_pets(report_id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: pet_image_embeddings fk_pet_image_embeddings_image; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_image_embeddings
    ADD CONSTRAINT fk_pet_image_embeddings_image FOREIGN KEY (image_id) REFERENCES public.pet_images(image_id) ON DELETE CASCADE;


--
-- Name: pet_images fk_pet_images_pet; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_images
    ADD CONSTRAINT fk_pet_images_pet FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id) ON DELETE CASCADE;


--
-- Name: pet_vaccines fk_pet_vaccines_pet; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_vaccines
    ADD CONSTRAINT fk_pet_vaccines_pet FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id) ON DELETE CASCADE;


--
-- Name: pets fk_pets_owner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT fk_pets_owner FOREIGN KEY (owner_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: report_image_embeddings fk_report_image_embeddings_report; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_image_embeddings
    ADD CONSTRAINT fk_report_image_embeddings_report FOREIGN KEY (report_id) REFERENCES public.lost_pets(report_id) ON DELETE CASCADE;


--
-- Name: password_reset_codes password_reset_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: report_sighting_entries report_sighting_entries_sighting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_sighting_entries
    ADD CONSTRAINT report_sighting_entries_sighting_id_fkey FOREIGN KEY (sighting_id) REFERENCES public.report_sightings(sighting_id) ON DELETE CASCADE;


--
-- Name: report_sightings report_sightings_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_sightings
    ADD CONSTRAINT report_sightings_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.lost_pets(report_id) ON DELETE CASCADE;


--
-- Name: report_sightings report_sightings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_sightings
    ADD CONSTRAINT report_sightings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: user_blocks user_blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(case_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict gcRJipQJmwaK4RBTUKxmrbxv2X7fP7Qqu5RAZoN94DkweKsW0wd7HBhk3CZ8kLo

