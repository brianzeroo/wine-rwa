import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;
        console.log('Received Webhook from PayPack:', JSON.stringify(body, null, 2));

        // Note: In production you should verify the PayPack webhook signature/secret here
        // to prevent spoofed webhook requests. 
        // Example: if (req.headers['x-paypack-signature'] !== expected) return res.status(401).end();

        const transactionId = body.data?.ref || body.data?.transaction_id || body.data?.id;
        const status = body.data?.status; // 'successful', 'failed', etc.

        if (!transactionId || !status) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        // Initialize Supabase
        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing Supabase variables in webhook environment.');
            return res.status(500).json({ error: 'Configuration Error' });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Find the pending order associated with this transaction ID
        const { data: orderData, error: lookupError } = await supabase
            .from('orders')
            .select('id, status')
            .eq('transaction_id', transactionId)
            .maybeSingle();

        if (lookupError) {
            console.error('Webhook DB Lookup Error:', lookupError);
            return res.status(500).json({ error: 'Database Error searching for transaction' });
        }

        if (!orderData) {
            // We got a webhook for a transaction we don't know about.
            console.log(`Webhook ignored: transaction_id ${transactionId} not found in orders.`);
            return res.status(200).json({ success: true, message: 'Transaction ignored' });
        }

        if (orderData.status === 'Paid') {
            console.log(`Webhook ignored: Order ${orderData.id} already paid.`);
            return res.status(200).json({ success: true, message: 'Already processed' });
        }

        // Determine final order status based on webhook
        let newStatus = 'Pending';
        if (status === 'successful' || status === 'completed') {
            newStatus = 'Paid';
        } else if (status === 'failed' || status === 'cancelled') {
            newStatus = 'Failed';
        }

        // Update the order in the database
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderData.id)
            .select()
            .single();

        if (updateError) {
            console.error('Webhook DB Update Error:', updateError);
            return res.status(500).json({ error: 'Failed to update order status' });
        }

        // Apply Side Effects for Successful Payments
        if (newStatus === 'Paid' && updatedOrder) {
            try {
                // 1. Loyalty Points
                if (updatedOrder.customer_id) {
                    const pointsToAdd = Math.floor(updatedOrder.final_total / 1000);
                    const { data: customer } = await supabase
                        .from('customers')
                        .select('loyalty_points')
                        .eq('id', updatedOrder.customer_id)
                        .maybeSingle();

                    if (customer) {
                        const newPoints = (customer.loyalty_points || 0) + pointsToAdd;
                        await supabase.from('customers').update({ loyalty_points: newPoints }).eq('id', updatedOrder.customer_id);
                    }
                }

                // 2. Discount Usage
                // We don't store the discount ID directly on the order yet, but we could find it by looking up active discounts 
                // However, since `Checkout.tsx` used to do this with the `discountId` state, we should properly
                // store which discount was used in the `orders` table if we have time, or leave it for a future enhancement.
                // For now, if there is a discount_amount > 0, we can try to guess or ignore it if we don't know the exact code.
                console.log(`Order ${updatedOrder.id} successfully processed. Loyalty points applied.`);
            } catch (sideEffectError) {
                console.error('Error applying side effects after payment:', sideEffectError);
                // We don't fail the webhook if side effects fail, to avoid infinite retries from the payment gateway
            }
        }

        console.log(`Successfully updated Order ${orderData.id} to ${newStatus} based on transaction ${transactionId}`);
        res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Internal Server Error processing webhook' });
    }
}
