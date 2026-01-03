-- RPC functions for atomic POS operations
CREATE OR REPLACE FUNCTION decrement_inventory(row_id UUID, decrement_by INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.inventory
  SET quantity_in_stock = quantity_in_stock - decrement_by,
      updated_at = NOW()
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_customer_debt(cust_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.customers
  SET debt_balance = debt_balance + amount
  WHERE id = cust_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
