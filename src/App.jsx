import React, { useState, useEffect } from 'react';

// =========================================================================
// SWITCH BACKEND PARADIGM HERE: Set to "FUNCTION" or "DAB" as needed
// =========================================================================
const BACKEND_PROVIDER = "FUNCTION"; 

function App() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Local Element Form Input States
  const [formMode, setFormMode] = useState('CREATE'); // 'CREATE' or 'UPDATE'
  const [currentId, setCurrentId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  // 1. Dynamic Environment Base Mappings
  const getBackendConfig = () => {
    if (BACKEND_PROVIDER === "DAB") {
      return {
        basePath: '/data-api/rest/Customer',
        buildDeleteUrl: (id) => `/data-api/rest/Customer/CustomerID/${id}`,
        buildUpdateUrl: (id) => `/data-api/rest/Customer/CustomerID/${id}`,
        unwrapData: (json) => json.value || [] // DAB wraps array inside a "value" wrapper
      };
    } else {
      return {
        basePath: '/api/Customer',
        buildDeleteUrl: (id) => `/api/Customer?id=${id}`,
        buildUpdateUrl: (id) => `/api/Customer?id=${id}`,
        unwrapData: (json) => json // Azure Function handles raw root level arrays natively
      };
    }
  };

  const config = getBackendConfig();

  // 2. READ: Initial load triggers dynamic data gathering
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(config.basePath);
      if (!response.ok) {
        throw new Error(`Failed to load database records: ${response.statusText}`);
      }
      const data = await response.json();
      setCustomers(config.unwrapData(data));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. CREATE & UPDATE Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName) return;

    // Table Column Payloads explicitly preserved for both layers
    const payload = { 
      CompanyName: companyName, 
      ContactName: contactName || null, 
      EmailAddress: emailAddress || null 
    };

    try {
      if (formMode === 'CREATE') {
        const response = await fetch(config.basePath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create customer tracking record');
      } else {
        const response = await fetch(config.buildUpdateUrl(currentId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ CustomerID: currentId, ...payload }),
        });
        if (!response.ok) throw new Error('Failed to update customer details profile');
      }

      fetchCustomers();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // 4. DELETE Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer entry?')) return;

    try {
      const response = await fetch(config.buildDeleteUrl(id), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to purge customer record from the environment');
      
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Form State UI Sync Mappings
  const handleEditClick = (customer) => {
    setFormMode('UPDATE');
    setCurrentId(customer.CustomerID);
    setCompanyName(customer.CompanyName);
    setContactName(customer.ContactName || '');
    setEmailAddress(customer.EmailAddress || '');
  };

  const resetForm = () => {
    setFormMode('CREATE');
    setCurrentId(null);
    setCompanyName('');
    setContactName('');
    setEmailAddress('');
  };

  return (
    <div className="maintenance-container">
      <main className="maintenance-box">
        <h1 className="maintenance-title">Customer Maintenance</h1>

        {error && <div className="error-alert">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="inline-form">
          <input 
            type="text" 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company" 
            className="input-field"
            required 
          />
          <input 
            type="text" 
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Contact" 
            className="input-field"
          />
          <input 
            type="email" 
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Email" 
            className="input-field"
          />
          
          <button type="submit" className="btn-add">
            {formMode === 'CREATE' ? 'Add' : 'Save'}
          </button>
          <button type="button" onClick={resetForm} className="btn-clear">
            Clear
          </button>
        </form>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="info-row">Retrieving entries from SQL database...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="5" className="info-row">No records to display.</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.CustomerID}>
                  <td>{customer.CustomerID}</td>
                  <td>{customer.CompanyName}</td>
                  <td>{customer.ContactName || '-'}</td>
                  <td>{customer.EmailAddress || '-'}</td>
                  <td>
                    <button type="button" onClick={() => handleEditClick(customer)} className="action-link edit-link">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(customer.CustomerID)} className="action-link delete-link">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default App;
