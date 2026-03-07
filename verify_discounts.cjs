const http = require('http');

async function fetchAPI(path, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(`http://localhost:3000${path}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting API Verification ---');

    const testCode = 'APITEST20';

    // 1. Create a new code
    console.log(`\n1. Creating code: ${testCode}`);
    const createRes = await fetchAPI('/api/discounts', {
        method: 'POST',
        body: {
            code: testCode,
            type: 'percentage',
            value: 20,
            minOrderAmount: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
            isActive: true,
            usageLimit: 0
        }
    });
    console.log(`Status: ${createRes.status}`);
    console.log('Response:', createRes.data);

    if (createRes.status !== 201) {
        console.error('FAILED to create code.');
    }

    // 2. Test Case Insensitivity (fetch with lowercase)
    console.log(`\n2. Fetching code (lowercase): ${testCode.toLowerCase()}`);
    const getRes = await fetchAPI(`/api/discounts/${testCode.toLowerCase()}`);
    console.log(`Status: ${getRes.status}`);
    console.log('Response:', getRes.data);

    if (getRes.status !== 200 || getRes.data.code !== testCode) {
        console.error('FAILED case-insensitivity fetch.');
    }

    // 3. Test Duplication Prevention
    console.log(`\n3. Attempting to create duplicate code: ${testCode}`);
    const dupRes = await fetchAPI('/api/discounts', {
        method: 'POST',
        body: {
            code: testCode,
            type: 'percentage',
            value: 10,
            minOrderAmount: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            isActive: true,
            usageLimit: 0
        }
    });
    console.log(`Status: ${dupRes.status}`);
    console.log('Response:', dupRes.data);

    if (dupRes.status !== 400) {
        console.error('FAILED duplication prevention.');
    }

    // 4. Test Deletion
    const idToDelete = createRes.data.id || (getRes.data && getRes.data.id);
    if (idToDelete) {
        console.log(`\n4. Deleting code ID: ${idToDelete}`);
        const delRes = await fetchAPI(`/api/discounts/${idToDelete}`, { method: 'DELETE' });
        console.log(`Status: ${delRes.status}`);
        console.log('Response:', delRes.data);
    } else {
        console.log('\n4. Skipping deletion (no ID found)');
    }

    console.log('\n--- API Verification Complete ---');
}

runTests().catch(err => {
    console.error('Connection error. Is the server running on port 3000?', err.message);
});
