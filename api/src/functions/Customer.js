const { app } = require('@azure/functions');
const sql = require('mssql'); 

// Central SQL Database Connection Configuration 
const sqlConnectionString = process.env.DATABASE_CONNECTION_STRING;

app.http('Customer', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Establish/pool database connection natively using the raw string variable 
            let pool = await sql.connect(sqlConnectionString);

            // --- 1. READ ALL RECORDS (GET) ---
            if (request.method === 'GET') {
                const result = await pool.request().query(`
                    SELECT CustomerID, CompanyName, ContactName, EmailAddress 
                    FROM [dbo].[Customer]
                    ORDER BY CustomerID DESC
                `);
                
                return { 
                    status: 200, 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.recordset) 
                };
            }

            // --- 2. CREATE RECORD (POST) ---
            if (request.method === 'POST') {
                const body = await request.json();
                
                if (!body.CompanyName) {
                    return { status: 400, body: 'Missing required field: CompanyName' };
                }

                const result = await pool.request()
                    .input('CompanyName', sql.NVarChar(100), body.CompanyName)
                    .input('ContactName', sql.NVarChar(100), body.ContactName || null)
                    .input('EmailAddress', sql.NVarChar(255), body.EmailAddress || null)
                    .query(`
                        INSERT INTO [dbo].[Customer] (CompanyName, ContactName, EmailAddress)
                        VALUES (@CompanyName, @ContactName, @EmailAddress);
                        SELECT SCOPE_IDENTITY() AS CustomerID;
                    `);

                return { 
                    status: 201, 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Customer added successfully', CustomerID: result.recordset[0].CustomerID }) 
                };
            }

            // --- 3. UPDATE RECORD (PUT) ---
            if (request.method === 'PUT') {
                const id = request.query.get('id');
                const body = await request.json();

                if (!id || !body.CompanyName) {
                    return { status: 400, body: 'Missing required query Parameter "id" or payload body properties' };
                }

                await pool.request()
                    .input('CustomerID', sql.Int, id)
                    .input('CompanyName', sql.NVarChar(100), body.CompanyName)
                    .input('ContactName', sql.NVarChar(100), body.ContactName || null)
                    .input('EmailAddress', sql.NVarChar(255), body.EmailAddress || null)
                    .query(`
                        UPDATE [dbo].[Customer]
                        SET CompanyName = @CompanyName, ContactName = @ContactName, EmailAddress = @EmailAddress
                        WHERE CustomerID = @CustomerID
                    `);

                return { status: 200, body: 'Record committed successfully' };
            }

            // --- 4. PURGE RECORD (DELETE) ---
            if (request.method === 'DELETE') {
                const id = request.query.get('id');

                if (!id) {
                    return { status: 400, body: 'Missing required structural query parameter: id' };
                }

                await pool.request()
                    .input('CustomerID', sql.Int, id)
                    .query('DELETE FROM [dbo].[Customer] WHERE CustomerID = @CustomerID');

                return { status: 200, body: 'Record deleted successfully' };
            }

        } catch (dbError) {
            context.error('Database Operation Failure:', dbError.message);
            return { 
                status: 500, 
                body: `Internal Server SQL Error: ${dbError.message}` 
            };
        }
    }
});
