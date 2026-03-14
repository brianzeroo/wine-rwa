import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';

export interface User {
    id: string;
    phone: string;
    name: string;
}

export const registerUser = async (phone: string, pin: string, name: string = 'User'): Promise<User> => {
    const userId = `user${Date.now()}`;

    // Hash the PIN before storing
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create the auth record in the users table
    const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
            id: userId,
            phone,
            password: hashedPin,
            name
        })
        .select()
        .single();

    if (userError) throw new Error(userError.message);

    // Also create a linked customer record if it doesn't exist
    const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

    if (!existingCustomer) {
        await supabase.from('customers').insert({
            id: `cust${Date.now()}`,
            name,
            email: `${phone}@placeholder.com`,
            phone,
            join_date: new Date().toISOString().split('T')[0]
        });
    }

    return {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name
    };
};

export const loginUser = async (phone: string, pin: string): Promise<User | null> => {
    // 1. Fetch user by phone only
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

    if (error || !data) return null;

    // 2. Securely compare the plaintext PIN with the hashed PIN in the database
    const isValid = await bcrypt.compare(pin, data.password);
    if (!isValid) return null;

    return {
        id: data.id,
        phone: data.phone,
        name: data.name
    };
};
