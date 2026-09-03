import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientRes = await api.get(`/patients/${id}`);
        setPatient(patientRes.data.data);
        try {
          const assessmentsRes = await api.get(`/assessments/patient/${id}`);
          setAssessments(assessmentsRes.data.data);
        } catch {
          setAssessments([]);
        }
      } catch (err) {
        console.error('Failed to fetch patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!patient) return <div className="text-center py-10">Patient not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold mb-4">{patient.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Age:</span> {patient.age}</div>
          <div><span className="text-gray-500">Gender:</span> {patient.gender}</div>
          <div><span className="text-gray-500">Diagnosis:</span> {patient.diagnosis || 'N/A'}</div>
          <div><span className="text-gray-500">Date:</span> {new Date(patient.date).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Assessments</h2>
        <Link to={`/patients/${id}/assess`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No assessments yet.</p>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Link key={a._id} to={`/patients/${id}/assessments/${a._id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md">
              <div className="flex justify-between">
                <span className="font-medium">{a.specialtyName || 'Assessment'}</span>
                <span className="text-gray-500 text-sm">{new Date(a.date).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
