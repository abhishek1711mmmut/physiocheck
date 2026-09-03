import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data.data);
      } catch (err) {
        console.error('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <Link to="/patients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + New Patient
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Patients</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{patients.length}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Patients</h2>
      {loading ? (
        <p>Loading...</p>
      ) : patients.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No patients yet. Create your first patient.</p>
      ) : (
        <div className="space-y-3">
          {patients.slice(0, 10).map((p) => (
            <Link key={p._id} to={`/patients/${p._id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500 ml-3">{p.age}y, {p.gender}</span>
                </div>
                <span className="text-gray-500 text-sm">{p.diagnosis || 'No diagnosis'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
