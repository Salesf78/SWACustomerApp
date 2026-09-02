import { useEffect, useState } from "react";

function App() {
  const emptyCustomer = {
    CompanyName: "",
    ContactName: "",
    EmailAddress: ""
  };

  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [editId, setEditId] = useState(null);

  const loadCustomers = () => {
    fetch("/api/Customer")
      .then(r => r.json())
      .then(data => setCustomers(data.value || []));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const saveCustomer = async () => {
    if (editId) {
      await fetch(`/api/Customer/CustomerID/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(customer)
      });
    } else {
      await fetch("/api/Customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(customer)
      });
    }

    setCustomer(emptyCustomer);
    setEditId(null);
    loadCustomers();
  };

  const editCustomer = c => {
    setEditId(c.CustomerID);

    setCustomer({
      CompanyName: c.CompanyName,
      ContactName: c.ContactName,
      EmailAddress: c.EmailAddress
    });
  };

  const deleteCustomer = async id => {
    if (!window.confirm("Delete customer?")) return;

    await fetch(`/api/Customer/CustomerID/${id}`, {
      method: "DELETE"
    });

    loadCustomers();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Customer Maintenance</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Company"
          value={customer.CompanyName}
          onChange={e =>
            setCustomer({
              ...customer,
              CompanyName: e.target.value
            })
          }
        />

        <input
          placeholder="Contact"
          value={customer.ContactName}
          onChange={e =>
            setCustomer({
              ...customer,
              ContactName: e.target.value
            })
          }
        />

        <input
          placeholder="Email"
          value={customer.EmailAddress}
          onChange={e =>
            setCustomer({
              ...customer,
              EmailAddress: e.target.value
            })
          }
        />

        <button onClick={saveCustomer}>
          {editId ? "Update" : "Add"}
        </button>

        <button
          onClick={() => {
            setCustomer(emptyCustomer);
            setEditId(null);
          }}
        >
          Clear
        </button>
      </div>

      <table border="1">
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
          {customers.map(c => (
            <tr key={c.CustomerID}>
              <td>{c.CustomerID}</td>
              <td>{c.CompanyName}</td>
              <td>{c.ContactName}</td>
              <td>{c.EmailAddress}</td>

              <td>
                <button onClick={() => editCustomer(c)}>
                  Edit
                </button>

                <button
                  onClick={() =>
                    deleteCustomer(c.CustomerID)
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
