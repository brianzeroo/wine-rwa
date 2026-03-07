const http = require('http');

function req(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const request = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, data: body }); }
            });
        });
        request.on('error', reject);
        if (data) request.write(data);
        request.end();
    });
}

async function runTests() {
    console.log('🧪 Starting API Verification Tests\n');

    // Test 1: Products API
    console.log('=== TEST 1: Products ===');
    const products = await req('GET', '/api/products');
    console.log(`Status: ${products.status}`);
    console.log(`Products count: ${products.data.length}`);
    console.log('First product:', JSON.stringify(products.data[0], null, 2));

    // Test 2: Orders API
    console.log('\n=== TEST 2: Orders ===');
    const orders = await req('GET', '/api/orders');
    console.log(`Status: ${orders.status}`);
    console.log(`Orders count: ${orders.data.length}`);

    // Test 3: Discounts API
    console.log('\n=== TEST 3: Discounts ===');
    const discounts = await req('GET', '/api/discounts');
    console.log(`Status: ${discounts.status}`);
    console.log(`Discount codes: ${discounts.data.length}`);
    discounts.data.forEach(d => console.log(` - ${d.code} (${d.type}, value=${d.value}, active=${d.isActive}, usedCount=${d.usedCount})`));

    // Test 4: Create a discount code
    console.log('\n=== TEST 4: Create Discount Code ===');
    const today = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const createDiscount = await req('POST', '/api/discounts', {
        code: 'APITEST20',
        type: 'percentage',
        value: 20,
        minOrderAmount: 0,
        startDate: today,
        endDate: nextMonth,
        isActive: true,
        usageLimit: 100
    });
    console.log(`Status: ${createDiscount.status} (expected 201 or 400 if already exists)`);
    if (createDiscount.data.error) {
        console.log(`Note: ${createDiscount.data.error}`);
    } else {
        console.log(`Created: ${createDiscount.data.code}`);
    }

    // Test 5: Validate the code
    console.log('\n=== TEST 5: Validate Discount Code ===');
    const code = createDiscount.data.code || 'APITEST20';
    const validate = await req('GET', `/api/discounts/${code}`);
    console.log(`Status: ${validate.status} (expected 200)`);
    console.log(`Code: ${validate.data.code}, active=${validate.data.isActive}, type=${validate.data.type}, value=${validate.data.value}`);

    // Test 6: Create order (simulate checkout)
    console.log('\n=== TEST 6: Create Order ===');
    const newOrder = await req('POST', '/api/orders', {
        id: `ORD-APITEST-${Date.now()}`,
        customerName: 'API Test User',
        customerPhone: '0780000001',
        customerEmail: 'apitest@example.com',
        items: [{ id: 'p1', name: 'Test Wine', price: 50000, quantity: 1 }],
        total: 50000,
        discountAmount: 10000,
        finalTotal: 40000,
        status: 'Pending',
        paymentMethod: 'mtn',
        date: new Date().toISOString()
    });
    console.log(`Status: ${newOrder.status} (expected 201)`);

    // Test 7: Verify order saved
    console.log('\n=== TEST 7: Verify Order Persisted ===');
    const ordersAfter = await req('GET', '/api/orders');
    console.log(`Orders count: ${ordersAfter.data.length} (should be +1 from before)`);
    const ourOrder = ordersAfter.data.find(o => o.customerEmail === 'apitest@example.com');
    if (ourOrder) {
        console.log(`✅ Order found! Total: ${ourOrder.finalTotal}, Status: ${ourOrder.status}`);
        console.log(`   Items type: ${typeof ourOrder.items}, is array: ${Array.isArray(ourOrder.items)}`);
    } else {
        console.log('❌ Order NOT found in database!');
    }

    // Test 8: Increment usage
    console.log('\n=== TEST 8: Increment Discount Usage ===');
    const codeToIncrement = validate.data;
    if (codeToIncrement && codeToIncrement.id) {
        const increment = await req('POST', `/api/discounts/${codeToIncrement.id}/increment-usage`);
        console.log(`Status: ${increment.status} (expected 200)`);
        console.log(`New usedCount: ${increment.data.usedCount}`);
    }

    console.log('\n✅ All API tests complete!');
}

runTests().catch(console.error);
