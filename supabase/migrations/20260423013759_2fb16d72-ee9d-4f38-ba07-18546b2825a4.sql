ALTER TYPE public.grow_stage ADD VALUE IF NOT EXISTS 'nursery';
ALTER TYPE public.grow_stage ADD VALUE IF NOT EXISTS 'dry';
ALTER TYPE public.grow_stage ADD VALUE IF NOT EXISTS 'cure';

ALTER TABLE public.parameters
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;