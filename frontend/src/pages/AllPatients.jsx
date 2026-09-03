import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function AllPatients() {
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
        <h1 className="text-2xl font-bold">All Patients ({patients.length})</h1>
        <Link to="/patients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + New Patient
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : patients.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No patients yet. Create your first patient.</p>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <Link key={p._id} to={`/patients/${p._id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500 ml-3">{p.age}y, {p.gender}</span>
                </div>
                <span className="text-gray-400 text-sm">{formatDate(p.date)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
