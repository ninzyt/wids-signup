-- Fictional starter events. Edit dates/locations before using with your team.
-- Safe to rerun: existing events, roles, and signup counts are left unchanged.
begin;
insert into public.events (id, title, description, starts_at, location) values
('10000000-0000-0000-0000-000000000001', 'Data & donuts', 'A relaxed meetup to welcome new faces and talk about the term ahead. The setup team arranges tables and refreshments 30 minutes before doors open. Welcome desk execs greet guests and help everyone find a seat.', (current_date + 7 + time '17:00') at time zone 'America/Vancouver', 'UBC · Room to be confirmed'),
('10000000-0000-0000-0000-000000000002', 'Python study night', 'Bring your laptop and help make Python feel a little friendlier. Workshop helpers support attendees during practice exercises. The check-in team welcomes students and shares the session resources.', (current_date + 14 + time '18:00') at time zone 'America/Vancouver', 'UBC · Study space to be confirmed'),
('10000000-0000-0000-0000-000000000003', 'Women in data panel', 'An evening of questions, stories, and career conversations. Room setup starts 45 minutes before the event. Speaker hosts welcome our guests, and the wrap-up team helps return the space to its original layout.', (current_date + 21 + time '17:30') at time zone 'America/Vancouver', 'UBC · Venue to be confirmed')
on conflict (id) do nothing;

insert into public.roles (id, event_id, name, slots) values
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Setup crew', 2),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Welcome desk', 3),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Workshop helper', 3),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Check-in', 2),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Room setup', 3),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Speaker host', 2),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'Wrap-up crew', 2)
on conflict (id) do nothing;
commit;
