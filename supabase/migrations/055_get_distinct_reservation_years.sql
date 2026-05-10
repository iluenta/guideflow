CREATE OR REPLACE FUNCTION get_distinct_reservation_years(p_tenant_id uuid)
RETURNS TABLE(year int) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT EXTRACT(YEAR FROM checkin_date)::int
  FROM reservations
  WHERE tenant_id = p_tenant_id
  ORDER BY 1 DESC;
$$;
