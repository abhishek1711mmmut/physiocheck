import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SelectSpecialty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await api.get('/specialties');
        setSpecialties(res.data.data);
      } catch (err) {
        console.error('Failed to fetch specialties');
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialties();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Select Specialty</h1>
      <p className="text-gray-600 mb-6">Choose a specialty to begin the assessment</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {specialties.map((s) => (
          <button key={s._id} onClick={() => navigate(`/patients/${id}/assess/${s._id}`)}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md text-center cursor-pointer border-2 border-transparent hover:border-blue-500">
            <span className="text-3xl block mb-2">{s.icon}</span>
            <span className="font-medium text-gray-800">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
