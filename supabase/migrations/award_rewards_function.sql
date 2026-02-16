-- Create a function to securely award XP and DowdBucks
-- This runs with elevated privileges (SECURITY DEFINER) to bypass RLS restrictions on 'profiles' update.

CREATE OR REPLACE FUNCTION public.award_student_rewards(
    p_student_id UUID,
    p_xp_amount INTEGER,
    p_currency_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        xp = COALESCE(xp, 0) + p_xp_amount,
        balance = COALESCE(balance, 0) + p_currency_amount
    WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
