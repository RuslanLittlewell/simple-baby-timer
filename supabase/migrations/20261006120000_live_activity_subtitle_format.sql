-- Subtitle format each installation's Live Activity widget understands.
-- 1: plain "Last feeding: HH:mm" text (builds without the elapsed-time widget).
-- 2: subtitle may carry the last feeding timestamp, rendered as live elapsed time.
alter table public.live_activity_devices
  add column if not exists subtitle_format smallint not null default 1;
